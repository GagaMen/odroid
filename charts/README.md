# Helm Charts

This directory contains custom Helm charts for the Odroid home server platform. Each chart is designed to be deployed individually or as part of the umbrella `platform` chart.

## Available Charts

| Chart | Description | Version |
|-------|-------------|---------|
| [adguard](adguard/) | Network-wide ad & tracker blocking DNS server | 1.1.0 |
| [cert-manager-dns-lexicon-webhook](cert-manager-dns-lexicon-webhook/) | DNS-01 ACME challenge solver using Lexicon | 1.0.0 |
| [homepage](homepage/) | Modern, customizable application dashboard | 1.0.0 |
| [longhorn](longhorn/) | Cloud-native distributed block storage | 1.0.0 |
| [ntfy](ntfy/) | Self-hosted push notification service | 1.0.0 |

## Namespace Configuration

Each chart supports a `namespaceOverride` value to control which namespace the resources are deployed to:

```yaml
adguard:
  namespaceOverride: adguard
```

| Chart | Default Namespace |
|-------|------------------|
| adguard | `default` |
| cert-manager-dns-lexicon-webhook | `default` |
| homepage | `default` |
| longhorn | `longhorn-system` (built-in) |
| ntfy | `default` |

> **Note:** Longhorn brings its own namespace `longhorn-system` by default. All other charts deploy to the `default` namespace unless `namespaceOverride` is specified.

When using the [Platform Chart](../platform/), namespaces are pre-defined in `templates/namespace.yaml` and you should set `namespaceOverride` accordingly to deploy services into their dedicated namespaces.

## Usage

### Standalone Deployment

Each chart can be deployed independently:

```bash
helm install <release-name> ./charts/<chart-name> -f values.yaml
```

### As Part of Platform

All charts are included as dependencies in the `platform` umbrella chart. Enable or disable them via the platform's `values.yaml`:

```yaml
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
```

## Chart Development

### Adding a New Chart

1. Create a new directory under `charts/`
2. Add the required Helm chart files:
   - `Chart.yaml` - Chart metadata
   - `values.yaml` - Default configuration
   - `templates/` - Kubernetes manifests
   - `README.md` - Documentation
3. Add the chart as a dependency in `platform/Chart.yaml`
4. Update Dependabot configuration in `.github/dependabot.yml`

### Testing

```bash
# Lint a chart
helm lint ./charts/<chart-name>

# Dry run installation
helm install --dry-run --debug <release-name> ./charts/<chart-name>

# Template rendering
helm template <release-name> ./charts/<chart-name>
```
