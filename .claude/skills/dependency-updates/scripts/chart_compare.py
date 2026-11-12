#!/usr/bin/env python3
"""Compare two versions of an upstream Helm chart before bumping a wrapper.

Usage:
  chart_compare.py <repository> <chart> <old-version> [<new-version>]

<repository> is what the wrapper's Chart.yaml lists, e.g.
  oci://ghcr.io/grafana-community/helm-charts
  https://charts.longhorn.io
Without <new-version> the latest release is used: the highest version by
semver, pre-releases excluded. "Latest" never means "most recently published":
projects backport fixes to older lines, and the newest upload is then a lower
version than the one already running.

Prints the latest release, appVersion and subchart versions of
both, the values keys that were added or removed (what the strict wrapper
schemas care about), the files that changed, and the head of CHANGELOG.md
when the chart ships one. Pulling a version that does not exist fails,
which is itself the answer to "is this version real".
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

import yaml


def helm_binary():
    for candidate in (os.environ.get("HELM"), "helm", "microk8s.helm3", "/snap/bin/microk8s.helm3"):
        if candidate and shutil.which(candidate):
            return candidate
    sys.exit("no helm binary found; set HELM=<path>")


HELM = helm_binary()


def chart_ref(repo, chart):
    """Arguments that make `helm pull` / `helm show` find the chart."""
    if repo.startswith("oci://"):
        return [f"{repo.rstrip('/')}/{chart}"]
    return [chart, "--repo", repo]


def release_key(version):
    """Sort key for a release version; None for pre-releases and anything that is not semver."""
    match = re.fullmatch(r"v?(\d+)\.(\d+)\.(\d+)(\+[0-9A-Za-z.-]+)?", str(version))
    return tuple(int(part) for part in match.groups()[:3]) if match else None


def latest_version(repo, chart):
    if repo.startswith("oci://"):
        # Helm resolves a missing --version to the highest semver tag and
        # skips pre-releases unless --devel is given.
        out = subprocess.run([HELM, "show", "chart", *chart_ref(repo, chart)],
                             capture_output=True, text=True, check=True).stdout
        return yaml.safe_load(out)["version"]
    req = urllib.request.Request(repo.rstrip("/") + "/index.yaml", headers={"User-Agent": "Helm/3"})
    entries = yaml.safe_load(urllib.request.urlopen(req).read())["entries"][chart]
    releases = [e["version"] for e in entries if release_key(e["version"])]
    if not releases:
        sys.exit(f"{chart} has no release version in {repo}")
    return max(releases, key=release_key)


def pull(repo, chart, version, into):
    dest = os.path.join(into, version)
    os.makedirs(dest)
    result = subprocess.run([HELM, "pull", *chart_ref(repo, chart), "--version", version, "--untar", "--untardir", dest],
                            capture_output=True, text=True)
    if result.returncode:
        sys.exit(f"{chart} {version} could not be pulled from {repo} -- it probably does not exist:\n"
                 f"{result.stderr.strip()}")
    return os.path.join(dest, chart)


def value_keys(node, prefix=""):
    keys = set()
    if isinstance(node, dict):
        for key, child in node.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            keys.add(path)
            keys |= value_keys(child, path)
    return keys


def files(root):
    found = {}
    for base, dirs, names in os.walk(root):
        # Vendored subcharts are compared through their versions instead.
        dirs[:] = [d for d in dirs if os.path.join(base, d) != os.path.join(root, "charts")]
        for name in names:
            path = os.path.join(base, name)
            with open(path, "rb") as handle:
                found[os.path.relpath(path, root)] = handle.read()
    return found


def describe(chart_dir):
    meta = yaml.safe_load(open(os.path.join(chart_dir, "Chart.yaml")))
    deps = [(d["name"], d["version"]) for d in meta.get("dependencies") or []]
    return meta.get("version"), meta.get("appVersion"), deps


def main():
    if len(sys.argv) not in (4, 5):
        sys.exit(__doc__)
    repo, chart, old = sys.argv[1:4]
    latest = latest_version(repo, chart)
    new = sys.argv[4] if len(sys.argv) == 5 else latest
    print(f"latest release: {latest}")

    with tempfile.TemporaryDirectory() as tmp:
        old_dir, new_dir = pull(repo, chart, old, tmp), pull(repo, chart, new, tmp)
        for label, chart_dir in (("old", old_dir), ("new", new_dir)):
            version, app, deps = describe(chart_dir)
            print(f"{label}: chart {version}, app {app}, subcharts {deps}")

        old_keys = value_keys(yaml.safe_load(open(os.path.join(old_dir, "values.yaml"))))
        new_keys = value_keys(yaml.safe_load(open(os.path.join(new_dir, "values.yaml"))))
        print("values keys added:", sorted(new_keys - old_keys) or "none")
        print("values keys removed:", sorted(old_keys - new_keys) or "none")

        old_files, new_files = files(old_dir), files(new_dir)
        changed = sorted(p for p in old_files.keys() & new_files.keys() if old_files[p] != new_files[p])
        print("files changed:", changed or "none")
        print("files added:", sorted(new_files.keys() - old_files.keys()) or "none")
        print("files removed:", sorted(old_files.keys() - new_files.keys()) or "none")

        changelog = os.path.join(new_dir, "CHANGELOG.md")
        if os.path.exists(changelog):
            print("\nCHANGELOG.md (head):")
            print("".join(open(changelog).readlines()[:40]))


if __name__ == "__main__":
    main()
