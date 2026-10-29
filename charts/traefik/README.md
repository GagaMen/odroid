# Traefik

Helm chart wrapper for [traefik](https://github.com/traefik/traefik-helm-chart/tree/master/traefik),
the cluster's ingress controller.

Traefik binds the node's ports **80 and 443** through `hostPort` and serves every `Ingress`
of the class `public`, which it marks as the cluster default. Port 80 only redirects to
HTTPS. Certificates are not Traefik's business: cert-manager writes them into the TLS
Secrets the Ingresses name under `spec.tls`, and Traefik reads them from there and picks up
a renewed certificate without a restart.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `lanOnly.sourceRange` | `[]` | CIDRs allowed to reach any web interface. **Required** |
| `traefik.ingressClass.name` | `public` | IngressClass Traefik creates and serves |
| `traefik.ingressClass.isDefaultClass` | `true` | Ingresses without a class go to Traefik |
| `traefik.ports.web.hostPort` | `80` | Node port for HTTP (redirect only) |
| `traefik.ports.websecure.hostPort` | `443` | Node port for HTTPS |
| `traefik.ports.websecure.transport.respondingTimeouts.readTimeout` | `0` | No limit on reading a request (see below) |

The allowed ranges and the namespace belong in `platform/values.yaml` (gitignored):

```yaml
traefik:
  enabled: true
  lanOnly:
    sourceRange:
      - 192.168.0.0/24   # home network
      - 10.8.0.0/24      # VPN
  traefik:
    namespaceOverride: network
```

## Allow List

The `lan-only` middleware sits on the HTTPS entry point itself, so it applies to every router
-- every Ingress, including ones added later -- without an annotation per Ingress. A request
from any other address is answered with `403 Forbidden`.

It is defined in a ConfigMap of this wrapper and read through Traefik's file provider, which
watches the mounted directory: a changed list takes effect once kubelet has synced the
ConfigMap (up to a minute), without a restart. Traefik cannot build the middleware from an
empty list, and every HTTPS router would fail, so the chart refuses to render without one.

The check uses the address the connection comes from. `hostPort` keeps the client's address
for traffic from outside the node, so this works as long as nothing in front of the node
(a router doing NAT for the VPN, for example) replaces it.

## Coming from ingress-nginx

Ingresses written for ingress-nginx keep working unchanged as long as they use the class
`public`. Traefik ignores the `nginx.ingress.kubernetes.io/*` annotations, and this chart
covers what they did for the whole entry point:

| ingress-nginx annotation | Here |
|--------------------------|------|
| `ssl-redirect` | `web` entry point redirects every request to HTTPS |
| `whitelist-source-range` | `lan-only` middleware on `websecure` |
| `proxy-body-size` | Traefik sets no limit on the request body |
| `proxy-read-timeout`, `proxy-send-timeout` | `readTimeout: 0` on `websecure` |

Traefik 3 stops reading a request after 60 seconds by default. That cuts off large uploads
over a slow connection and long-lived WebSocket connections such as Home Assistant's, hence
`readTimeout: 0`.

The annotations can stay in place during a migration and be removed afterwards.

## What Is Switched Off

- **Traefik CRDs** (`IngressRoute`, `Middleware`, ...). The `kubernetesCRD` provider is disabled
  and nothing here needs them. Helm installs a subchart's `crds/` only when the parent release
  is installed, never on upgrade, so they would be missing on an existing platform anyway.
- **Service.** The pod is reached through `hostPort`. The chart's default `LoadBalancer` would
  stay `<pending>`, since MetalLB hands out addresses only on request.
- **Dashboard and version check.** The dashboard would only be reachable on the internal
  entry point; Dependabot reports new versions.

Prometheus scrapes the metrics through the pod's `prometheus.io/*` annotations, which the
upstream chart sets.

## MicroK8s Addon

MicroK8s ships an `ingress` addon. Keep it disabled: it binds the same host ports and creates
the same IngressClass. Depending on the MicroK8s version and the addon repository, the addon
is either ingress-nginx or Traefik with fixed values, and its configuration lives only in the
cluster.

Switching from the addon means a short interruption, because both need ports 80 and 443:

1. Try this chart beside the addon first: set `traefik.ports.web.hostPort` and
   `traefik.ports.websecure.hostPort` to free ports (e.g. 8080/8443), set
   `traefik.ingressClass.name` to `traefik` with `isDefaultClass: false`, and point a copy of
   an Ingress at the class `traefik`. Check the certificate, a request from an allowed
   address (200) and from the pod network (403).
2. `microk8s disable ingress`. This removes the controller and the IngressClasses `public`
   and `nginx`.
3. Drop the overrides from step 1 and deploy.

To go back, restore the overrides from step 1, deploy, and `microk8s enable ingress`.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:traefik
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Kubernetes Ingress Provider](https://doc.traefik.io/traefik/reference/install-configuration/providers/kubernetes/kubernetes-ingress/)
- [IPAllowList Middleware](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/ipallowlist/)
- [Helm Chart](https://github.com/traefik/traefik-helm-chart/tree/master/traefik)
