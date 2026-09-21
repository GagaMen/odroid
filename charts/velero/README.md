# Velero

Helm chart wrapper for [vmware-tanzu/velero](https://github.com/vmware-tanzu/helm-charts/tree/main/charts/velero).

Velero snapshots the labelled PVCs through the CSI snapshot API
([snapshot-controller](../snapshot-controller/README.md), class `longhorn-snapshot`),
uploads the snapshot data with **Kopia** and deletes the snapshot again. Kopia encrypts
everything it writes, so the objects in the bucket are ciphertext -- which is what makes
an external S3 bucket acceptable as a backup target.

```
Schedule ─▶ Backup ─▶ VolumeSnapshot (Longhorn) ─▶ DataUpload ─▶ Kopia ─▶ S3
```

## What is backed up

Only PVCs, selected by the label `odroid/backup-policy`. Workloads, ConfigMaps and
Secrets come from this repository, so a restore means "put the data back", not "rebuild
the cluster". The data mover creates a fresh PV on restore, which is why the PV object
itself is not part of the backup.

| Label value | daily | weekly | monthly |
|-------------|-------|--------|---------|
| `gfs` | ✅ | ✅ | ✅ |
| `weekly` | – | ✅ | – |

Cron times are local time (`scope.timezone`, default `Europe/Berlin`); without it Velero
would read them as UTC.

| Tier | Cron (local target) | Retention |
|------|---------------------|-----------|
| daily | `0 4 * * 1-6` | 7 days |
| weekly | `0 4 * * 0` | 8 weeks |
| monthly | `0 5 1 * *` | 12 months |

Because Kopia deduplicates, the weekly and monthly copies cost little extra space.

Label a PVC in `platform/values.yaml`, next to the storage class:

```yaml
adguard:
  persistence:
    conf:
      labels:
        odroid/backup-policy: gfs
```

## Targets

Each entry in `targets` becomes a `BackupStorageLocation` **and** one Schedule per tier.
The key is also the profile name in the credentials file, so a target needs no per-target
secret.

| Key | Default | Description |
|-----|---------|-------------|
| `targets.local.enabled` | `true` | RustFS in this cluster |
| `targets.local.s3Url` | `http://platform-rustfs-svc.platform.svc:9000` | In-cluster endpoint |
| `targets.cloud.enabled` | `false` | External S3, off until a provider is picked |
| `targets.<t>.scheduleOffsetMinutes` | `0` / `30` | Staggers targets so they do not upload at once |

To switch the cloud target on, in `platform/values.yaml`:

```yaml
velero:
  targets:
    cloud:
      enabled: true
      bucket: my-bucket
      region: eu-central-1
      s3Url: https://s3.example.com
      accessKey: <key>
      secretKey: <secret>
```

The credentials file itself is rendered by the platform chart
(`platform/templates/velero-credentials.yaml`) as the secret `velero-credentials`: it
combines the RustFS keys with the cloud keys, so the RustFS credentials exist in exactly
one place.

## The Kopia repository password

`repositoryPassword` is required. Velero would otherwise create the repository with a
well-known default password, and the password of an existing Kopia repository cannot be
changed.

**Keep a copy outside the cluster** (password manager). Without it, no backup in either
target can be restored. The secret carries `helm.sh/resource-policy: keep` so that an
uninstall does not take it away.

## First rollout

Helm installs a chart's `crds/` directory only on **install**, never on upgrade, so
adding this chart to an existing release fails with `no matches for kind
"BackupStorageLocation"`. Apply the CRDs once by hand, then deploy:

```bash
tar xzf platform/charts/velero-1.0.0.tgz -C /tmp
kubectl apply --server-side -f /tmp/velero/charts/velero/crds/
```

Later chart upgrades are covered by the chart's own pre-upgrade job (`upgradeCRDs`).

## CLI

Restores are hard to follow without the CLI. Install it for your user (no root needed);
use the version matching the chart's `appVersion`:

```bash
VELERO_VERSION=v1.18.2
curl -sSfL "https://github.com/vmware-tanzu/velero/releases/download/${VELERO_VERSION}/velero-${VELERO_VERSION}-linux-arm64.tar.gz" \
  | tar -xz -C /tmp
mkdir -p ~/.local/bin && mv /tmp/velero-${VELERO_VERSION}-linux-arm64/velero ~/.local/bin/
velero version --namespace platform
```

Velero runs in the release namespace, so every command needs `-n platform`. Set
`export VELERO_NAMESPACE=platform` to avoid repeating it.

`velero backup describe --details` additionally downloads files from the backup store.
Run from the host that fails, because `platform-rustfs-svc.platform.svc` only resolves
inside the cluster; the backup itself is unaffected. Read the per-volume state with
`kubectl -n platform get datauploads` instead, or port-forward RustFS and map the name
in `/etc/hosts`.

## Runbook

### Check the state

```bash
velero backup-location get                 # both targets should be Available
velero schedule get
velero backup get
velero backup describe <name> --details    # includes the DataUpload per volume
velero backup logs <name>
```

### Back up now

```bash
velero backup create manual-$(date +%F) --from-schedule local-weekly --wait
```

### Restore a volume

Restoring replaces the data of a PVC, so the workload must let go of it first. Example
for Grafana:

```bash
# 1. pick a backup
velero backup get

# 2. stop the workload
kubectl -n monitoring scale deployment platform-grafana --replicas=0

# 3. remove the PVC (the PV stays if the storage class retains it)
kubectl -n monitoring delete pvc platform-grafana

# 4. restore PVC and data
velero restore create --from-backup <backup> \
  --include-resources persistentvolumeclaims \
  --selector odroid/backup-policy=weekly --wait
velero restore describe <restore> --details

# 5. bring the workload back and let Helm own the PVC again
kubectl -n monitoring scale deployment platform-grafana --replicas=1
helm upgrade platform ./platform -n platform -f platform/values.yaml
```

After the test, delete the namespace **and** the volumes it left behind: a PVC on
`longhorn-retain` keeps its PV, and the Longhorn volume outlives that too.

```bash
kubectl delete namespace restore-test
kubectl delete pv <released pv>
kubectl -n longhorn delete volumes.longhorn.io <same name>
```

### Test a restore without touching production

```bash
velero restore create verify-$(date +%F) --from-backup <backup> \
  --namespace-mappings adguard:restore-test --wait

kubectl -n restore-test get pvc
# mount it and compare against the original, then:
kubectl delete namespace restore-test
```

## Notes

- The upstream chart binds Velero to `cluster-admin`. Velero has to be able to restore
  anything, so this is by design upstream.
- The chart has no namespace override, so Velero runs in the namespace of the release
  (`platform`).
- `backupsEnabled` and `snapshotsEnabled` are off: this wrapper renders the
  BackupStorageLocations itself, and CSI data movement needs no VolumeSnapshotLocation.
- Metrics are exposed with the `prometheus.io/scrape` pod annotations the existing
  Prometheus already acts on.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:velero
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
