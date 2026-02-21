# Grafana

Helm chart wrapper for [grafana/grafana](https://github.com/grafana/helm-charts/tree/main/charts/grafana).

Provides dashboards, visualization, and unified alerting (Grafana Alerting replaces Alertmanager).

## Pre-configured datasources
- **Prometheus** – `http://prometheus-server.monitoring.svc.cluster.local`
- **Loki** – `http://loki.monitoring.svc.cluster.local:3100`

## Alerting (ntfy)

After deployment, configure ntfy as a contact point in Grafana UI:

1. Go to **Alerting → Contact points → Add contact point**
2. Type: **Webhook**
3. URL: `http://ntfy.ntfy.svc.cluster.local/<your-topic>`
4. HTTP Method: `POST`

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `config.adminUser` | `admin` | Grafana admin username |
| `config.adminPassword` | `changeme` | Override in `platform/values.yaml`! |
| `config.ingress.hosts` | `grafana.example.com` | Ingress hostname |
| `config.persistence.size` | `2Gi` | PVC size (Longhorn) |
| `config.grafana\.ini.server.root_url` | `https://grafana.example.com` | Public URL |

Override values in `platform/values.yaml` (gitignored).
