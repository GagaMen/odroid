# Agent Instructions

This file contains important instructions for AI agents working with this repository.

## 📁 Repository Overview

This repository contains Helm charts and Kubernetes configurations for a self-hosted home server based on ODROID-M2. The repository is **public**.

### Structure

- `charts/` - Individual Helm charts for various services
- `platform/` - Umbrella chart for orchestrating all charts
- `wireguard/` - WireGuard VPN configuration

## ⚠️ CRITICAL: File Access and Security

### Only Read Versioned Files

**IMPORTANT:** Only read files that are checked into Git!

Before reading a file, check if it is excluded by `.gitignore`. The following files/folders are ignored and must **NOT** be read:

```
# Backups
.backups/
*.bak

# Helm Dependencies (downloaded, not versioned)
charts/**/charts/*.tgz
charts/**/charts/*/
Chart.lock
platform/charts/

# Sensitive Configuration
platform/values.yaml
```

**Reason:** Ignored files may contain sensitive data such as:
- API keys and tokens
- Passwords and credentials
- Private keys
- Personal configurations

### When in Doubt: Check Git Status

If you are unsure whether a file may be read, run the following command:

```bash
git ls-files --error-unmatch <filename>
```

Only if the file is returned, it is versioned and may be read.

## 🔒 Security Checklist After Every Task

**MANDATORY:** After completing any task, the following checks MUST be performed:

### 1. Check for Sensitive Data in Changes

```bash
git diff --staged
git diff
```

Look for the following in the changes:

- [ ] **Passwords** - Plain text passwords, `password:`, `passwd:`
- [ ] **API Keys** - `api_key`, `apikey`, `api-key`, `token`
- [ ] **Secrets** - `secret`, `auth_password`, `auth_username`
- [ ] **Private Keys** - `-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`
- [ ] **Credentials** - Usernames with passwords, Basic Auth strings
- [ ] **IP Addresses** - Private/public IPs that should not be exposed
- [ ] **Domains** - Personal domains that should not be public
- [ ] **Email Addresses** - Personal email addresses

### 2. Run Automatic Check

```bash
# Check if sensitive patterns appear in staged files
git diff --staged | grep -iE "(password|passwd|secret|api[_-]?key|token|private[_-]?key|auth_)" || echo "✅ No obvious sensitive data found"
```

### 3. Verify .gitignore Compliance

```bash
# Show all untracked files that could potentially be sensitive
git status --porcelain | grep "^??" 
```

If new files with sensitive data are found, add them to `.gitignore`!

## 📝 Best Practices for This Repository

### Helm Values

- **Default Values** (`values.yaml` in charts): Contain only placeholders or safe defaults
- **Production Values** (`platform/values.yaml`): Contains real credentials → is ignored!
- New charts should follow this pattern

### Secrets in Templates

Secrets are injected via Helm values (see `platform/templates/secret.yaml`). The actual values come from the ignored `platform/values.yaml`.

### Creating New Files

When creating new files with potentially sensitive data:

1. Add the file to `.gitignore` **BEFORE** creating it
2. Create an `.example` version with placeholders for documentation
3. Document the required values in the README

## ⚙️ Traps in This Repository

Three things that are not obvious and have cost real debugging time.

### The umbrella renders from vendored archives, not the working tree

`helm template ./platform` and `helm upgrade` read `platform/charts/*.tgz`, **not** the files
you just edited under `charts/`. Editing a subchart and rendering immediately shows the *old*
content, which reads as "my change had no effect" and sends you looking for the wrong bug.

After touching anything under `charts/`, repackage before rendering or deploying:

```bash
helm dependency update platform/
```

The same applies one level down: `charts/<name>/charts/*.tgz` is vendored too, and a mismatch
between a dependency's declared version and the vendored archive makes Helm silently drop that
dependency's `alias`, so values addressed through the alias never arrive. Check the status with
`helm dependency list charts/<name>` — it must say `ok`, not `wrong version`.

Verify what will actually be deployed by looking inside the archive, not at the working tree:

```bash
tar xzOf platform/charts/<chart>-1.0.0.tgz <chart>/values.yaml | grep <what-you-changed>
```

### Grafana alerting is provisioned from files

Alert rules, the contact point, the notification policy and time intervals live in
`charts/grafana/files/alerting/*.yaml` and are mounted through a ConfigMap built by
`charts/grafana/templates/alerting-configmap.yaml`. They are **read-only in the Grafana UI**;
anything changed there is overwritten on the next `helm upgrade`. Edit the files and deploy.

Do not move this into the upstream chart's `alerting` value. That value is passed through
Helm's `tpl`, which tries to evaluate the Go templates inside alert annotations and the webhook
payload — `{{ $labels.x }}`, `{{ .CommonLabels.y }}` — as Helm templates and fails.

Alert annotations are rendered into a JSON payload. Write `\n` as two characters for a line
break; a real newline lands unescaped inside a JSON string, the request becomes malformed, and
the notification is silently dropped.

### The host is not a stock Ubuntu

The kernel and systemd come from the board vendor and are pinned to a much older version than
the rest of userspace. Consequences that matter when touching services:

- A unit with a `SystemCallFilter` may be killed by seccomp with SIGSYS, because the older
  systemd omits syscalls current glibc uses.
- Several distribution services cannot start at all and are deliberately masked.
- `microk8s stop` does not unmount CSI volumes and strands them on dead devices.

Read [`host/README.md`](host/README.md) before changing anything below Kubernetes.

## 🛠️ Technology Stack

- **Kubernetes:** MicroK8s on ARM64 (ODROID-M2)
- **Package Manager:** Helm 3
- **Charts:** Custom charts + dependencies
- **Storage:** Longhorn (cloud-native distributed storage)
- **Ingress:** MicroK8s Ingress Controller
- **TLS:** cert-manager with DNS-01 challenge (Lexicon Webhook)

## 📋 Useful Commands

```bash
# Update Helm dependencies
helm dependency update platform/

# Install/upgrade chart
helm upgrade --install platform platform/ -f platform/values.yaml

# Show all resources in namespace
kubectl get all -n <namespace>

# Show logs of a pod
kubectl logs -n <namespace> <pod-name>
```

## 🚨 In Case of Security Incidents

If sensitive data was accidentally committed:

1. **DO NOT push!**
2. Undo the commit: `git reset HEAD~1`
3. Remove sensitive data from the file
4. Add the file to `.gitignore` if needed
5. Commit again

If already pushed:
1. Clean repository history (e.g., with `git filter-branch` or BFG Repo-Cleaner)
2. Immediately rotate/change all exposed credentials
3. Force-push the cleaned history
