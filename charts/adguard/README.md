# AdGuard Home

[AdGuard Home](https://adguard.com/en/adguard-home/overview.html) is a free and open source, powerful network-wide ads & trackers blocking DNS server.

## Features

- Network-wide ad blocking
- DNS-over-HTTPS, DNS-over-TLS, DNS-over-QUIC support
- DHCP server (optional)
- Parental controls and safe browsing
- Custom filtering rules
- Query log and statistics
- Optional Prometheus metrics exporter for monitoring

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
adguard:
  enabled: true
  ingress:
    enabled: true
    hosts:
      - host: adguard.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: adguard-tls
        hosts:
          - adguard.your-domain.com
```

### Standalone

```bash
# Install in a dedicated namespace
helm install adguard ./charts/adguard -n adguard --create-namespace -f values.yaml

# Or use namespaceOverride in values.yaml
helm install adguard ./charts/adguard -f values.yaml
```

> **Note:** When using `namespaceOverride` in your values.yaml, ensure the namespace exists beforehand or use `-n <namespace> --create-namespace` with the Helm command.

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `adguard/adguardhome` |
| `image.tag` | Container image tag | `v0.107.73` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Network

| Parameter | Description | Default |
|-----------|-------------|---------|
| `hostNetwork` | Use host network for DNS | `true` |
| `service.type` | Kubernetes service type | `LoadBalancer` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.conf.enabled` | Enable config persistence | `true` |
| `persistence.conf.size` | Config volume size | `25Mi` |
| `persistence.work.enabled` | Enable work data persistence | `true` |
| `persistence.work.size` | Work volume size | `500Mi` |

### Service Ports

The chart supports multiple service ports. Enable only what you need:

| Port | Description | Default |
|------|-------------|---------|
| `dns-tcp` (53) | Plain DNS over TCP | `enabled` |
| `dns-udp` (53) | Plain DNS over UDP | `enabled` |
| `http` (80) | Web interface | `enabled` |
| `admin` (3000) | Initial setup interface | `disabled` |
| `dns-over-tls` (853) | DNS-over-TLS | `disabled` |
| `dns-over-quic` (853/UDP) | DNS-over-QUIC | `disabled` |
| `dnscrypt` (5443) | DNSCrypt | `disabled` |
| `dhcp` (67, 68) | DHCP server | `disabled` |

### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

## Initial Setup

On first deployment, AdGuard Home requires initial setup through the web interface on port 3000.

1. Forward port 3000 to your local machine:

   ```bash
   kubectl port-forward -n adguard deployment/adguard 3000:3000
   ```

2. Open http://localhost:3000 in your browser

3. Complete the setup wizard:
   - Set admin credentials
   - Configure DNS settings
   - Set upstream DNS servers

4. After setup, the admin interface moves to port 80 (or your configured Ingress)

## Example Configuration

```yaml
adguard:
  enabled: true
  
  hostNetwork: true
  
  persistence:
    conf:
      enabled: true
      size: 50Mi
      storageClass: longhorn-retain
    work:
      enabled: true
      size: 1Gi
  
  service:
    type: LoadBalancer
    ports:
      dns-tcp:
        enabled: true
      dns-udp:
        enabled: true
      http:
        enabled: true
      dns-over-tls:
        enabled: true
  
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    hosts:
      - host: adguard.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: adguard-tls
        hosts:
          - adguard.example.com
  
  prometheusExporter:
    enabled: true
    servers:
      - http://adguard.adguard.svc.cluster.local
    usernames:
      - admin
    passwords:
      - your-adguard-password
```

## Prometheus Exporter

The chart includes an optional [AdGuard Exporter](https://github.com/henrywhitaker3/adguard-exporter) that exposes AdGuard Home metrics for Prometheus scraping.

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `prometheusExporter.enabled` | Enable the Prometheus exporter | `false` |
| `prometheusExporter.image.repository` | Exporter image repository | `ghcr.io/henrywhitaker3/adguard-exporter` |
| `prometheusExporter.image.tag` | Exporter image tag | `v1.2.1` |
| `prometheusExporter.image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `prometheusExporter.service.type` | Service type | `ClusterIP` |
| `prometheusExporter.service.port` | Metrics port | `9618` |
| `prometheusExporter.servers` | List of AdGuard server URLs | `["http://adguard.adguard.svc.cluster.local"]` |
| `prometheusExporter.usernames` | List of AdGuard admin usernames | `["admin"]` |
| `prometheusExporter.passwords` | List of AdGuard admin passwords | `["example"]` |
| `prometheusExporter.interval` | Scrape interval | `30s` |
| `prometheusExporter.debug` | Enable debug logging | `false` |
| `prometheusExporter.bindAddress` | Address to bind the metrics server | `:9618` |
| `prometheusExporter.resources` | CPU/Memory resource requests/limits | `{}` |
| `prometheusExporter.nodeSelector` | Node selector for scheduling | `{}` |
| `prometheusExporter.tolerations` | Tolerations for scheduling | `[]` |
| `prometheusExporter.affinity` | Affinity rules for scheduling | `{}` |

### Enabling the Exporter

```yaml
adguard:
  prometheusExporter:
    enabled: true
    servers:
      - http://adguard.adguard.svc.cluster.local
    usernames:
      - admin
    passwords:
      - your-adguard-password
```

> **Note:** The exporter is deployed as a separate Deployment with its own Service (ClusterIP on port 9618). Credentials are stored in a Kubernetes Secret.

### Prometheus Scrape Configuration

To scrape the exporter metrics, add a scrape job to the [Prometheus Chart](../prometheus/):

```yaml
prometheus:
  prometheus:
    extraScrapeConfigs: |
      - job_name: 'adguard'
        static_configs:
          - targets:
              - <release-name>-adguard-prometheus-exporter.<namespace>.svc.cluster.local:9618
        scrape_interval: 30s
```

See the [Prometheus Chart documentation](../prometheus/README.md) for more details on `extraScrapeConfigs`.

## Tips

### Use as Network DNS

After setup, configure your router to use the Odroid's IP as the primary DNS server. This will enable network-wide ad blocking for all devices.

### Backup Configuration

The configuration is stored in the persistent volume. When using the [Platform Chart](../../platform/) with Longhorn enabled, you can leverage automatic backups by using the `longhorn-retain` storage class and adding the `gfs-backup` group:

```yaml
adguard:
  persistence:
    conf:
      storageClass: longhorn-retain
      labels:
        recurring-job-group.longhorn.io/gfs-backup: enabled
    work:
      storageClass: longhorn-retain
      labels:
        recurring-job-group.longhorn.io/gfs-backup: enabled
```

This enables the pre-configured GFS (Grandfather-Father-Son) backup strategy with daily, weekly, and monthly backups. See the [Longhorn Chart documentation](../longhorn/README.md) for details.

### Custom Filtering

You can add custom blocklists in the AdGuard Home web interface under *Filters* → *DNS blocklists*.

## Links

- [AdGuard Home GitHub](https://github.com/AdguardTeam/AdGuardHome)
- [AdGuard Home Wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [Docker Hub](https://hub.docker.com/r/adguard/adguardhome)
