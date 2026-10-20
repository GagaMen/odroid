# Prometheus

Helm chart wrapper for [prometheus-community/prometheus](https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus).

Collects metrics from Kubernetes nodes and workloads. Includes:
- **Prometheus server** – scraping & TSDB storage
- **node-exporter** – host-level metrics (CPU, memory, disk)
- **kube-state-metrics** – Kubernetes object metrics

Alertmanager is disabled in favour of Grafana Alerting.

## Chart Source

The upstream chart is pulled from the OCI registry (`oci://ghcr.io/prometheus-community/charts`),
not from the classic `https://prometheus-community.github.io/helm-charts` repository. Dependabot
looks up versions in a classic repository with `helm search repo`, which matches every chart whose
name starts with `prometheus` and then takes the highest version among all of them. That proposed
`prometheus-operator-crds` releases as updates for this chart
([dependabot-core#13789](https://github.com/dependabot/dependabot-core/issues/13789)). For an OCI
source Dependabot lists the tags of exactly this chart instead.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `prometheus.server.retention` | `15d` | How long metrics are kept |
| `prometheus.server.retentionSize` | `16GB` | Upper bound for TSDB size; oldest blocks are dropped first |
| `prometheus.server.persistentVolume.size` | `20Gi` | PVC size (Longhorn) |

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

### Scrape Credentials

Some endpoints only answer with a bearer token, such as Home Assistant's `/api/prometheus`.
`scrapeCredentials` takes such tokens by name and renders them into the Secret
`prometheus-scrape-credentials`, next to the Prometheus server. The server mounts it at
`/etc/prometheus/scrape-credentials`, one file per name, and a scrape job points at the
file:

```yaml
prometheus:
  scrapeCredentials:
    home-assistant: <token>      # from secrets/mapping.yaml, not values.yaml
  prometheus:
    extraScrapeConfigs: |
      - job_name: home-assistant
        metrics_path: /api/prometheus
        authorization:
          credentials_file: /etc/prometheus/scrape-credentials/home-assistant
        static_configs:
          - targets:
              - platform-home-assistant.home-assistant.svc.cluster.local:8123
```

The token never appears in the Prometheus configuration. Prometheus reads the file on every
scrape, and the mount has no `subPath`, so a new token takes effect without a restart once
kubelet has synced the Secret (up to a minute). Without any token the Secret is not rendered;
the mount is `optional`, so the server starts anyway.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:prometheus
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
