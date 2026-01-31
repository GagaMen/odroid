# Platform Chart

The `platform` chart is an umbrella Helm chart that combines all individual charts into a single deployable unit. It manages namespaces, shared resources, and orchestrates the deployment of all services.

## Features

- Single deployment command for entire platform
- Centralized configuration
- Shared resources (namespaces, storage classes, cluster issuers)
- Conditional service deployment
- GFS backup strategy for Longhorn

## Structure

```
platform/
├── Chart.yaml                  # Dependencies definition
├── values.yaml                 # Your configuration (gitignored)
├── charts/                     # Downloaded dependencies
└── templates/
    ├── clusterissuer.yaml      # Let's Encrypt configuration
    ├── namespace.yaml          # Namespace definitions
    ├── pre-delete-hook.yaml    # Cleanup hook
    ├── recurring-job.yaml      # Longhorn backup jobs
    ├── secret.yaml             # DNS provider credentials
    └── storageclass.yaml       # Longhorn storage class
```

## Dependencies

| Chart | Version | Condition |
|-------|---------|-----------|
| cert-manager-dns-lexicon-webhook | 1.0.0 | `cert-manager-dns-lexicon-webhook.enabled` |
| longhorn | 1.0.0 | `longhorn.enabled` |
| homepage | 1.0.0 | `homepage.enabled` |
| adguard | 1.1.0 | `adguard.enabled` |
| ntfy | 1.0.0 | `ntfy.enabled` |

## Installation

### 1. Update Dependencies

```bash
cd platform
helm dependency update
```

### 2. Create values.yaml

Create `platform/values.yaml` with your configuration:

```yaml
# Enable/disable services
adguard:
  enabled: true

homepage:
  enabled: true

ntfy:
  enabled: true

longhorn:
  enabled: true

cert-manager-dns-lexicon-webhook:
  enabled: true

# Cluster Issuer for Let's Encrypt
clusterIssuer:
  enabled: true
  name: lets-encrypt
  email: your-email@example.com
  # ... more config
```

### 3. Install

```bash
helm install odroid-platform ./platform -f platform/values.yaml
```

### 4. Upgrade

```bash
helm upgrade odroid-platform ./platform -f platform/values.yaml
```

### 5. Uninstall

```bash
helm uninstall odroid-platform
```

## Configuration

### Namespaces

The platform chart creates dedicated namespaces for each service in `templates/namespace.yaml`:

| Namespace | Service |
|-----------|--------|
| `longhorn` | Distributed storage |
| `homepage` | Dashboard |
| `adguard` | DNS ad-blocker |
| `ntfy` | Push notifications |

> **Important:** Each sub-chart requires `namespaceOverride` to be set in your `values.yaml` to deploy into these namespaces. Without it, charts deploy to the `default` namespace (except Longhorn, which defaults to `longhorn-system`).

```yaml
adguard:
  enabled: true
  namespaceOverride: adguard

homepage:
  enabled: true
  namespaceOverride: homepage

ntfy:
  enabled: true
  namespaceOverride: ntfy

longhorn:
  enabled: true
  config:
    namespaceOverride: longhorn
```

> **Note:** For Longhorn, the `namespaceOverride` is set under `config` due to the chart alias structure.

### ClusterIssuer

Configure Let's Encrypt with DNS-01 challenge:

```yaml
clusterIssuer:
  enabled: true
  name: lets-encrypt
  email: admin@example.com
  server: https://acme-v02.api.letsencrypt.org/directory  # Production
  # server: https://acme-staging-v02.api.letsencrypt.org/directory  # Staging
  webhook:
    groupName: acme.example.com
    provider: hetzner  # Your DNS provider
    ttl: 120
  secret:
    name: dns-credentials
    namespace: cert-manager
    auth_username: <api-key>
    auth_password: <api-secret>
```

### Storage Class

A `longhorn-retain` storage class is created with:
- `Retain` reclaim policy (data preserved on PVC deletion)
- Single replica (suitable for single-node setup)
- Volume expansion enabled

### Backup Jobs

Three recurring Longhorn backup jobs are created:

| Job | Schedule | Retention | Full Backup |
|-----|----------|-----------|-------------|
| Daily | Mon-Sat 2:00 AM | 6 days | No |
| Weekly | Sunday 2:00 AM | 4 weeks | No |
| Monthly | 1st of month 3:00 AM | 3 months | Yes |

Volumes must be labeled with `gfs-backup` group to use these jobs.

## Example values.yaml

```yaml
# =============================================================================
# Cluster Issuer - Let's Encrypt
# =============================================================================
clusterIssuer:
  enabled: true
  name: lets-encrypt
  email: admin@example.com
  server: https://acme-v02.api.letsencrypt.org/directory
  webhook:
    groupName: acme.example.com
    provider: hetzner
    ttl: 120
  secret:
    name: hetzner-dns-credentials
    namespace: cert-manager
    auth_username: "your-api-token"
    auth_password: ""

# =============================================================================
# cert-manager DNS Lexicon Webhook
# =============================================================================
cert-manager-dns-lexicon-webhook:
  enabled: true
  groupName: acme.example.com

# =============================================================================
# Longhorn - Distributed Storage
# =============================================================================
longhorn:
  enabled: true
  config:
    defaultSettings:
      backupTarget: "s3://backup-bucket@eu-central-1/"
      backupTargetCredentialSecret: longhorn-backup-secret
      defaultReplicaCount: 1
    ingress:
      enabled: true
      host: longhorn.example.com

# =============================================================================
# AdGuard Home - DNS Ad Blocker
# =============================================================================
adguard:
  enabled: true
  hostNetwork: true
  persistence:
    conf:
      size: 50Mi
      storageClass: longhorn-retain
    work:
      size: 1Gi
      storageClass: longhorn-retain
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
    hosts:
      - host: adguard.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: adguard-tls
        hosts:
          - adguard.example.com

# =============================================================================
# Homepage - Dashboard
# =============================================================================
homepage:
  enabled: true
  env:
    - name: HOMEPAGE_ALLOWED_HOSTS
      value: "home.example.com"
  configMap:
    enable: true
    data:
      allowedHosts: home.example.com
      kubernetes.yaml: |
        mode: cluster
      # ... more config
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
    hosts:
      - host: home.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: homepage-tls
        hosts:
          - home.example.com

# =============================================================================
# ntfy - Push Notifications
# =============================================================================
ntfy:
  enabled: true
  configMap:
    enable: true
    data:
      server.yml: |
        base-url: https://ntfy.example.com
        behind-proxy: true
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
    hosts:
      - host: ntfy.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: ntfy-tls
        hosts:
          - ntfy.example.com
```

## Tips

### Start with Staging

Use Let's Encrypt staging server first to avoid rate limits:

```yaml
clusterIssuer:
  server: https://acme-staging-v02.api.letsencrypt.org/directory
```

### Selective Deployment

Deploy only specific services:

```yaml
adguard:
  enabled: true
homepage:
  enabled: false
ntfy:
  enabled: false
longhorn:
  enabled: true
```

### Debug Installation

```bash
# Dry run
helm install --dry-run --debug odroid-platform ./platform -f platform/values.yaml

# Template rendering
helm template odroid-platform ./platform -f platform/values.yaml
```

## Troubleshooting

### Check Deployment Status

```bash
helm status odroid-platform
helm get all odroid-platform
```

### View All Resources

```bash
kubectl get all -A | grep -E "(adguard|homepage|ntfy|longhorn)"
```

### Check Logs

```bash
# AdGuard
kubectl logs -n adguard deployment/adguard

# Homepage
kubectl logs -n homepage deployment/homepage

# ntfy
kubectl logs -n ntfy deployment/ntfy
```
