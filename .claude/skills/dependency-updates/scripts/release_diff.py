#!/usr/bin/env python3
"""Show what an upgrade of the platform release would change in the cluster.

Usage (from the repository root):
  release_diff.py [--no-dependency-update]

Repackages the umbrella (`helm dependency update platform/`, skip with the
flag), runs `helm upgrade --dry-run=server` and compares its manifest with
the one stored for the deployed revision.

A server-side dry run is used on purpose: `helm template` knows neither the
cluster's API versions nor `lookup`, so it reports false differences
(capability-gated MetalLB resources missing, PVC volumeName dropped).

Output: changed, added and removed resources, then the changed lines per
resource with chart/version labels filtered out. Secret contents are never
printed, only the fact that a Secret changed. Hooks and tests are absent
from the stored manifest and never show up as added.
"""
import difflib
import hashlib
import os
import shutil
import subprocess
import sys

import yaml

RELEASE, NAMESPACE, CHART, VALUES = "platform", "platform", "platform/", "platform/values.yaml"
NOISE = ("helm.sh/chart", "app.kubernetes.io/version")


def helm_binary():
    for candidate in (os.environ.get("HELM"), "helm", "microk8s.helm3", "/snap/bin/microk8s.helm3"):
        if candidate and shutil.which(candidate):
            return candidate
    sys.exit("no helm binary found; set HELM=<path>")


HELM = helm_binary()


def helm(*args):
    result = subprocess.run([HELM, *args], capture_output=True, text=True)
    if result.returncode:
        sys.exit(f"helm {args[0]} failed:\n{result.stderr[-2000:]}")
    return result.stdout


def resources(manifest):
    found = {}
    for doc in yaml.safe_load_all(manifest):
        if doc:
            meta = doc["metadata"]
            found[(doc["kind"], meta.get("namespace", ""), meta["name"])] = doc
    return found


def digest(doc):
    return hashlib.sha256(yaml.safe_dump(doc, sort_keys=True).encode()).hexdigest()


def label(key):
    kind, namespace, name = key
    return f"{kind}/{namespace + '/' if namespace else ''}{name}"


def main():
    if "--no-dependency-update" not in sys.argv:
        helm("dependency", "update", "platform/")

    live = resources(helm("get", "manifest", RELEASE, "-n", NAMESPACE))
    dry_run = helm("upgrade", RELEASE, CHART, "-n", NAMESPACE, "-f", VALUES, "--dry-run=server")
    new = resources(dry_run.split("MANIFEST:", 1)[1].split("\nNOTES:", 1)[0])

    changed = [k for k in new if k in live and digest(new[k]) != digest(live[k])]
    print("changed:", [label(k) for k in changed] or "none")
    print("added:", [label(k) for k in new if k not in live] or "none")
    print("removed:", [label(k) for k in live if k not in new] or "none")

    for key in changed:
        if key[0] == "Secret":
            print(f"\n{label(key)}: content changed (not shown)")
            continue
        lines = [
            line for line in difflib.unified_diff(
                yaml.safe_dump(live[key]).splitlines(), yaml.safe_dump(new[key]).splitlines(), lineterm="", n=0)
            if line[:1] in "+-" and not line.startswith(("+++", "---")) and not any(n in line for n in NOISE)
        ]
        if lines:
            print(f"\n{label(key)}:")
            print("\n".join(lines[:60]))


if __name__ == "__main__":
    main()
