# Blackbox Exporter

Helm chart wrapper for [prometheus-community/prometheus-blackbox-exporter](https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus-blackbox-exporter).

The blackbox exporter probes a service from the outside, the way a client would, and
reports the result as metrics. It is meant for services whose own metrics cannot
say whether they work. A DNS resolver can stay up and keep answering on its web API
while nothing listens on port 53; only a real query notices that.

Prometheus drives the probes: every scrape of `/probe` names a target and a module,
the exporter runs the probe and answers with `probe_success`, `probe_duration_seconds`
and module-specific metrics such as `probe_dns_lookup_time_seconds`.

```
Prometheus ─▶ blackbox-exporter:9115/probe?module=dns&target=<server>:53 ─▶ DNS query
```

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `prometheus-blackbox-exporter.fullnameOverride` | `blackbox-exporter` | Name of the Deployment and Service, independent of the release name |
| `prometheus-blackbox-exporter.namespaceOverride` | `""` | Namespace to deploy into; empty means the release namespace |
| `prometheus-blackbox-exporter.config.modules.dns` | see `values.yaml` | A record for `example.com` over UDP, IPv4, `NOERROR` expected, 5s timeout |
| `prometheus-blackbox-exporter.config.modules.http_2xx` | upstream default | HTTP request expecting a 2xx status |
| `prometheus-blackbox-exporter.resources` | 10m / 16Mi, limit 64Mi | Probing a handful of targets needs very little |

The pod restarts when the module configuration changes; the upstream chart puts a
checksum of it on the pod template.

## Probe Targets

Targets are not part of this chart. Each one is a scrape job in Prometheus that sends
the target as a parameter and the request to the exporter, for example with the
`prometheus.extraScrapeConfigs` value of the [prometheus chart](../prometheus/):

```yaml
- job_name: dns
  metrics_path: /probe
  params:
    module: [dns]
  scrape_interval: 30s
  static_configs:
    - targets:
        - 192.0.2.1:53
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: blackbox-exporter.monitoring.svc.cluster.local:9115
```

`instance` then names the probed server, not the exporter. The exporter's own metrics
(`/metrics`) are not scraped by this job.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:blackbox-exporter
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
