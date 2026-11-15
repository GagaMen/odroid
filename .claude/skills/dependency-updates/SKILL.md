---
name: dependency-updates
description: Work through the pending updates that scripts/update-check reports -- charts, images, npm, host tool pins -- and roll them out one at a time with verification.
disable-model-invocation: true
---

# Dependency updates

Run when the monthly update check has reported updates. The goal is every pending update either **deployed
and verified** or **deliberately deferred** with a reason, each as its own commit on `main`.

Read `AGENTS.md` first if it is not in context; its three traps (vendored archives, file-provisioned
alerting, the non-stock host) all bite during updates. Helm is `microk8s.helm3`; `helm` is only a
shell alias and does not exist for scripts or subprocesses. Both scripts below find it themselves.

## 1. Inventory

Run `scripts/update-check`. It compares every pin in the working tree -- chart dependencies,
every image in a chart's `values.yaml`, `package.json`, and the host pins listed in
`scripts/update-check.yaml` -- with what its registry publishes, and prints the ones that are not
current. Each row is a candidate; `--all` shows the current ones too.

- `update`: a newer version written the same way as the pinned one exists.
- `held`: a newer major exists that `scripts/update-check.yaml` keeps the pin away from, with the
  reason. Check whether the reason still holds; if it does, the pin stays.
- `moving`: a tag such as `latest`, which cannot be compared. Nothing to do.
- `error`: the lookup failed. Find out why before going on; a failed lookup hides updates.

Done when the check ends with `0 failed` and every `update` row is on the candidate list.

## 2. Assess each candidate

For every chart bump run `scripts/chart_compare.py <repository> <chart> <current> <target>` with the
repository exactly as `Chart.yaml` lists it. It fails when the target does not exist, which is the
first check.

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

Order the updates, then present the table (update, schema work, risk) and the
order with its reasons. Wait for the user's approval before changing anything in the cluster;
this is their production box.

Default ordering, adjust with reason:

1. Backup path first: Velero and its plugins, then snapshot-controller -- every later step leans
   on a working backup.
2. Isolated single-image apps.
3. Grafana, then Loki, then Alloy: consumer of the datasources, receiver, sender.
4. Prometheus last: the alerting pipeline depends on it.
5. Major versions and anything with migration notes after the routine ones, each alone.
6. Pins outside the charts last; they do not touch the cluster. npm: edit `package.json`, run
   `npm install`, then `npm run generate:all` (must leave no diff) and `release_diff.py`, which
   exercises the Bitwarden CLI. Host pins under `ansible/`: edit the
   role default; the user runs the playbook (`ansible-playbook site.yml -K --tags <role>`).

## 4. Roll out one update at a time

Repeat for each update, in order. Finish one completely before starting the next, so a problem
has exactly one suspect.

1. **Apply.** Edit the version in `Chart.yaml` or the image tag in `values.yaml`.
   An image tag is repeated in two more places: the main image's tag is the wrapper's
   `appVersion` in `Chart.yaml` (it sets the `app.kubernetes.io/version` label), and every
   image's tag is a default in the `README.md` configuration table.
   `grep -rn '<old-tag>' charts/<name>` finds them; bring them to the new tag in the same commit.
2. **Schema.** For each added key not covered: extend `charts/<name>/values.schema.ts` (with a doc
   comment), then `npm run generate:<name>` **and** `npm run generate:platform`. Commit the schema
   change separately and place it *before* the bump, so every commit renders on its own.
3. **Vendor.** `microk8s.helm3 dependency update charts/<name>` for chart bumps;
   `microk8s.helm3 dependency list charts/<name>` must say `ok`.
4. **Diff against the cluster.** `scripts/release_diff.py` (repackages `platform/`, runs a
   server-side dry run, compares with the deployed revision). The change must match the
   assessment: typically the image, chart labels, and whatever the release notes announced.
   Anything unexplained stops the rollout until it is explained.
5. **Deploy**: `scripts/helm-platform upgrade`. The secrets come from Bitwarden, so this and
   step 4 need an unlocked vault (`BW_SESSION`); the user unlocks it, never you.
   Then `kubectl rollout status` for each changed Deployment/StatefulSet/DaemonSet.
6. **Verify** per [`verification.md`](verification.md). Done when that service's checks pass
   and every error seen is either explained there or explained by you.
7. **Commit.** English message in the repository's style: lowercase subject saying what changed
   and why, body with what the upgrade changes and how it was verified. Run the security
   checklist from `AGENTS.md` on the commit.

If a step fails, stop and report; roll back with `microk8s.helm3 rollback platform <revision> -n platform`
only with the user's agreement.

## 5. Wrap up

Report a table of every update with its result, anything deferred and why, open checks that
need a browser, notifications the user may have received, and anything that surprised you.
Pushing is the user's (`git push` from their own terminal when the session has no SSH key).

## What the update check cannot see

- **A changed version format.** "Newer" is the highest published version written like the pinned
  one. A project that starts writing its versions differently (`1.76` instead of `1.76.0`, a
  dropped `v`) keeps showing as current. When a pin has been current for suspiciously long, look
  at the registry.
- **Whether an image has an `arm64` build.** A tag can exist before all its architectures do;
  step 2 checks that.
- **Advisories.** The check reports versions, not vulnerabilities. GitHub's security alerts for
  the npm packages are separate and stay on.
