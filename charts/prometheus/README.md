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

### Extra Scrape Configs

To scrape custom metrics endpoints (e.g. Longhorn, AdGuard Exporter), use `extraScrapeConfigs`:

```yaml
prometheus:
  extraScrapeConfigs: |
    - job_name: 'longhorn'
    static_configs:
        - targets:
            - longhorn-backend.longhorn.svc.cluster.local:9500
    scrape_interval: 30s
    - job_name: 'adguard'
    static_configs:
        - targets:
            - <release-name>-adguard-prometheus-exporter.<namespace>.svc.cluster.local:9618
    scrape_interval: 30s
```

Each job needs a unique `job_name`. Targets follow the format `<service>.<namespace>.svc.cluster.local:<port>`.
