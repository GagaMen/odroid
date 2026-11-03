# Odroid Home Server

A Kubernetes-based home server setup running on [ODROID-M2](https://www.hardkernel.com/shop/odroid-m2-with-16gbyte-ram/) with 16GB RAM. This repository contains Helm charts and configurations for a complete self-hosted infrastructure including DNS ad-blocking, a customizable dashboard, push notifications, distributed storage, and a full monitoring stack.

## 🚀 Features

- **[AdGuard Home](charts/adguard/)** - Network-wide ad & tracker blocking DNS server
- **[Actual Budget](charts/actual/)** - Personal finance manager with envelope budgeting
- **[Paperless-ngx](charts/paperless/)** - Document archive with OCR, full-text search and a scanner share
- **[Home Assistant](charts/home-assistant/)** - Local home automation for devices, presence and calendars
- **[Mealie](charts/mealie/)** - Recipe manager and meal planner, with a bridge to a Bring! shopping list
- **[Homepage](charts/homepage/)** - Modern, customizable application dashboard
- **[ntfy](charts/ntfy/)** - Self-hosted push notification service
- **[Longhorn](charts/longhorn/)** - Cloud-native distributed storage
- **[MetalLB](charts/metallb/)** - Own LAN addresses for selected LoadBalancer services
- **[Snapshot Controller](charts/snapshot-controller/)** - CSI snapshot API, the basis for Velero backups
- **[RustFS](charts/rustfs/)** - S3-compatible object store, local target for encrypted backups
- **[Velero](charts/velero/)** - Encrypted PVC backups to S3, locally and off-site
- **[cert-manager DNS Lexicon Webhook](charts/cert-manager-dns-lexicon-webhook/)** - DNS-01 ACME challenge solver
- **[WireGuard VPN](wireguard/)** - Secure remote access to your home network
- **[Host Configuration](ansible/)** - Ansible playbook for the host: kernel, systemd, storage, MicroK8s and shell
- **[Prometheus](charts/prometheus/)** - Metrics collection and storage (incl. node-exporter & kube-state-metrics)
- **[Grafana](charts/grafana/)** - Dashboards, visualization, and alerting (with ntfy integration)
- **[Loki](charts/loki/)** - Log aggregation
- **[Grafana Alloy](charts/alloy/)** - Log shipping from Kubernetes pods to Loki
- **[Blackbox Exporter](charts/blackbox-exporter/)** - Probes services from the outside, such as DNS answering queries

## 📋 Prerequisites

- ODROID-M2 (or compatible ARM64 device)
- Ubuntu Server (or compatible Linux distribution)
- Basic knowledge of Kubernetes and Helm

## 🛠️ Installation

The host is set up by an Ansible playbook: packages, kernel and systemd hardening, the data
disk, MicroK8s with its addons, the shell and the command-line tools. It runs on the machine
itself, starting from a freshly flashed image:

```bash
sudo apt install ansible git
git clone https://github.com/GagaMen/odroid.git
cd odroid/ansible
cp host_vars/odroid.yml.example host_vars/odroid.yml   # then fill it in
ansible-playbook site.yml -K
```

To rebuild a machine whose `host_vars` and `platform/values.yaml` are kept in the vault,
restore them first with `scripts/personal-files pull`. See
[ansible/README.md](ansible/README.md) for the details, and
[ansible/roles/host/README.md](ansible/roles/host/README.md) for why each host setting exists.

## 📦 Deploy the Platform

### 1. Update Helm Dependencies

```bash
cd platform
helm dependency update
```

### 2. Create Your values.yaml

Create a `platform/values.yaml` file with your configuration. See the individual chart READMEs for available options:

- [AdGuard Configuration](charts/adguard/README.md)
- [Actual Budget Configuration](charts/actual/README.md)
- [Paperless-ngx Configuration](charts/paperless/README.md)
- [Home Assistant Configuration](charts/home-assistant/README.md)
- [Mealie Configuration](charts/mealie/README.md)
- [Homepage Configuration](charts/homepage/README.md)
- [ntfy Configuration](charts/ntfy/README.md)
- [Longhorn Configuration](charts/longhorn/README.md)
- [MetalLB Configuration](charts/metallb/README.md)
- [Snapshot Controller Configuration](charts/snapshot-controller/README.md)
- [RustFS Configuration](charts/rustfs/README.md)
- [Velero Configuration](charts/velero/README.md)
- [cert-manager DNS Lexicon Webhook Configuration](charts/cert-manager-dns-lexicon-webhook/README.md)
- [Prometheus Configuration](charts/prometheus/README.md)
- [Grafana Configuration](charts/grafana/README.md)
- [Loki Configuration](charts/loki/README.md)
- [Grafana Alloy Configuration](charts/alloy/README.md)
- [Blackbox Exporter Configuration](charts/blackbox-exporter/README.md)

### 3. Store the Secrets in Bitwarden

Credentials are not kept in `platform/values.yaml`. They live in a Bitwarden organization
(bitwarden.com, a self-hosted Bitwarden server or Vaultwarden) and are read with the `bw` CLI
whenever Helm runs; `scripts/helm-platform` wraps the Helm commands for that. See [Secrets](platform/README.md#secrets) for the setup.

### 4. Install the Platform

The release lives in its own `platform` namespace, because components whose upstream
chart has no namespace override deploy into the namespace of the release.

```bash
kubectl create namespace platform
scripts/helm-platform install
```

### 5. Upgrade the Platform

```bash
scripts/helm-platform upgrade
```

## 📁 Repository Structure

```
├── charts/                                 # Individual Helm charts
│   ├── actual/                             # Actual Budget personal finance manager
│   ├── adguard/                            # AdGuard Home DNS ad-blocker
│   ├── alloy/                              # Grafana Alloy log shipper
│   ├── blackbox-exporter/                  # Probes services from the outside
│   ├── cert-manager-dns-lexicon-webhook/   # DNS-01 ACME solver
│   ├── grafana/                            # Grafana dashboards & alerting
│   ├── home-assistant/                     # Home Assistant home automation
│   ├── homepage/                           # Application dashboard
│   ├── loki/                               # Log aggregation
│   ├── longhorn/                           # Distributed storage
│   ├── mealie/                             # Mealie recipes and meal planning
│   ├── metallb/                            # LAN addresses for LoadBalancer services
│   ├── ntfy/                               # Push notification service
│   ├── paperless/                          # Paperless-ngx document archive
│   ├── prometheus/                         # Metrics collection & storage
│   ├── rustfs/                             # S3 object store, local backup target
│   ├── snapshot-controller/                # CSI snapshot API for Velero
│   └── velero/                             # Encrypted backups to S3
├── platform/                               # Umbrella chart combining all services
│   ├── Chart.yaml                          # Dependencies definition
│   ├── templates/                          # Platform-wide resources
│   │   ├── clusterissuer.yaml              # Let's Encrypt configuration
│   │   ├── namespace.yaml                  # Namespace definitions
│   │   ├── secret.yaml                     # DNS provider credentials
│   │   ├── storageclass.yaml               # Longhorn storage class
│   │   ├── velero-credentials.yaml         # S3 credentials per Velero target
│   │   └── volumesnapshotclass.yaml        # CSI snapshot class backed by Longhorn
│   └── values.yaml                         # Your configuration (gitignored)
├── scripts/                                # Helm wrapper and secret resolver
├── secrets/mapping.yaml                    # Which values come from Bitwarden
├── host/                                   # Host configuration below Kubernetes
│   ├── README.md                           # What each file does and how to apply it
│   └── files/                              # Target-faithful paths (Ansible-role layout)
└── wireguard/                              # WireGuard VPN setup guide
```

## 🔧 Development

### JSON Schema Generation

Each chart and the platform provide a `values.schema.json` that enables IDE validation and autocompletion when editing `values.yaml` files. The schemas are generated from TypeScript type definitions (`values.schema.ts`) using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

#### Prerequisites

```bash
node --version  # requires 24.x
npm install
```

#### Generate a Single Schema

```bash
npm run generate:actual
npm run generate:adguard
npm run generate:alloy
npm run generate:blackbox-exporter
npm run generate:cert-manager-dns-lexicon-webhook
npm run generate:grafana
npm run generate:home-assistant
npm run generate:homepage
npm run generate:loki
npm run generate:longhorn
npm run generate:mealie
npm run generate:metallb
npm run generate:ntfy
npm run generate:paperless
npm run generate:prometheus
npm run generate:rustfs
npm run generate:snapshot-controller
npm run generate:velero
npm run generate:platform
```

#### Generate All Schemas at Once

```bash
npm run generate:all
```

After modifying any `values.schema.ts` file, re-run the corresponding script to keep the `values.schema.json` in sync.

## 🔐 Security Notes

- The `platform/values.yaml` file is gitignored as it contains sensitive configuration
- DNS provider credentials are stored in Kubernetes secrets
- TLS certificates are automatically managed via cert-manager
- Consider using [sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) for GitOps workflows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
