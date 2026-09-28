---
name: dependency-updates
description: Work through pending chart and image updates -- open Dependabot PRs plus what Dependabot cannot see -- and roll them out one at a time with verification.
disable-model-invocation: true
---

# Dependency updates

Run when Dependabot has announced updates. The goal is every pending update either **deployed
and verified** or **deliberately deferred** with a reason, each as its own commit on `main`.

Read `AGENTS.md` first if it is not in context; its three traps (vendored archives, file-provisioned
alerting, the non-stock host) all bite during updates. Helm is `microk8s.helm3`; `helm` is only a
shell alias and does not exist for scripts or subprocesses. Both scripts below find it themselves.

## 1. Inventory

Collect every candidate. Three sources, because Dependabot alone misses updates:

1. **Open Dependabot PRs.** `gh` may be missing; the repository is public, so use the API
   (`<owner>/<repo>` from `git remote -v`):
   `curl -s "https://api.github.com/repos/<owner>/<repo>/pulls?state=open&per_page=100"`.
   Fetch their branches. When SSH is unavailable, fetch read-only over HTTPS:
   `git fetch https://github.com/<owner>/<repo>.git '+refs/heads/main:refs/remotes/origin/main' '+refs/heads/dependabot/*:refs/remotes/origin/dependabot/*' --prune`
2. **PRs Dependabot closed as "update no longer possible"** since the last run. That message
   means its version lookup came back empty, usually a blocked host (see Dependabot blind spots
   below), not that nothing is pending.
3. **Charts Dependabot cannot reach**, listed in the comment at the top of
   `.github/dependabot.yml`. Check each by hand with `scripts/chart_compare.py <repo> <chart> <current>`,
   which prints the latest published version.

Done when every Helm dependency in `charts/*/Chart.yaml` and every image Dependabot tracks is
either on a candidate list or confirmed current.

## 2. Assess each candidate

For every chart bump run `scripts/chart_compare.py <repository> <chart> <current> <target>` with the
repository exactly as `Chart.yaml` lists it. It fails when the target does not exist, which is the
first check: a PR can propose a version of a *different* chart (see blind spots). Also compare the
target with "latest published" and prefer the latest when it is newer than the PR.

Per candidate, record:

- **Existence** of the target and, for images, an `arm64` build (Docker Hub / GitHub releases).
- **New or removed values keys.** Every wrapper has a strict `values.schema.ts`
  (`additionalProperties: false`), and `platform/values.schema.ts` imports all of them. A new
  upstream key fails validation unless the wrapper schema knows it -- unless it sits under a field
  the schema types as plain `object`. Check the wrapper's `values.schema.ts` for each added key.
- **What actually changes**: app version, subchart versions, changed templates, release notes /
  CHANGELOG / upgrade notes (for majors, read the upstream "Upgrading" section).
- **Risk**, from the above.

## 3. Plan and get approval

Order the updates, then present the table (update, source PR or manual, schema work, risk) and the
order with its reasons. Wait for the user's approval before changing anything in the cluster;
this is their production box.

Default ordering, adjust with reason:

1. Backup path first: Velero and its plugins, then snapshot-controller -- every later step leans
   on a working backup.
2. Isolated single-image apps.
3. Grafana, then Loki, then Alloy: consumer of the datasources, receiver, sender.
4. Prometheus last: the alerting pipeline depends on it.
5. Major versions and anything with migration notes after the routine ones, each alone.

## 4. Roll out one update at a time

Repeat for each update, in order. Finish one completely before starting the next, so a problem
has exactly one suspect.

1. **Apply.** From a PR: `git cherry-pick origin/<branch>` (history is linear; Dependabot closes the
   PR itself once the change is on `main`). Manual: edit the version in `Chart.yaml` or the image
   tag in `values.yaml`.
2. **Schema.** For each added key not covered: extend `charts/<name>/values.schema.ts` (with a doc
   comment), then `npm run generate:<name>` **and** `npm run generate:platform`. Commit the schema
   change separately and place it *before* the bump, so every commit renders on its own.
3. **Vendor.** `microk8s.helm3 dependency update charts/<name>` for chart bumps;
   `microk8s.helm3 dependency list charts/<name>` must say `ok`.
4. **Diff against the cluster.** `scripts/release_diff.py` (repackages `platform/`, runs a
   server-side dry run, compares with the deployed revision). The change must match the
   assessment: typically the image, chart labels, and whatever the release notes announced.
   Anything unexplained stops the rollout until it is explained.
5. **Deploy** without `--wait`:
   `microk8s.helm3 upgrade --install platform platform/ -n platform -f platform/values.yaml`
   Then `kubectl rollout status` for each changed Deployment/StatefulSet/DaemonSet.
6. **Verify** per [`verification.md`](verification.md). Done when that service's checks pass
   and every error seen is either explained there or explained by you.
7. **Commit.** English message in the repository's style: lowercase subject saying what changed
   and why, body with what the upgrade changes and how it was verified. Cherry-picked Dependabot
   commits keep their message. Run the security checklist from `AGENTS.md` on the commit.

If a step fails, stop and report; roll back with `microk8s.helm3 rollback platform <revision> -n platform`
only with the user's agreement.

## 5. Wrap up

Report a table of every update with its result, anything deferred and why, open checks that
need a browser, notifications the user may have received, and anything that surprised you.
Pushing is the user's (`git push` from their own terminal when the session has no SSH key).

## Dependabot blind spots

- **Egress allowlist.** Update jobs run behind a proxy that only reaches allowlisted hosts:
  ghcr.io, Docker Hub, quay.io, and a few named chart repositories. A chart repository outside it
  answers 403, the lookup comes back empty, and Dependabot silently closes open PRs as "update no
  longer possible". The job log (Actions run → Dependabot job) shows `egress not allowlisted <host>`.
  Fix by pulling the chart from an allowlisted OCI registry when the project publishes one (check
  `ghcr.io/<org>/.../<chart>` tags; render before/after must be identical); otherwise add the chart
  to the list in `.github/dependabot.yml`. A `helm-registry` entry without credentials is rejected
  by GitHub even for public repositories.
- **Sibling charts.** For classic HTTP repositories Dependabot searches by name prefix and takes
  the highest version among all matches (dependabot-core#13789), e.g. `prometheus-operator-crds`
  for `prometheus`. OCI sources are immune; the check in step 2 catches the rest.
- **Newer versions.** A PR is pinned to what existed when it was opened; step 2 compares with the
  latest published version.
