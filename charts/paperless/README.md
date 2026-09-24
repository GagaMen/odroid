# Paperless-ngx

[Paperless-ngx](https://docs.paperless-ngx.com/) is a document management system. It takes
scans and PDFs, runs OCR on them, stores the original next to a searchable PDF/A copy, and
assigns correspondents, document types and tags, learning from how you assigned them before.

## Features

- Full-text search across every document, including scanned ones
- Automatic tagging and classification, trained on your own archive
- Documents arrive by web upload, mobile app, IMAP mail accounts, or a network share
- Originals are kept untouched; the archive copy is PDF/A
- Single pod: paperless, a Valkey broker and an optional Samba share, SQLite as database

## Architecture

```
            ingress ──▶ paperless ◀── valkey (localhost, queue only)
                           │
 scanner ──SMB──▶ samba ──▶ consume ──▶ media (originals, archive)
     (MetalLB address)      volume       data  (SQLite, index)
```

All three containers share one pod. Valkey only holds the task queue and listens on
127.0.0.1. Samba writes into the consume volume, which only a container in the same pod
can do, since the volume is ReadWriteOnce.

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
paperless:
  enabled: true
  namespaceOverride: paperless
  secret:
    secretKey: <python3 -c "import secrets; print(secrets.token_urlsafe(64))">
    adminUser: admin
    adminPassword: <password>
  ingress:
    enabled: true
    annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: "100m"
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.0.0/24,10.8.0.0/24
    hosts:
      - host: paperless.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: paperless-tls
        hosts:
          - paperless.your-domain.com
```

Setting `ingress.annotations` in your own values merges with the chart default, so the
`proxy-body-size` annotation stays unless you override that key.

### Standalone

```bash
helm install paperless ./charts/paperless -n paperless --create-namespace -f values.yaml
```

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/paperless-ngx/paperless-ngx` |
| `image.tag` | Container image tag | `3.2.1` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Server

| Parameter | Description | Default |
|-----------|-------------|---------|
| `config.url` | Public URL (`PAPERLESS_URL`); empty means derived from the first ingress host | `""` |
| `config.ocrLanguage` | Tesseract languages joined with `+` | `deu+eng` |
| `config.timeZone` | Time zone | `Europe/Berlin` |
| `config.taskWorkers` | Background tasks in parallel | `1` |
| `config.threadsPerWorker` | OCR threads per task | `2` |
| `config.webserverWorkers` | Webserver processes | `1` |
| `config.trustedProxyCount` | Proxy hops in `X-Forwarded-For`, for the login rate limiter | `1` |
| `env` | Additional environment variables, passed verbatim | `[]` |
| `strategy.type` | Deployment update strategy | `Recreate` |

Every other [paperless setting](https://docs.paperless-ngx.com/configuration/) can be passed
through `env`.

### Secret

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secret.secretKey` | Signs sessions and tokens. **Required**; rendering fails without it | `""` |
| `secret.adminUser` | Superuser created on first start | `""` |
| `secret.adminPassword` | Its password; only used when the user is created | `""` |

Changing any value in the secret restarts the pod (checksum annotation). Changing
`adminPassword` after the first start does nothing: paperless never overwrites an existing
user. Change the password in the UI instead.

### Broker

| Parameter | Description | Default |
|-----------|-------------|---------|
| `broker.image` | Valkey image | `valkey/valkey:9.1.2-alpine` |
| `broker.resources` | CPU/memory for the broker | `10m` / `16Mi`, limit `128Mi` |

### Scan Share

| Parameter | Description | Default |
|-----------|-------------|---------|
| `scanShare.enabled` | Run the Samba sidecar | `false` |
| `scanShare.image` | Samba image | `ghcr.io/servercontainers/samba:smbd-only-…` |
| `scanShare.shareName` | Share name | `consume` |
| `scanShare.user` | Account the scanner logs in with | `scanner` |
| `scanShare.password` | Its password, **no spaces** | `""` |
| `scanShare.uid` | uid/gid the files are written with | `1000` |
| `scanShare.allowedNetworks` | Client networks (CIDR) allowed to connect | `[]` |
| `scanShare.service.type` | Service type | `LoadBalancer` |
| `scanShare.service.address` | Address requested from MetalLB | `""` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.data.*` | SQLite database, search index, classifier | `2Gi` |
| `persistence.media.*` | Originals, archive copies, thumbnails | `20Gi` |
| `persistence.consume.*` | Inbox; files leave it once consumed | `1Gi` |

Each volume takes `enabled`, `size`, `accessMode`, `storageClass` and `labels`.

### Service, Ingress, Probes and Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.port` | Service port (the container always listens on 8000) | `8000` |
| `ingress.annotations` | Ingress annotations | `proxy-body-size: 100m` |
| `startupProbe` | `GET /`, up to ten minutes | See values.yaml |
| `livenessProbe` / `readinessProbe` | `GET /` | See values.yaml |
| `resources` | CPU/memory for paperless | `250m` / `1Gi`, limit `3Gi` |

## Initial Setup

1. Wait for the first start to finish; it migrates the database and can take several
   minutes on ARM (`kubectl logs -f -c paperless …`)
2. Log in with `secret.adminUser`, or create a user with
   `kubectl exec -it … -c paperless -- createsuperuser` if none was set
3. Upload a first PDF and check that its text is searchable
4. Mail accounts and mail rules are configured in the UI under *Mail*; they are stored in
   the database, not in this chart

## Scan Share

Many scanners can "scan to network folder" over SMB. With `scanShare.enabled` the chart
runs Samba next to paperless and shares the consume directory. Paperless picks up what
arrives there within seconds.

```yaml
paperless:
  scanShare:
    enabled: true
    password: <no spaces>
    allowedNetworks:
      - 192.168.0.0/24
    service:
      address: 192.168.0.240
```

On the scanner, set the target to `\\192.168.0.240\consume`, user `scanner`, and the
password.

- **Needs MetalLB** (see [../metallb/README.md](../metallb/README.md)) for its own address.
  Port 445 is then offered on that address only, not on the node.
- **SMB2 or newer.** SMB1 is refused. Scanners that only speak SMB1 need a firmware update
  or another transfer method, such as the web upload or mail.
- **Two filters.** `allowedNetworks` becomes the service's `loadBalancerSourceRanges` and
  Samba's `hosts allow`. The service uses `externalTrafficPolicy: Local`, so both see the
  scanner's real address; with `Cluster`, they would see the node's.
- **No spaces** in the password or in any other value the Samba container reads from its
  environment: the image's entrypoint splits them on whitespace.

## Tips

### Backup Configuration

Label the data and media volumes so that [Velero](../velero/README.md) backs them up. The
consume volume is transient and does not need it:

```yaml
paperless:
  persistence:
    data:
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs
    media:
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs
```

The namespace also has to be listed in `scope.namespaces` of the [Velero chart](../velero/values.yaml).

The two volumes are snapshotted one after the other, so a document consumed in between can
have its file in the backup but not its database row, or the reverse. Paperless's
[sanity checker](https://docs.paperless-ngx.com/administration/#sanity-checker) finds such
mismatches after a restore, and the
[document exporter](https://docs.paperless-ngx.com/administration/#exporter) writes a
consistent copy of the whole archive when one is needed, e.g. before a migration.

### Upload Size

nginx rejects request bodies over 1 MB by default, and a larger upload fails with
`413 Request Entity Too Large` before it reaches paperless. The chart sets
`nginx.ingress.kubernetes.io/proxy-body-size: 100m` for that reason.

### Recreate, Not RollingUpdate

The database is a SQLite file on a ReadWriteOnce volume; a rolling update would start the
new pod while the old one still holds it. The price is a minute of downtime per upgrade.

### Office Documents

Paperless can also consume Office files and `.eml` mails through Apache Tika and Gotenberg.
This chart does not run them. PDFs and images work without them, including those that
arrive as mail attachments.

### Nothing Leaves the Cluster

OCR, classification and the search index all run inside the pod. Paperless's optional AI
features (`PAPERLESS_AI_ENABLED`) and remote OCR are off unless switched on through `env`.
The update check, which asks GitHub for the latest release, is a setting in the UI.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:paperless
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [Paperless-ngx Documentation](https://docs.paperless-ngx.com/)
- [Configuration Reference](https://docs.paperless-ngx.com/configuration/)
- [Paperless-ngx GitHub](https://github.com/paperless-ngx/paperless-ngx)
- [Samba Image](https://github.com/ServerContainers/samba)
