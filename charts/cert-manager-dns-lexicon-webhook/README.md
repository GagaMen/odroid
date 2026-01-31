# cert-manager DNS Lexicon Webhook

This chart deploys the [cert-manager-dns-lexicon-webhook](https://github.com/gradecam/cert-manager-dns-lexicon-webhook), an ACME DNS-01 challenge solver using [Lexicon](https://github.com/AnalogJ/lexicon) for cert-manager.

## Features

- DNS-01 challenge solving for wildcard certificates
- Support for 60+ DNS providers via Lexicon
- Works with Let's Encrypt and other ACME providers
- Automatic certificate renewal

## Why DNS-01?

DNS-01 challenges are required when:
- You need wildcard certificates (`*.example.com`)
- Your server is not publicly accessible (behind NAT/firewall)
- You want to issue certificates before exposing services

## Supported DNS Providers

Lexicon supports many DNS providers including:
- Cloudflare
- DigitalOcean
- AWS Route53
- Google Cloud DNS
- Hetzner
- OVH
- GoDaddy
- Namecheap
- And [many more](https://github.com/AnalogJ/lexicon#providers)

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
cert-manager-dns-lexicon-webhook:
  enabled: true
  groupName: acme.your-domain.com
```

### Standalone

```bash
# Install in cert-manager namespace (recommended)
helm install lexicon-webhook ./charts/cert-manager-dns-lexicon-webhook -n cert-manager -f values.yaml

# Or use namespaceOverride in values.yaml
helm install lexicon-webhook ./charts/cert-manager-dns-lexicon-webhook -f values.yaml
```

> **Note:** This webhook should typically be installed in the `cert-manager` namespace. When using `namespaceOverride` in your values.yaml, ensure the namespace exists beforehand.

## Configuration

### Chart Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `groupName` | Unique group name for the webhook (use your domain) | `acme.mycompany.com` |
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Container image | `taxilian/cert-manager-dns-lexicon-webhook` |
| `image.tag` | Image tag | `latest` |
| `image.digest` | Image digest for pinning | See values.yaml |
| `certManager.namespace` | cert-manager namespace | `cert-manager` |
| `certManager.serviceAccountName` | cert-manager service account | `cert-manager` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `443` |

### ClusterIssuer Configuration

The platform chart can create a ClusterIssuer automatically:

```yaml
# In platform values.yaml
clusterIssuer:
  enabled: true
  name: lets-encrypt
  email: your-email@example.com
  server: https://acme-v02.api.letsencrypt.org/directory
  webhook:
    groupName: acme.your-domain.com
    provider: hetzner  # Your DNS provider
    ttl: 120
  secret:
    name: dns-provider-credentials
    namespace: cert-manager
    auth_username: your-api-key
    auth_password: your-api-secret
```

## Example: Full Setup

### 1. Configure the Webhook

```yaml
cert-manager-dns-lexicon-webhook:
  enabled: true
  groupName: acme.example.com
  replicaCount: 1
```

### 2. Configure ClusterIssuer

```yaml
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
    auth_username: <your-hetzner-dns-api-token>
    auth_password: ""  # Not needed for Hetzner
```

### 3. Use in Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: lets-encrypt
spec:
  tls:
    - hosts:
        - app.example.com
        - "*.app.example.com"  # Wildcard!
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

## Provider-Specific Configuration

### Hetzner DNS

```yaml
clusterIssuer:
  webhook:
    provider: hetzner
  secret:
    auth_username: <hetzner-dns-api-token>
    auth_password: ""
```

### Cloudflare

```yaml
clusterIssuer:
  webhook:
    provider: cloudflare
  secret:
    auth_username: <cloudflare-email>
    auth_password: <cloudflare-api-key>
```

### AWS Route53

```yaml
clusterIssuer:
  webhook:
    provider: route53
  secret:
    auth_username: <aws-access-key-id>
    auth_password: <aws-secret-access-key>
```

## Troubleshooting

### Check Webhook Logs

```bash
kubectl logs -n cert-manager deployment/cert-manager-dns-lexicon-webhook
```

### Check Certificate Status

```bash
kubectl describe certificate <certificate-name>
kubectl describe certificaterequest <request-name>
kubectl describe challenge <challenge-name>
```

### Common Issues

1. **Challenge stuck in pending**: Check DNS propagation and webhook logs
2. **Invalid credentials**: Verify secret values
3. **Wrong group name**: Ensure `groupName` matches in webhook and ClusterIssuer

### Test DNS Propagation

```bash
# Check if the challenge TXT record was created
dig TXT _acme-challenge.example.com
```

## Links

- [cert-manager-dns-lexicon-webhook GitHub](https://github.com/gradecam/cert-manager-dns-lexicon-webhook)
- [Lexicon GitHub](https://github.com/AnalogJ/lexicon)
- [Lexicon Providers](https://github.com/AnalogJ/lexicon#providers)
- [cert-manager DNS01 Documentation](https://cert-manager.io/docs/configuration/acme/dns01/)
- [Let's Encrypt](https://letsencrypt.org/)
