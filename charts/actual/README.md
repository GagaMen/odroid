# Actual Budget

[Actual Budget](https://actualbudget.org/) is a local-first personal finance manager with
envelope budgeting. The server keeps the budget in a SQLite file and serves the web client.

## Features

- Envelope budgeting: every euro is assigned to a category before it is spent
- Transaction import from CSV, QIF, OFX, QFX and CAMT files
- Rules engine that categorises transactions on import, and learns new rules from
  the way you categorise payees
- Scheduled transactions, reports, and multi-currency amounts
- Single container, single volume -- no database server required

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
actual:
  enabled: true
  namespaceOverride: actual
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.0.0/24,10.8.0.0/24
    hosts:
      - host: actual.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: actual-tls
        hosts:
          - actual.your-domain.com
```

### Standalone

```bash
# Install in a dedicated namespace
helm install actual ./charts/actual -n actual --create-namespace -f values.yaml

# Or use namespaceOverride in values.yaml
helm install actual ./charts/actual -f values.yaml
```

> **Note:** When using `namespaceOverride` in your values.yaml, ensure the namespace exists beforehand or use `-n <namespace> --create-namespace` with the Helm command.

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `actualbudget/actual-server` |
| `image.tag` | Container image tag | `26.9.0` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Server

| Parameter | Description | Default |
|-----------|-------------|---------|
| `config.trustedProxies` | Networks whose `X-Forwarded-For` is trusted (`ACTUAL_TRUSTED_PROXIES`). Empty means the server's own default: every private range plus loopback. Only set this to *narrow* that list. | `""` |
| `config.uploadFileSizeLimitMb` | Largest budget file the server accepts, in MB | `20` |
| `env` | Additional environment variables, passed verbatim | `[]` |
| `strategy.type` | Deployment update strategy | `Recreate` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.data.enabled` | Enable budget data persistence | `true` |
| `persistence.data.size` | Volume size | `2Gi` |
| `persistence.data.storageClass` | Storage class name | unset (cluster default) |
| `persistence.data.labels` | Labels for the PVC | `{}` |

### Service and Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port; the container listens on it too | `5006` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

### Probes and Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `livenessProbe` | Liveness probe, `GET /health` | See values.yaml |
| `readinessProbe` | Readiness probe, `GET /health` | See values.yaml |
| `resources` | CPU/memory requests and limits | `50m` / `128Mi`, limit `512Mi` |

## Initial Setup

The server starts without a password. Until one is set, anyone who can reach the ingress
can set it themselves, so do this first:

1. Open the ingress host in a browser
2. Set the server password
3. Create a budget file
4. Import the first account statement under *More* -> *Import*

## Example Configuration

```yaml
actual:
  enabled: true
  namespaceOverride: actual

  persistence:
    data:
      enabled: true
      size: 2Gi
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs

  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.0.0/24,10.8.0.0/24
      gethomepage.dev/enabled: "true"
      gethomepage.dev/name: Actual Budget
      gethomepage.dev/group: Finance
      gethomepage.dev/icon: actual-budget
    hosts:
      - host: actual.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: actual-tls
        hosts:
          - actual.example.com
```

## Tips

### Backup Configuration

The budget lives in the persistent volume. When using the [Platform Chart](../../platform/),
label the PVC so that [Velero](../velero/README.md) backs it up:

```yaml
actual:
  persistence:
    data:
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs      # daily, weekly and monthly
```

The namespace also has to be listed in `scope.namespaces` of the [Velero chart](../velero/values.yaml),
otherwise the label alone does nothing.

### Recreate, Not RollingUpdate

`strategy.type` is `Recreate` on purpose. The budget is a SQLite file on a ReadWriteOnce
volume; a rolling update would start the new pod while the old one still holds that file,
and two processes would write the same database. The price is a few seconds of downtime
during an upgrade.

### End-to-End Encryption

Actual can encrypt the budget file so that the server only ever stores ciphertext. This is
a per-budget setting in the web UI, not a chart value, and it cannot be switched on from
here. Note that any tooling talking to the server needs the encryption password once it is
enabled.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:actual
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [Actual Budget Documentation](https://actualbudget.org/docs/)
- [Actual Budget GitHub](https://github.com/actualbudget/actual)
- [Server Configuration Reference](https://actualbudget.org/docs/config/)
- [Docker Hub](https://hub.docker.com/r/actualbudget/actual-server)
