# Loki

Helm chart wrapper for [grafana/loki](https://github.com/grafana/loki/tree/main/production/helm/loki).

Deployed in **Single-Binary** mode – suitable for a single-node home server.
Stores logs on a Longhorn PVC using the local filesystem backend.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `config.singleBinary.persistence.size` | `10Gi` | PVC size (Longhorn) |
| `config.loki.auth_enabled` | `false` | No multi-tenancy needed |

Logs are shipped to Loki by **Grafana Alloy** (see `charts/alloy`).
Override values in `platform/values.yaml` (gitignored).
