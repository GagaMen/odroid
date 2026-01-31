# Odroid Home Server

A Kubernetes-based home server setup running on [ODROID-M2](https://www.hardkernel.com/shop/odroid-m2-with-16gbyte-ram/) with 16GB RAM. This repository contains Helm charts and configurations for a complete self-hosted infrastructure including DNS ad-blocking, a customizable dashboard, push notifications, and distributed storage.

## 🚀 Features

- **[AdGuard Home](charts/adguard/)** - Network-wide ad & tracker blocking DNS server
- **[Homepage](charts/homepage/)** - Modern, customizable application dashboard
- **[ntfy](charts/ntfy/)** - Self-hosted push notification service
- **[Longhorn](charts/longhorn/)** - Cloud-native distributed storage
- **[cert-manager DNS Lexicon Webhook](charts/cert-manager-dns-lexicon-webhook/)** - DNS-01 ACME challenge solver
- **[WireGuard VPN](wireguard/)** - Secure remote access to your home network

## 📋 Prerequisites

- ODROID-M2 (or compatible ARM64 device)
- Ubuntu Server (or compatible Linux distribution)
- Basic knowledge of Kubernetes and Helm

## 🛠️ Installation

### 1. Install MicroK8s

Use this command to install the latest version:

```bash
snap install microk8s --classic
```

To install a specific version see [MicroK8s Snap Channels](https://microk8s.io/docs/setting-snap-channel).

### 2. Enable Basic Addons

```bash
microk8s enable dns
microk8s enable ingress
microk8s enable cert-manager
microk8s enable metrics-server
```

### 3. Configure Shell (zsh)

Add kubectl aliases and enable autocompletion:

```bash
alias kubectl="microk8s.kubectl"
alias k="kubectl"
source <(kubectl completion zsh | sed "s/kubectl/microk8s.kubectl/g")
source <(k completion zsh | sed "s/k/microk8s.kubectl/g")
```

Add helm alias and enable autocompletion:

```bash
alias helm="microk8s.helm3"
source <(helm completion zsh | sed "s/helm/microk8s.helm3/g")
```

### 4. Install k9s (Optional)

[k9s](https://k9scli.io/) is a terminal-based UI for managing Kubernetes clusters.

Go to the [release page](https://github.com/derailed/k9s/releases), download the latest arm64 binary:

```bash
wget https://github.com/derailed/k9s/releases/download/v0.40.10/k9s_Linux_arm64.tar.gz
tar -xvzf k9s_Linux_arm64.tar.gz
sudo mv k9s /usr/local/bin

# Clean up
rm k9s_Linux_arm64.tar.gz README.md LICENSE 
```

#### Configure kubectl for k9s Shell Access

To use shell access in pods via k9s, create a kubectl wrapper:

```bash
sudo tee /usr/local/bin/kubectl > /dev/null << 'EOF'
#!/bin/bash
exec /snap/bin/microk8s.kubectl "$@"
EOF
sudo chmod +x /usr/local/bin/kubectl
```

> **Note:** A symbolic link doesn't work in this case.

### 5. Export KUBECONFIG Environment Variable

Add this to your `.zshrc` or `.bashrc`:

```bash
export KUBECONFIG=/var/snap/microk8s/current/credentials/client.config
```

## 📦 Deploy the Platform

### 1. Update Helm Dependencies

```bash
cd platform
helm dependency update
```

### 2. Create Your values.yaml

Create a `platform/values.yaml` file with your configuration. See the individual chart READMEs for available options:

- [AdGuard Configuration](charts/adguard/README.md)
- [Homepage Configuration](charts/homepage/README.md)
- [ntfy Configuration](charts/ntfy/README.md)
- [Longhorn Configuration](charts/longhorn/README.md)
- [cert-manager DNS Lexicon Webhook Configuration](charts/cert-manager-dns-lexicon-webhook/README.md)

### 3. Install the Platform

```bash
helm install odroid-platform ./platform -f platform/values.yaml
```

### 4. Upgrade the Platform

```bash
helm upgrade odroid-platform ./platform -f platform/values.yaml
```

## 📁 Repository Structure

```
├── charts/                                 # Individual Helm charts
│   ├── adguard/                            # AdGuard Home DNS ad-blocker
│   ├── cert-manager-dns-lexicon-webhook/   # DNS-01 ACME solver
│   ├── homepage/                           # Application dashboard
│   ├── longhorn/                           # Distributed storage
│   └── ntfy/                               # Push notification service
├── platform/                               # Umbrella chart combining all services
│   ├── Chart.yaml                          # Dependencies definition
│   ├── templates/                          # Platform-wide resources
│   │   ├── clusterissuer.yaml              # Let's Encrypt configuration
│   │   ├── namespace.yaml                  # Namespace definitions
│   │   ├── recurring-job.yaml              # Longhorn backup jobs
│   │   ├── secret.yaml                     # DNS provider credentials
│   │   └── storageclass.yaml               # Longhorn storage class
│   └── values.yaml                         # Your configuration (gitignored)
└── wireguard/                              # WireGuard VPN setup guide
```

## 🔐 Security Notes

- The `platform/values.yaml` file is gitignored as it contains sensitive configuration
- DNS provider credentials are stored in Kubernetes secrets
- TLS certificates are automatically managed via cert-manager
- Consider using [sealed-secrets](https://github.com/bitnami-labs/sealed-secrets) for GitOps workflows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
