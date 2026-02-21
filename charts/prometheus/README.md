# Prometheus

Helm chart wrapper for [prometheus-community/prometheus](https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus).

Collects metrics from Kubernetes nodes and workloads. Includes:
- **Prometheus server** – scraping & TSDB storage
- **node-exporter** – host-level metrics (CPU, memory, disk)
- **kube-state-metrics** – Kubernetes object metrics

Alertmanager is disabled in favour of Grafana Alerting.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `config.server.retention` | `15d` | How long metrics are kept |
| `config.server.persistentVolume.size` | `10Gi` | PVC size (Longhorn) |

Override values in `platform/values.yaml` (gitignored).
