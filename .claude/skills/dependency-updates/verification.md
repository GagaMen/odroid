# Verifying an update, per service

What to check after rolling out one update, and which noise to expect. The general gate
applies to every service: rollout finished, pod `Running` with zero restarts, no `level=error`
in the logs that outlives the restart.

Services are reached through their ClusterIP from the host (`kubectl get svc`); no port-forward
is needed.

## Velero and snapshot-controller

The backup path is the safety net for every later step, so it is verified by a real backup:

```bash
velero -n platform backup create verify-<what>-<date> --from-schedule local-daily --wait
kubectl -n platform get datauploads.velero.io -l velero.io/backup-name=verify-<what>-<date> \
  -o custom-columns=PVC:.spec.sourcePVC,PHASE:.status.phase
kubectl get volumesnapshot,volumesnapshotcontent -A
```

Done when the backup is `Completed`, every labelled PVC has a `Completed` DataUpload (compare the
count with the last `local-daily-*` backup), and no VolumeSnapshot is left behind. `--from-schedule`
keeps the selector and settings of the real backups; the verification backup expires with the
schedule's TTL.

Expected noise: snapshot-controller logs `failed to get snapshotContent` / `not found` for
snapshots Velero already deleted after the upload. That is a cleanup race, not a failure.

## Grafana

- Log free of `plugin.notRegistered`, `unlinkat`, `read-only file system` (see the
  `preinstall_auto_update` comment in `charts/grafana/values.yaml`).
- `provisioning.alerting ... finished to provision alerting` after startup.
- Expected noise: `file has invalid suffix '..data'` (ConfigMap symlinks), and `Detected stale
  state entry` from alert rules cleaning up states of pods that just rolled.
- A grep for `error` also matches `ErrorCode:` in the plugin update checker lines; filter on
  `level=error`.

## Loki

- `curl http://<loki>:3100/ready` answers 200.
- Ingestion continues:
  `curl -G http://<loki>:3100/loki/api/v1/query --data-urlencode 'query=sum by (namespace) (count_over_time({namespace=~".+"}[3m]))'`
  returns lines for every namespace.
- Expected noise on a restart of the single replica: memberlist fast-join failed, `empty ring`,
  and `Recovered from WAL segments with errors` (the last seconds before the restart may be lost;
  no action needed).

## Alloy

- Logs keep arriving in Loki (query above).
- Expected noise for a minute or two after a restart: `loki.write` drops batches with
  `entry too far behind` -- Alloy re-reads old entries and Loki rejects them as older than its
  acceptance window. It must stop on its own; if it continues, something else is wrong.

## Prometheus

- `/-/ready` answers 200.
- `/api/v1/targets?state=active`: every target `up` once each has been scraped (`unknown` right
  after the restart only means "not scraped yet").
- `node_systemd_unit_state` and `node_textfile_mtime_seconds` have fresh samples.
- Expected side effect: while Prometheus restarts, Grafana cannot evaluate rules with
  `execErrState: Error`; they send a datasource-error notification and resolve within a minute
  or two. Tell the user a notification may have arrived.

## Homepage and other single-image apps

- Service answers 200 (`curl -H "Host: <ingress host>" http://<svc>:<port>/`), log has no errors.
- Widgets render client-side; whether they show data can only be judged in a browser, so name
  that as an open check in the summary.
