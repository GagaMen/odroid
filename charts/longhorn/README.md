# Longhorn

[Longhorn](https://longhorn.io/) is a lightweight, reliable, and powerful distributed block storage system for Kubernetes. This chart wraps the official Longhorn Helm chart with custom configuration.

## Features

- Distributed block storage with replication
- Automatic backup to S3-compatible storage or NFS
- Snapshot and backup management
- Volume cloning
- Disaster recovery
- Built-in UI for management

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
longhorn:
  enabled: true
```

### Standalone

```bash
helm install longhorn ./charts/longhorn -f values.yaml
```

> **Note:** Longhorn creates its own namespace `longhorn-system` by default. Use `config.namespaceOverride` to change it.

## Chart Structure

This chart uses the official Longhorn chart as a dependency:

```yaml
# Chart.yaml
dependencies:
  - name: longhorn
    version: 1.10.1
    repository: https://charts.longhorn.io
    alias: config
```

All Longhorn configuration is passed through the `config` key.

## Configuration

### Basic Configuration

```yaml
longhorn:
  enabled: true
  config:
    # Longhorn settings - see official docs for full list
    defaultSettings:
      backupTarget: s3://bucket-name@region/
      backupTargetCredentialSecret: longhorn-backup-secret
      createDefaultDiskLabeledNodes: true
      defaultDataPath: /var/lib/longhorn/
      defaultReplicaCount: 1  # Set to 1 for single-node setup
```

### Storage Class

The platform chart creates a custom StorageClass with `Retain` policy:

```yaml
# Automatically created by platform chart
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: longhorn-retain
provisioner: driver.longhorn.io
allowVolumeExpansion: true
reclaimPolicy: Retain
volumeBindingMode: Immediate
parameters:
  numberOfReplicas: "1"
  staleReplicaTimeout: "2880"
  fsType: "ext4"
```

### Backup Configuration

The platform chart includes pre-configured recurring backup jobs following the GFS (Grandfather-Father-Son) backup strategy:

| Job | Schedule | Retention | Description | Full Backup |
|-----|----------|-----------|-------------|-------------|
| `backup-daily` | Mon-Sat 2:00 AM | 6 backups | Daily incremental backups | No |
| `backup-weekly` | Sunday 2:00 AM | 4 backups | Weekly backups | No |
| `backup-monthly-full` | 1st of month 3:00 AM | 3 backups | Monthly full backups | Yes |

To use these backup jobs, add the `gfs-backup` group to your volumes:

```yaml
persistence:
  storageClass: longhorn-retain
  annotations:
    recurring-job-group.longhorn.io/gfs-backup: enabled
```

## Example Configuration

```yaml
longhorn:
  enabled: true
  config:
    defaultSettings:
      backupTarget: "s3://my-backup-bucket@eu-central-1/"
      backupTargetCredentialSecret: longhorn-backup-secret
      defaultDataPath: /var/lib/longhorn/
      defaultReplicaCount: 1
      storageMinimalAvailablePercentage: 15
      upgradeChecker: false
      defaultLonghornStaticStorageClass: longhorn-retain
      
    ingress:
      enabled: true
      ingressClassName: nginx
      host: longhorn.example.com
      tls: true
      tlsSecret: longhorn-tls
      annotations:
        cert-manager.io/cluster-issuer: lets-encrypt
        nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

## Backup Secret

Create a secret for S3 backup access:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: longhorn-backup-secret
  namespace: longhorn
type: Opaque
stringData:
  AWS_ACCESS_KEY_ID: <your-access-key>
  AWS_SECRET_ACCESS_KEY: <your-secret-key>
  AWS_ENDPOINTS: https://s3.eu-central-1.amazonaws.com
```

Or for S3-compatible storage (MinIO, Backblaze B2, etc.):

```yaml
stringData:
  AWS_ACCESS_KEY_ID: <your-access-key>
  AWS_SECRET_ACCESS_KEY: <your-secret-key>
  AWS_ENDPOINTS: https://s3.your-provider.com
```

## Tips

### MicroK8s Setup

When running Longhorn on MicroK8s, you **must** configure the correct kubelet root directory, otherwise the CSI driver won't work:

```yaml
longhorn:
  enabled: true
  config:
    csi:
      kubeletRootDir: /var/snap/microk8s/common/var/lib/kubelet
```

### Single-Node Setup

For a single-node setup (like ODROID), set replica count to 1:

```yaml
config:
  defaultSettings:
    defaultReplicaCount: 1
```

### Disk Management

Longhorn can use dedicated disks or directories. For ODROID with additional storage:

```yaml
config:
  defaultSettings:
    createDefaultDiskLabeledNodes: true
    defaultDataPath: /mnt/storage/longhorn/
```

### Volume Expansion

Volumes can be expanded online. Enable in your application's PVC:

```yaml
spec:
  resources:
    requests:
      storage: 10Gi  # Can be increased later
```

### Monitoring

Longhorn exposes Prometheus metrics. Enable ServiceMonitor if using Prometheus Operator:

```yaml
config:
  metrics:
    serviceMonitor:
      enabled: true
```

## Troubleshooting

### Check Longhorn Manager Logs

```bash
kubectl logs -n longhorn deployment/longhorn-manager
```

### Access Longhorn UI

```bash
kubectl port-forward -n longhorn svc/longhorn-frontend 8080:80
```

Then open http://localhost:8080

### Volume Issues

Check volume status in Longhorn UI or via:

```bash
kubectl get volumes.longhorn.io -n longhorn
```

## Links

- [Longhorn Documentation](https://longhorn.io/docs/)
- [Longhorn GitHub](https://github.com/longhorn/longhorn)
- [Helm Chart Values](https://github.com/longhorn/longhorn/blob/master/chart/values.yaml)
- [Backup & Restore](https://longhorn.io/docs/latest/snapshots-and-backups/)
