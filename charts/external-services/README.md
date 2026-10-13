# External Services

Puts the web interfaces of devices outside the cluster — a router, a modem, a NAS — behind the
cluster's ingress controller, so they are served over HTTPS with a certificate from cert-manager
instead of plain HTTP or a self-signed certificate.

## How It Works

Each entry in `services` renders three objects, all named after the entry:

- a **Service** without a selector, so Kubernetes does not look for pods behind it,
- an **EndpointSlice** that points the Service at the device's addresses,
- an **Ingress** for the entry's host, with a TLS section whose certificate lands in `<name>-tls`.

The ingress controller proxies to the device like to any pod. Adding a device is one more list
entry; the chart itself does not change.

Only HTTP and HTTPS work this way, since everything goes through the Ingress.

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
external-services:
  enabled: true
  namespaceOverride: network
  ingress:
    className: public
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.1.0/24
  services:
    - name: router
      addresses:
        - 192.168.1.1
      port: 80
      host: router.example.com
```

### Standalone

```bash
helm install external-services ./charts/external-services -n network --create-namespace -f values.yaml
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespaceOverride` | Namespace for all objects | release namespace |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Annotations for every Ingress | `{}` |
| `ingress.tls` | Add a TLS section per host, secret `<name>-tls` | `true` |
| `services[].name` | Name of the Service, EndpointSlice and Ingress | required |
| `services[].addresses` | IPv4 addresses of the device | required |
| `services[].port` | Port of the web interface on the device | required |
| `services[].host` | Host name the Ingress serves | required |
| `services[].annotations` | Annotations for this Ingress, merged over `ingress.annotations` | `{}` |

## Restrict Access

These are usually administration interfaces. If the ingress controller is reachable from the
internet, limit each Ingress to the local networks, for ingress-nginx with
`nginx.ingress.kubernetes.io/whitelist-source-range` in `ingress.annotations`. An entry that sets
the same annotation replaces the shared value instead of extending it.

## Devices With Special Needs

Per-entry annotations cover the usual cases with ingress-nginx:

```yaml
services:
  - name: nas
    addresses:
      - 192.168.1.10
    port: 443
    host: nas.example.com
    annotations:
      # The device speaks HTTPS only. nginx does not verify the upstream
      # certificate by default, so a self-signed one is fine.
      nginx.ingress.kubernetes.io/backend-protocol: HTTPS
      # The device rejects requests for a host name it does not know
      # (DNS rebinding protection); send its own address instead.
      nginx.ingress.kubernetes.io/upstream-vhost: 192.168.1.10
```

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:external-services
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```
