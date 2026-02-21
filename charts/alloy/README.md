# Grafana Alloy

Helm chart wrapper for [grafana/alloy](https://github.com/grafana/alloy/tree/main/operations/helm/charts/alloy).

Deployed as a **DaemonSet** to collect Kubernetes pod logs from every node and forward them to Loki.

Alloy is the recommended log shipper for Grafana Loki on Kubernetes.

## Pipeline

```
Kubernetes pods → discovery.kubernetes → loki.source.kubernetes → loki.write → Loki
```

Labels added per log stream: `namespace`, `pod`, `container`, `app`.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `config.controller.type` | `daemonset` | Run on every node |
| Loki endpoint | `http://loki.monitoring.svc.cluster.local:3100` | Hardcoded in pipeline config |

To customise the Alloy pipeline, override `config.alloy.configMap.content` in `platform/values.yaml` (gitignored).
