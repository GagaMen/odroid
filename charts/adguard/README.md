# AdGuard Home

[AdGuard Home](https://adguard.com/en/adguard-home/overview.html) is a free and open source, powerful network-wide ads & trackers blocking DNS server.

## Features

- Network-wide ad blocking
- DNS-over-HTTPS, DNS-over-TLS, DNS-over-QUIC support
- DHCP server (optional)
- Parental controls and safe browsing
- Custom filtering rules
- Query log and statistics

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
| `image.tag` | Container image tag | `v0.107.69` |
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
```

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
