# Homepage

[Homepage](https://gethomepage.dev/) is a modern, fully static, fast, secure, fully proxied, highly customizable application dashboard with integrations for over 100 services and translations into multiple languages.

## Features

- Modern, responsive design
- Kubernetes integration with automatic service discovery
- Over 100 service integrations
- Customizable widgets (weather, search, resources, etc.)
- Bookmarks management
- Custom CSS/JS support
- Multi-language support

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
homepage:
  enabled: true
  ingress:
    enabled: true
    hosts:
      - host: home.your-domain.com
        paths:
          - path: /
            pathType: Prefix
```

### Standalone

```bash
# Install in a dedicated namespace
helm install homepage ./charts/homepage -n homepage --create-namespace -f values.yaml

# Or use namespaceOverride in values.yaml
helm install homepage ./charts/homepage -f values.yaml
```

> **Note:** When using `namespaceOverride` in your values.yaml, ensure the namespace exists beforehand or use `-n <namespace> --create-namespace` with the Helm command.

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/gethomepage/homepage` |
| `image.tag` | Container image tag | `v1.9.0` |
| `image.pullPolicy` | Image pull policy | `Always` |

### Service Account

| Parameter | Description | Default |
|-----------|-------------|---------|
| `serviceAccount.create` | Create service account | `true` |
| `serviceAccount.automount` | Auto-mount API credentials | `true` |
| `serviceAccount.name` | Service account name | `""` |

### Cluster Role

| Parameter | Description | Default |
|-----------|-------------|---------|
| `clusterrole.enable` | Enable cluster role for Kubernetes integration | `true` |
| `clusterrole.rules` | RBAC rules for accessing cluster resources | See values.yaml |

### ConfigMap

The configuration is managed via ConfigMap. All Homepage configuration files are supported:

| File | Description |
|------|-------------|
| `kubernetes.yaml` | Kubernetes integration settings |
| `settings.yaml` | General settings |
| `services.yaml` | Service definitions |
| `bookmarks.yaml` | Bookmark links |
| `widgets.yaml` | Dashboard widgets |
| `custom.css` | Custom styles |
| `custom.js` | Custom JavaScript |
| `docker.yaml` | Docker integration (if used) |

### Ingress

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | See values.yaml |
| `ingress.hosts` | Ingress hosts configuration | See values.yaml |
| `ingress.tls` | TLS configuration | `[]` |

## Example Configuration

```yaml
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
      
      settings.yaml: |
        title: My Home Server
        favicon: https://example.com/favicon.ico
        theme: dark
        color: slate
        headerStyle: clean
        layout:
          Infrastructure:
            style: row
            columns: 4
          Services:
            style: row
            columns: 3
      
      bookmarks.yaml: |
        - Developer:
            - GitHub:
                - abbr: GH
                  href: https://github.com/
            - GitLab:
                - abbr: GL
                  href: https://gitlab.com/
        - Social:
            - Reddit:
                - abbr: RD
                  href: https://reddit.com/
      
      services.yaml: |
        - Infrastructure:
            - Longhorn:
                href: https://longhorn.example.com
                description: Distributed Storage
                icon: longhorn.png
            - AdGuard:
                href: https://adguard.example.com
                description: DNS Ad Blocker
                icon: adguard-home.png
        - Services:
            - ntfy:
                href: https://ntfy.example.com
                description: Push Notifications
                icon: ntfy.png
      
      widgets.yaml: |
        - kubernetes:
            cluster:
              show: true
              cpu: true
              memory: true
              showLabel: true
              label: "odroid"
            nodes:
              show: true
              cpu: true
              memory: true
              showLabel: true
        - resources:
            backend: resources
            expanded: true
            cpu: true
            memory: true
        - search:
            provider: duckduckgo
            target: _blank
      
      custom.css: ""
      custom.js: ""
      docker.yaml: ""
  
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      # Homepage autodiscovery annotations
      gethomepage.dev/enabled: "true"
      gethomepage.dev/name: Homepage
      gethomepage.dev/description: Application Dashboard
      gethomepage.dev/group: Infrastructure
      gethomepage.dev/icon: homepage.png
    hosts:
      - host: home.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: homepage-tls
        hosts:
          - home.example.com
```

## Kubernetes Service Discovery

Homepage can automatically discover services in your Kubernetes cluster using Ingress annotations:

```yaml
# On any Ingress resource
annotations:
  gethomepage.dev/enabled: "true"
  gethomepage.dev/name: "My Service"
  gethomepage.dev/description: "Service Description"
  gethomepage.dev/group: "Group Name"
  gethomepage.dev/icon: "service-icon.png"
  gethomepage.dev/href: "https://custom-url.example.com"  # Optional
```

This requires the `clusterrole.enable: true` setting and proper RBAC configuration.

## Tips

### Theme Customization

Homepage supports various themes. Configure in `settings.yaml`:

```yaml
settings.yaml: |
  theme: dark  # or 'light'
  color: slate  # slate, gray, zinc, neutral, stone, red, orange, etc.
```

### Widget Icons

Homepage includes many built-in icons. See the [icon list](https://github.com/walkxcode/dashboard-icons) for available options.

### Service Integrations

Homepage supports direct integration with many services for live status. Check the [service widgets documentation](https://gethomepage.dev/widgets/services/) for details.

## Links

- [Homepage Documentation](https://gethomepage.dev/)
- [Homepage GitHub](https://github.com/gethomepage/homepage)
- [Dashboard Icons](https://github.com/walkxcode/dashboard-icons)
- [Service Widgets](https://gethomepage.dev/widgets/services/)
