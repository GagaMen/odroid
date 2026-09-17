# RustFS

Helm chart wrapper for [rustfs](https://charts.rustfs.com), an S3-compatible object store.

RustFS is the **local** backup target for Velero. Velero encrypts every backup with
Kopia before uploading, so the objects in this bucket are ciphertext.

Deployed in **standalone** mode: one pod, one Longhorn volume. Distributed mode needs at
least two nodes for erasure coding and has nothing to spread across on a single node.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `bucket.name` | `velero` | Bucket created by a post-install hook |
| `bucket.image` | `rclone/rclone:1.75.1` | S3 client used by that hook |
| `rustfs.storageclass.name` | `longhorn-retain` | StorageClass of the data volume |
| `rustfs.storageclass.dataStorageSize` | `20Gi` | Volume size |
| `rustfs.ingress.enabled` | `false` | No ingress: whoever reaches RustFS can delete the local backups |
| `rustfs.config.rustfs.obs_log_directory` | `""` | Log to stdout, so Alloy ships the logs to Loki |

Credentials are required and belong in `platform/values.yaml` (gitignored):

```yaml
rustfs:
  enabled: true
  rustfs:
    secret:
      rustfs:
        access_key: <generated>
        secret_key: <generated>
```

Rendering fails while they are empty, which is deliberate upstream behaviour: it keeps
the well-known default credentials out of a real deployment.

The upstream chart has no namespace override, so RustFS runs in the namespace of the
Helm release (`platform`).

## Buckets

The upstream chart creates no buckets, and Velero needs one before its first backup.
`templates/bucket-job.yaml` runs `rclone mkdir` as a post-install/post-upgrade hook. It
is idempotent and retries for five minutes while RustFS is still starting.

## Access

There is no ingress. Reach the S3 API and the console through a port-forward:

```bash
kubectl -n platform port-forward svc/platform-rustfs-svc 9000:9000 9001:9001
```

In-cluster clients (Velero) use `http://platform-rustfs-svc.platform.svc:9000`.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:rustfs
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
