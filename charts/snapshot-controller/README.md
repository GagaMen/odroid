# Snapshot Controller

Helm chart wrapper for [piraeus/snapshot-controller](https://github.com/piraeusdatastore/helm-charts/tree/main/charts/snapshot-controller).

Longhorn takes volume snapshots itself and ships the `csi-snapshotter` sidecar, but
the generic Kubernetes snapshot API is not part of Longhorn or of MicroK8s: the
`VolumeSnapshot`, `VolumeSnapshotContent` and `VolumeSnapshotClass` CRDs and the
controller that turns a `VolumeSnapshot` into a `VolumeSnapshotContent` have to be
installed separately. Velero only speaks that generic API, so this chart is what
lets Velero snapshot Longhorn volumes:

```
Velero ─▶ VolumeSnapshot ─▶ snapshot-controller ─▶ VolumeSnapshotContent
       ─▶ csi-snapshotter (Longhorn) ─▶ Longhorn snapshot
```

The matching `VolumeSnapshotClass` lives in the platform chart
(`platform/templates/volumesnapshotclass.yaml`).

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `snapshot-controller.installCRDs` | `true` | Render the snapshot CRDs |
| `snapshot-controller.controller.replicaCount` | `1` | Single node, one replica |
| `snapshot-controller.webhook.enabled` | `false` | Only needed for old VolumeGroupSnapshot API versions |

The upstream chart has no namespace override, so the controller runs in the
namespace of the Helm release (`default` for the platform release).

> **Warning:** The CRDs are rendered as regular templates. Disabling or uninstalling
> this chart deletes the CRDs and every `VolumeSnapshot` in the cluster.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:snapshot-controller
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
