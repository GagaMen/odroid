# Home Assistant

[Home Assistant](https://www.home-assistant.io/) is a home automation platform that runs
locally. It integrates lights, sensors, presence detection, calendars and notification
services, and runs automations across all of them.

This chart runs the Home Assistant **Container** installation: Home Assistant Core in a
single container, without the Supervisor and its add-ons. Services that would be add-ons
elsewhere, such as an MQTT broker, run as charts of their own.

## Features

- Integrations are configured in the UI and stored on the volume
- Discovery of devices in the LAN through `hostNetwork` (mDNS/zeroconf, SSDP)
- Metrics for Prometheus through the built-in `prometheus` integration
- Single container, single volume -- the recorder uses SQLite

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
home-assistant:
  enabled: true
  namespaceOverride: home-assistant
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.0.0/24,10.8.0.0/24
    hosts:
      - host: home-assistant.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: home-assistant-tls
        hosts:
          - home-assistant.your-domain.com
```

Setting `ingress.annotations` in your own values merges with the chart default, so the
WebSocket timeouts stay unless you override those keys.

### Standalone

```bash
helm install home-assistant ./charts/home-assistant -n home-assistant --create-namespace -f values.yaml
```

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/home-assistant/home-assistant` |
| `image.tag` | Container image tag | `2026.10.2` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Server

| Parameter | Description | Default |
|-----------|-------------|---------|
| `hostNetwork` | Share the node's network, for discovery in the LAN | `true` |
| `config.timeZone` | Time zone of the container (`TZ`) | `Europe/Berlin` |
| `config.prometheus` | Configuration of the `prometheus` integration, passed verbatim | `{}` |
| `env` | Additional environment variables, passed verbatim | `[]` |
| `secrets` | Values for `!secret` in `configuration.yaml`, mounted as `/config/secrets.yaml` | `{}` |
| `strategy.type` | Deployment update strategy | `Recreate` |

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.config.enabled` | Keep `/config` on a volume; otherwise an `emptyDir` | `true` |
| `persistence.config.size` | Volume size | `5Gi` |
| `persistence.config.storageClass` | Storage class name | unset (cluster default) |
| `persistence.config.labels` | Labels for the PVC | `{}` |

### Service, Ingress, Probes and Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.port` | Service port (Home Assistant always listens on 8123) | `8123` |
| `ingress.annotations` | Ingress annotations | WebSocket timeouts of one hour |
| `startupProbe` | `GET /manifest.json`, up to ten minutes | See values.yaml |
| `livenessProbe` / `readinessProbe` | `GET /manifest.json` | See values.yaml |
| `resources` | CPU/memory requests and limits | `100m` / `512Mi`, limit `2Gi` |

## Configuration Files

Home Assistant writes to `/config` itself: the UI stores integrations, users, dashboards and
automations there. The chart therefore manages only the `prometheus` integration and leaves
the rest alone.

- `/config/chart/prometheus.yaml` comes from a ConfigMap, read-only. Changing
  `config.prometheus` restarts the pod (checksum annotation), since Home Assistant reads it
  only at startup.
- `/config/configuration.yaml` belongs to Home Assistant. An init container writes a seed
  when the file does not exist yet, i.e. on the first start: `default_config`,
  `prometheus: !include chart/prometheus.yaml`, and the usual includes for automations,
  scripts and scenes. After that the chart never touches it again, and the file can be
  edited like in any other installation.

The `http` settings are deliberately not part of the chart. Since 2026.10 Home Assistant
keeps them in its own storage and manages them in the UI. An `http:` block in YAML is
imported only once, as a trial: unless it is confirmed in the UI within five minutes, Home
Assistant reverts to the defaults, restarts, and ignores the YAML from then on. A chart value
would therefore take effect at most once and silently do nothing afterwards.

## Secrets

YAML-configured integrations take passwords with `!secret <name>`, which Home Assistant looks
up in `/config/secrets.yaml`. With `secrets` set, the chart renders that file from a
Kubernetes Secret and mounts it read-only, so the values can come from the same place as
every other credential instead of living only on the volume:

```yaml
home-assistant:
  secrets:
    router_password: <password>      # from secrets/mapping.yaml, not values.yaml
```

```yaml
# configuration.yaml on the volume
device_tracker:
  - platform: ubus
    host: 192.168.1.1
    username: homeassistant
    password: !secret router_password
```

- The file then belongs to the chart: a `secrets.yaml` already on the volume is hidden by
  the mount, so move its entries into `secrets` first.
- A changed value restarts the pod (checksum annotation). The mount uses `subPath`, which
  kubelet does not refresh in a running container, and Home Assistant reads the file only
  while loading YAML anyway.
- Credentials entered in the UI, which is how most integrations are set up, are stored by
  Home Assistant in `/config/.storage` and do not go through this file.

## Reverse Proxy

Out of the box Home Assistant does not trust the `X-Forwarded-For` header that the ingress
controller adds, and answers every request through the ingress with `400 Bad Request`. The
log says *"A request from a reverse proxy was received from …, but your HTTP integration is
not set-up for reverse proxies"*. This is set once in the UI and stored on the volume:

1. Open Home Assistant without the ingress: `http://<node-address>:8123` (with
   `hostNetwork`), or through a port-forward
2. *Settings* → *System* → *Network*, card *HTTP server*, section *Reverse proxy*: enable
   *Trust X-Forwarded-For* and add the ingress controller's network under *Trusted proxies*.
   With MicroK8s that is its pod network, `10.1.0.0/16`; the address in the log message
   above is the one that has to be covered. *Save and restart*
3. Home Assistant restarts with the new settings as a trial. Within five minutes, open it
   **through the ingress** and answer the dialog *Confirm new HTTP server configuration*
   with *Confirm*; otherwise it reverts to the previous settings and restarts again

Confirming through the ingress is the actual test: if that page loads, the settings work.

## Initial Setup

Home Assistant has no user until onboarding creates one, and whoever opens it first creates
the owner account. Do this right after the first start:

1. Wait for the first start to finish; it installs the packages of the default
   integrations and can take several minutes on ARM (`kubectl logs -f …`)
2. Open `http://<node-address>:8123` -- the ingress does not work until the reverse proxy
   is set up -- and create the owner account
3. Set location, time zone and units
4. Set up the [reverse proxy](#reverse-proxy)
5. Add the integrations that were discovered in the network

## Host Network

Multicast does not cross the pod network, so without `hostNetwork` Home Assistant would not
discover devices such as a Hue Bridge or a Chromecast on its own. With it, the pod shares the
node's network stack. Two consequences:

- **Port 8123 is open on the node's address** as well, in plain HTTP and without the
  ingress' `whitelist-source-range`. Home Assistant still requires a login there.
- **DNS:** a host-network pod would use the node's resolver and not find cluster services
  such as `ntfy.ntfy.svc.cluster.local`. The chart sets `dnsPolicy: ClusterFirstWithHostNet`.

The same port is the way in while the ingress does not work yet, i.e. before the
[reverse proxy](#reverse-proxy) is set up.

## Metrics

The `prometheus` integration serves the state of every entity at `/api/prometheus`. The
endpoint requires a long-lived access token. That data includes presence (who is at home),
so keep the token rather than switching `requires_auth` off.

1. In Home Assistant, create a user for Prometheus (*Settings* → *People* → *Users*), not an
   administrator, and with *Can only log in from the local network*
2. Log in as that user and create a long-lived access token under *Profile* → *Security*
3. Hand the token to the [Prometheus chart](../prometheus/README.md#scrape-credentials) as
   `scrapeCredentials.home-assistant`, and add a scrape job:

```yaml
prometheus:
  prometheus:
    extraScrapeConfigs: |
      - job_name: home-assistant
        metrics_path: /api/prometheus
        authorization:
          credentials_file: /etc/prometheus/scrape-credentials/home-assistant
        static_configs:
          - targets:
              - <release-name>-home-assistant.<namespace>.svc.cluster.local:8123
```

To export only part of the entities, set a filter:

```yaml
home-assistant:
  config:
    prometheus:
      filter:
        include_domains:
          - sensor
          - climate
```

## Tips

### Backup Configuration

Everything lives in the one volume. When using the [Platform Chart](../../platform/), label
the PVC so that [Velero](../velero/README.md) backs it up:

```yaml
home-assistant:
  persistence:
    config:
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs      # daily, weekly and monthly
```

The namespace also has to be listed in `scope.namespaces` of the [Velero chart](../velero/values.yaml).

Home Assistant's own backups (*Settings* → *System* → *Backups*) would write archives into
the same volume. With Velero in place they add nothing and only fill the volume, so leave the
automatic backups off.

### Recorder

The recorder keeps the history of every entity for ten days in
`/config/home-assistant_v2.db`. Long-term statistics (hourly means of sensors) are kept
indefinitely and are small. A longer history is set with `recorder: purge_keep_days` in
`configuration.yaml`; for metrics over months, Prometheus is the better place.

### Recreate, Not RollingUpdate

The recorder database is a SQLite file on a ReadWriteOnce volume, and with `hostNetwork` the
pod binds port 8123 on the node. A rolling update would start the new pod while the old one
still holds both. The price is a minute of downtime per upgrade.

### No USB Devices

The chart mounts no devices and runs unprivileged. Radio coordinators such as a Zigbee
stick are better reached over the network (e.g. Zigbee2MQTT with an Ethernet coordinator),
which keeps the pod free of a binding to one node and one device path.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:home-assistant
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [Home Assistant Documentation](https://www.home-assistant.io/docs/)
- [Container Installation](https://www.home-assistant.io/installation/linux#docker-compose)
- [HTTP Integration](https://www.home-assistant.io/integrations/http/) (reverse proxy settings)
- [Prometheus Integration](https://www.home-assistant.io/integrations/prometheus/)
- [Home Assistant GitHub](https://github.com/home-assistant/core)
