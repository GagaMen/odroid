# ntfy

[ntfy](https://ntfy.sh/) (pronounced "notify") is a simple HTTP-based pub-sub notification service. It allows you to send notifications to your phone or desktop via scripts from any computer, entirely without signup, cost or setup.

## Features

- Simple HTTP API for sending notifications
- Mobile apps for Android and iOS
- Desktop apps and web interface
- Topic-based pub-sub model
- No signup required
- End-to-end encryption support
- Attachments and file uploads
- Scheduled messages

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
ntfy:
  enabled: true
  ingress:
    enabled: true
    hosts:
      - host: ntfy.your-domain.com
        paths:
          - path: /
            pathType: Prefix
```

### Standalone

```bash
# Install in a dedicated namespace
helm install ntfy ./charts/ntfy -n ntfy --create-namespace -f values.yaml

# Or use namespaceOverride in values.yaml
helm install ntfy ./charts/ntfy -f values.yaml
```

> **Note:** When using `namespaceOverride` in your values.yaml, ensure the namespace exists beforehand or use `-n <namespace> --create-namespace` with the Helm command.

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `binwiederhier/ntfy` |
| `image.tag` | Container image tag | `v2.16.0` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Service

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Kubernetes service type | `LoadBalancer` |
| `service.port` | Service port | `80` |

### ConfigMap

| Parameter | Description | Default |
|-----------|-------------|---------|
| `configMap.enable` | Enable ConfigMap for server configuration | `true` |
| `configMap.data.server.yml` | ntfy server configuration | See values.yaml |

### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

### Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.memory` | Memory limit | `128Mi` |
| `resources.limits.cpu` | CPU limit | `500m` |

## Example Configuration

```yaml
ntfy:
  enabled: true
  
  configMap:
    enable: true
    data:
      server.yml: |
        base-url: https://ntfy.example.com
        behind-proxy: true
        cache-file: /var/cache/ntfy/cache.db
        cache-duration: 12h
        attachment-cache-dir: /var/cache/ntfy/attachments
        attachment-total-size-limit: 1G
        attachment-file-size-limit: 15M
        attachment-expiry-duration: 3h
  
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "15m"
    hosts:
      - host: ntfy.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: ntfy-tls
        hosts:
          - ntfy.example.com
  
  resources:
    limits:
      memory: "256Mi"
      cpu: "500m"
    requests:
      memory: "64Mi"
      cpu: "100m"
```

## Usage

### Sending Notifications

#### Simple Message

```bash
curl -d "Hello from my server!" https://ntfy.example.com/my-topic
```

#### With Title and Priority

```bash
curl \
  -H "Title: Server Alert" \
  -H "Priority: high" \
  -H "Tags: warning" \
  -d "Disk space is running low!" \
  https://ntfy.example.com/my-topic
```

#### With Click Action

```bash
curl \
  -H "Click: https://example.com/dashboard" \
  -d "Check the dashboard" \
  https://ntfy.example.com/my-topic
```

### Receiving Notifications

#### Mobile Apps

- **Android**: [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy) or [F-Droid](https://f-droid.org/en/packages/io.heckel.ntfy/)
- **iOS**: [App Store](https://apps.apple.com/app/ntfy/id1625396347)

#### Web Interface

Open `https://ntfy.example.com` in your browser and subscribe to topics.

#### Command Line

```bash
# Subscribe to a topic
curl -s https://ntfy.example.com/my-topic/sse

# Or with ntfy CLI
ntfy subscribe ntfy.example.com/my-topic
```

## Integration Examples

### Cron Job Notification

```bash
# In crontab
0 2 * * * /path/to/backup.sh && curl -d "Backup completed" https://ntfy.example.com/backups
```

### Script Error Notification

```bash
#!/bin/bash
set -e
trap 'curl -H "Priority: high" -d "Script failed: $BASH_COMMAND" https://ntfy.example.com/alerts' ERR

# Your script commands...
```

### Longhorn Backup Notification

Integrate with Longhorn backup jobs to receive notifications when backups complete.

## Tips

### Access Control

For production use, consider configuring authentication:

```yaml
server.yml: |
  auth-file: /var/lib/ntfy/auth.db
  auth-default-access: deny-all
```

### Rate Limiting

Prevent abuse with rate limiting:

```yaml
server.yml: |
  visitor-request-limit-burst: 60
  visitor-request-limit-replenish: 5s
```

## Links

- [ntfy Documentation](https://docs.ntfy.sh/)
- [ntfy GitHub](https://github.com/binwiederhier/ntfy)
- [Docker Hub](https://hub.docker.com/r/binwiederhier/ntfy)
- [Publishing Examples](https://docs.ntfy.sh/publish/)
