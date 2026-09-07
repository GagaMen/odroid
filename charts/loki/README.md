# Loki

Helm chart wrapper for [grafana-community/loki](https://github.com/grafana-community/helm-charts/tree/main/charts/loki).

Grafana split the chart on 2026-03-16: the copy in the `grafana/loki` repository is
maintained for Grafana Enterprise Logs from 7.0.0 on, while open-source Loki was forked
to `grafana-community` at chart 6.55.0. This wrapper follows the community chart.

Deployed in **Single-Binary** mode – suitable for a single-node home server.
Stores logs on a Longhorn PVC using the local filesystem backend.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `config.singleBinary.persistence.size` | `10Gi` | PVC size (Longhorn) |
| `config.loki.auth_enabled` | `false` | No multi-tenancy needed |

Logs are shipped to Loki by **Grafana Alloy** (see `charts/alloy`).
Override values in `platform/values.yaml` (gitignored).

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:loki
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
