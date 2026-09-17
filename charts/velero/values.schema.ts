/** @asType integer */
type IntegerType = number;

/** Go duration, e.g. 168h @pattern ^[0-9]+(h|m|s)$ */
type Duration = string;

// ---------------------------------------------------------------------------
// Wrapper-owned values
// ---------------------------------------------------------------------------
interface Tier {
  /** Cron expression; the target's offset is added to its minute */
  schedule: string;
  /** Values of the PVC label this tier backs up */
  policies: string[];
  /** How long a backup of this tier is kept */
  ttl: Duration;
}

interface Scope {
  /** Namespaces searched for labelled PVCs */
  namespaces?: string[];
  /** PVC label that selects the backup tier */
  label?: string;
  /** Backup tiers (GFS): one Schedule per tier and target */
  tiers?: { [name: string]: Tier };
}

interface Target {
  /** Render a BackupStorageLocation and Schedules for this target */
  enabled?: boolean;
  /** Velero's default backup location */
  default?: boolean;
  bucket?: string;
  region?: string;
  /** S3 endpoint URL */
  s3Url?: string;
  /** Minutes added to each tier's cron minute, to stagger the targets */
  scheduleOffsetMinutes?: IntegerType;
  /** Access key; read by the platform chart when building the credentials file */
  accessKey?: string;
  /** Secret key; read by the platform chart when building the credentials file */
  secretKey?: string;
}

// ---------------------------------------------------------------------------
// Upstream chart
// ---------------------------------------------------------------------------
interface VeleroConfiguration {
  /** Comma-separated feature flags, e.g. EnableCSI */
  features?: string;
  /** Move CSI snapshot data to object storage by default */
  defaultSnapshotMoveData?: boolean;
  /** Data mover: kopia or restic */
  uploaderType?: string;
  backupStorageLocation?: object[];
  volumeSnapshotLocation?: object[];
  defaultBackupStorageLocation?: string;
  defaultBackupTTL?: Duration;
  defaultVolumesToFsBackup?: boolean;
  defaultRepoMaintainFrequency?: Duration;
  defaultItemOperationTimeout?: Duration;
  dataMoverPrepareTimeout?: Duration;
  fsBackupTimeout?: Duration;
  garbageCollectionFrequency?: Duration;
  storeValidationFrequency?: Duration;
  backupSyncPeriod?: Duration;
  itemBlockWorkerCount?: IntegerType;
  disableInformerCache?: boolean;
  disableControllers?: string;
  logFormat?: string;
  logLevel?: string;
  metricsAddress?: string;
  repositoryMaintenanceJob?: object;
  restoreOnlyMode?: boolean;
  restoreResourcePriorities?: string;
  extraArgs?: string[];
  extraEnvVars?: object[];
}

interface VeleroCredentials {
  useSecret?: boolean;
  /** Name of the secret the chart would create */
  name?: string;
  /** Use a secret that already exists instead */
  existingSecret?: string;
  /** Contents of the credentials file, keyed by file name */
  secretContents?: { [key: string]: string };
  extraEnvVars?: { [key: string]: string };
  extraSecretRef?: string;
}

interface VeleroNodeAgent {
  disableHostPath?: boolean;
  podVolumePath?: string;
  pluginVolumePath?: string;
  priorityClassName?: string;
  runtimeClassName?: string;
  resources?: object;
  resizePolicy?: object[];
  tolerations?: object[];
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  useScratchEmptyDir?: boolean;
  extraVolumes?: object[];
  extraVolumeMounts?: object[];
  extraEnvVars?: object[];
  extraArgs?: string[];
  dnsPolicy?: string;
  hostAliases?: object[];
  podSecurityContext?: object;
  containerSecurityContext?: object;
  lifecycle?: object;
  nodeSelector?: { [key: string]: string };
  affinity?: object;
  dnsConfig?: object;
  updateStrategy?: object;
}

interface VeleroUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  namespace?: object;
  image?: object;
  nameOverride?: string;
  fullnameOverride?: string;
  annotations?: { [key: string]: string };
  secretAnnotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  resources?: object;
  resizePolicy?: object[];
  hostAliases?: object[];
  upgradeJobResources?: object;
  upgradeCRDsJob?: object;
  dnsPolicy?: string;
  /** Plugin provider images; at least one is required */
  initContainers?: object[] | string;
  podSecurityContext?: object;
  containerSecurityContext?: object;
  lifecycle?: object;
  priorityClassName?: string;
  runtimeClassName?: string;
  terminationGracePeriodSeconds?: IntegerType;
  livenessProbe?: object;
  readinessProbe?: object;
  tolerations?: object[];
  affinity?: object;
  nodeSelector?: { [key: string]: string };
  dnsConfig?: object;
  podDisruptionBudget?: object;
  extraVolumes?: object[];
  extraVolumeMounts?: object[];
  extraObjects?: object[];
  metrics?: object;
  /** Image of the kubectl container used by the CRD jobs */
  kubectl?: object;
  upgradeCRDs?: boolean;
  cleanUpCRDs?: boolean;
  configuration?: VeleroConfiguration;
  rbac?: { create?: boolean; clusterAdministrator?: boolean; clusterAdministratorName?: string };
  serviceAccount?: object;
  credentials?: VeleroCredentials;
  /** Render a default BackupStorageLocation (this wrapper renders its own) */
  backupsEnabled?: boolean;
  /** Render a VolumeSnapshotLocation (not needed with CSI data movement) */
  snapshotsEnabled?: boolean;
  deployNodeAgent?: boolean;
  nodeAgent?: VeleroNodeAgent;
  /** Schedules rendered by the upstream chart (this wrapper renders its own) */
  schedules?: object;
  configMaps?: object;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Kopia repository password; required, and unchangeable after the first backup */
  repositoryPassword?: string;
  /** What is backed up, and for how long */
  scope?: Scope;
  /** Backup storage locations, keyed by name (also the credentials profile) */
  targets?: { [name: string]: Target };
  /** Velero upstream chart values (see https://github.com/vmware-tanzu/helm-charts/tree/main/charts/velero) */
  velero?: VeleroUpstream;
}
