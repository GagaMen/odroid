# Grafana Alloy

Helm chart wrapper for [grafana/alloy](https://github.com/grafana/alloy/tree/main/operations/helm/charts/alloy).

Deployed as a **DaemonSet** to collect Kubernetes pod logs from every node and forward them to Loki.

Alloy is the recommended log shipper for Grafana Loki on Kubernetes.

## Pipeline

```
Kubernetes pods → discovery.kubernetes → loki.source.kubernetes ─┐
                                                                 ├→ loki.write → Loki
Network devices → (UDP syslog) → loki.source.syslog ─────────────┘
```

Labels added per pod log stream: `namespace`, `pod`, `container`, `app`.
Labels added per syslog stream: `job="syslog"`, `host`, `app`, `level`.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `alloy.controller.type` | `daemonset` | Run on every node |
| `alloy.alloy.extraEnv` (`LOKI_URL`) | `http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push` | Loki push endpoint; set this instead of overriding the pipeline when the Loki service is named differently |
| `syslog.enabled` | `false` | Render a LoadBalancer service for the syslog listener |
| `syslog.port` | `514` | UDP port devices send to |
| `syslog.allowedNetworks` | `[]` | Source CIDRs allowed to send (`loadBalancerSourceRanges`); empty allows all |
| `syslog.service.address` | `""` | Address requested from MetalLB (`metallb.io/loadBalancerIPs`) |
| `syslog.service.annotations` | `{}` | Additional service annotations |

To customise the Alloy pipeline itself, override `alloy.alloy.configMap.content` in `platform/values.yaml` (gitignored).

## Receiving Syslog from Network Devices

The pipeline always runs a syslog listener on UDP 5514 in every Alloy pod. It parses
RFC 3164 messages, the format OpenWrt's `logd` and most embedded devices send. With
`syslog.enabled` the chart adds a `LoadBalancer` service that gives the listener its own
address in the home network, which needs [MetalLB](../metallb/README.md):

```yaml
alloy:
  syslog:
    enabled: true
    service:
      address: 192.168.0.241
    allowedNetworks:
      - 192.168.0.1/32
```

The service uses `externalTrafficPolicy: Local`, so the sender's address survives to the pod
and `allowedNetworks` filters on the device rather than on the node.

On an OpenWrt router, point `logd` at that address:

```sh
uci set system.@system[0].log_ip='192.168.0.241'
uci set system.@system[0].log_port='514'
uci set system.@system[0].log_proto='udp'
uci commit system
service log restart
```

In Grafana, the router's messages are then under `{job="syslog"}`.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:alloy
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
