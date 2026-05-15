type FsType = "ext4" | "xfs";
type DataLocality = "disabled" | "best-effort";
type ReclaimPolicy = "Retain" | "Delete";
type VolumeBindingMode = "Immediate" | "WaitForFirstConsumer";
type DisableRevisionCounter = "true" | "false";
type DataEngine = "v1" | "v2";
type NetworkPolicyType = "k3s" | "rke2" | "rke1";

/** @asType integer */
type IntegerType = number;

interface CattleWindowsCluster {
  enabled?: boolean;
}

interface Cattle {
  systemDefaultRegistry?: string;
  windowsCluster?: CattleWindowsCluster;
}

interface GlobalConfig {
  /** Global override for container image registry */
  imageRegistry?: string;
  imagePullSecrets?: object[];
  /** Container timezone (TZ env) for all Longhorn workloads */
  timezone?: string;
  tolerations?: object[];
  nodeSelector?: { [key: string]: string };
  cattle?: Cattle;
}

interface NetworkPolicies {
  /** Enable network policies */
  enabled?: boolean;
  /** Distribution type */
  type?: NetworkPolicyType;
}

interface LonghornPersistence {
  /** Use as the default StorageClass */
  defaultClass?: boolean;
  /** Filesystem type */
  defaultFsType?: FsType;
  /** mkfs parameters */
  defaultMkfsParams?: string;
  /**
   * Replica count for the default StorageClass
   * @asType integer
   * @minimum 1
   */
  defaultClassReplicaCount?: number;
  /** Data locality setting */
  defaultDataLocality?: DataLocality;
  /** Reclaim policy for released volumes */
  reclaimPolicy?: ReclaimPolicy;
  /** When volume binding and dynamic provisioning should occur */
  volumeBindingMode?: VolumeBindingMode;
  /** Enable live migration */
  migratable?: boolean;
  /** Disable revision counter */
  disableRevisionCounter?: DisableRevisionCounter;
  /** NFS mount options for RWX volumes */
  nfsOptions?: string;
  recurringJobSelector?: {
    enable?: boolean;
    jobList?: object[];
  };
  backingImage?: {
    enable?: boolean;
    name?: string | null;
    dataSourceType?: string | null;
    dataSourceParameters?: string | null;
    expectedChecksum?: string | null;
  };
  defaultDiskSelector?: {
    enable?: boolean;
    selector?: string;
  };
  defaultNodeSelector?: {
    enable?: boolean;
    selector?: string;
  };
  unmapMarkSnapChainRemoved?: string;
  /** Data engine version */
  dataEngine?: DataEngine;
  /** Backup target name */
  backupTargetName?: string;
}

interface CsiConfig {
  /** kubelet root directory (e.g. /var/snap/microk8s/common/var/lib/kubelet) */
  kubeletRootDir?: string | null;
  /** Pod anti-affinity preset (soft or hard) */
  podAntiAffinityPreset?: string | null;
  /**
   * Replica count of the CSI Attacher (default: 3)
   * @minimum 1
   */
  attacherReplicaCount?: IntegerType | null;
  /**
   * Replica count of the CSI Provisioner (default: 3)
   * @minimum 1
   */
  provisionerReplicaCount?: IntegerType | null;
  /**
   * Replica count of the CSI Resizer (default: 3)
   * @minimum 1
   */
  resizerReplicaCount?: IntegerType | null;
  /**
   * Replica count of the CSI Snapshotter (default: 3)
   * @minimum 1
   */
  snapshotterReplicaCount?: IntegerType | null;
}

interface DefaultSettings {
  defaultDataPath?: string | null;
  defaultLonghornStaticStorageClass?: string | null;
  defaultReplicaCount?: IntegerType | null;
  storageOverProvisioningPercentage?: IntegerType | null;
  storageMinimalAvailablePercentage?: IntegerType | null;
  storageReservedPercentageForDefaultDisk?: IntegerType | null;
  allowRecurringJobWhileVolumeDetached?: boolean | null;
  createDefaultDiskLabeledNodes?: boolean | null;
  defaultDataLocality?: string | null;
  replicaSoftAntiAffinity?: boolean | null;
  replicaAutoBalance?: string | null;
  upgradeChecker?: boolean | null;
  upgradeResponderURL?: string | null;
  managerUrl?: string | null;
  failedBackupTTL?: IntegerType | null;
  backupExecutionTimeout?: IntegerType | null;
  restoreVolumeRecurringJobs?: boolean | null;
  recurringSuccessfulJobsHistoryLimit?: IntegerType | null;
  recurringFailedJobsHistoryLimit?: IntegerType | null;
  recurringJobMaxRetention?: IntegerType | null;
  supportBundleFailedHistoryLimit?: IntegerType | null;
  taintToleration?: string | null;
  systemManagedComponentsNodeSelector?: string | null;
  systemManagedCSIComponentsResourceLimits?: string | null;
  priorityClass?: string | null;
  autoSalvage?: boolean | null;
  autoDeletePodWhenVolumeDetachedUnexpectedly?: boolean | null;
  blacklistForAutoDeletePodWhenVolumeDetachedUnexpectedly?: string | null;
  disableSchedulingOnCordonedNode?: boolean | null;
  replicaZoneSoftAntiAffinity?: boolean | null;
  replicaDiskSoftAntiAffinity?: boolean | null;
  nodeDownPodDeletionPolicy?: string | null;
  nodeDrainPolicy?: string | null;
  detachManuallyAttachedVolumesWhenCordoned?: boolean | null;
  replicaReplenishmentWaitInterval?: IntegerType | null;
  concurrentReplicaRebuildPerNodeLimit?: IntegerType | null;
  rebuildConcurrentSyncLimit?: IntegerType | null;
  concurrentVolumeBackupRestorePerNodeLimit?: IntegerType | null;
  disableRevisionCounter?: string | null;
  systemManagedPodsImagePullPolicy?: string | null;
  allowVolumeCreationWithDegradedAvailability?: boolean | null;
  autoCleanupSystemGeneratedSnapshot?: boolean | null;
  autoCleanupRecurringJobBackupSnapshot?: boolean | null;
  concurrentAutomaticEngineUpgradePerNodeLimit?: IntegerType | null;
  backingImageCleanupWaitInterval?: IntegerType | null;
  backingImageRecoveryWaitInterval?: IntegerType | null;
  guaranteedInstanceManagerCPU?: string | null;
  kubernetesClusterAutoscalerEnabled?: boolean | null;
  orphanResourceAutoDeletion?: string | null;
  orphanResourceAutoDeletionGracePeriod?: IntegerType | null;
  storageNetwork?: string | null;
  endpointNetworkForRWXVolume?: string | null;
  deletingConfirmationFlag?: boolean | null;
  engineReplicaTimeout?: IntegerType | null;
  snapshotDataIntegrity?: string | null;
  snapshotDataIntegrityImmediateCheckAfterSnapshotCreation?: boolean | null;
  snapshotDataIntegrityCronjob?: string | null;
  snapshotHeavyTaskConcurrentLimit?: IntegerType | null;
  removeSnapshotsDuringFilesystemTrim?: boolean | null;
  fastReplicaRebuildEnabled?: boolean | null;
  replicaFileSyncHttpClientTimeout?: IntegerType | null;
  longGRPCTimeOut?: IntegerType | null;
  logLevel?: string | null;
  logPath?: string | null;
  backupCompressionMethod?: string | null;
  backupConcurrentLimit?: IntegerType | null;
  defaultBackupBlockSize?: IntegerType | null;
  restoreConcurrentLimit?: IntegerType | null;
  v1DataEngine?: boolean | null;
  v2DataEngine?: boolean | null;
  dataEngineHugepageEnabled?: boolean | null;
  dataEngineMemorySize?: string | null;
  dataEngineCPUMask?: string | null;
  replicaRebuildingBandwidthLimit?: IntegerType | null;
  defaultUblkQueueDepth?: IntegerType | null;
  defaultUblkNumberOfQueue?: IntegerType | null;
  instanceManagerPodLivenessProbeTimeout?: IntegerType | null;
  allowEmptyNodeSelectorVolume?: boolean | null;
  allowEmptyDiskSelectorVolume?: boolean | null;
  allowCollectingLonghornUsageMetrics?: boolean | null;
  disableSnapshotPurge?: boolean | null;
  snapshotMaxCount?: IntegerType | null;
  dataEngineLogLevel?: string | null;
  dataEngineLogFlags?: string | null;
  freezeFilesystemForSnapshot?: boolean | null;
  autoCleanupSnapshotWhenDeleteBackup?: boolean | null;
  autoCleanupSnapshotAfterOnDemandBackupCompleted?: boolean | null;
  rwxVolumeFastFailover?: boolean | null;
  offlineReplicaRebuilding?: string | null;
  nodeDiskHealthMonitoring?: boolean | null;
  csiAllowedTopologyKeys?: string | null;
  csiStorageCapacityTracking?: boolean | null;
}

interface DefaultBackupStore {
  backupTarget?: string | null;
  backupTargetCredentialSecret?: string | null;
  pollInterval?: IntegerType | null;
}

interface PrivateRegistry {
  createSecret?: boolean | null;
  registryUrl?: string | null;
  registryUser?: string | null;
  registryPasswd?: string | null;
  registrySecret?: string | null;
}

interface LonghornManagerLog {
  format?: string;
}

interface LonghornManagerConfig {
  log?: LonghornManagerLog;
  priorityClass?: string;
  tolerations?: object[];
  resources?: object | null;
  nodeSelector?: { [key: string]: string };
  serviceAnnotations?: { [key: string]: string };
  serviceLabels?: { [key: string]: string };
  updateStrategy?: object;
}

interface LonghornDriverConfig {
  log?: LonghornManagerLog;
  priorityClass?: string;
  tolerations?: object[];
  nodeSelector?: { [key: string]: string };
}

interface LonghornUIConfig {
  /**
   * @asType integer
   * @minimum 1
   */
  replicas?: number;
  priorityClass?: string;
  affinity?: object;
  tolerations?: object[];
  nodeSelector?: { [key: string]: string };
}

interface LonghornIngressConfig {
  enabled?: boolean;
  ingressClassName?: string | null;
  host?: string;
  extraHosts?: string[];
  tls?: boolean;
  secureBackends?: boolean;
  tlsSecret?: string;
  path?: string;
  pathType?: string;
  annotations?: object | null;
  secrets?: object | null;
}

interface LonghornHttpRoute {
  enabled?: boolean;
  parentRefs?: object[];
  hostnames?: string[];
  path?: string;
  pathType?: string;
  annotations?: { [key: string]: string };
}

interface LonghornMetrics {
  serviceMonitor?: {
    enabled?: boolean;
    additionalLabels?: { [key: string]: string };
    annotations?: { [key: string]: string };
    interval?: string;
    scrapeTimeout?: string;
    relabelings?: object[];
    metricRelabelings?: object[];
  };
}

interface LonghornOpenshift {
  enabled?: boolean;
  ui?: {
    route?: string;
    /** @asType integer */
    port?: number;
    /** @asType integer */
    proxy?: number;
  };
}

interface PreUpgradeChecker {
  /** Enable pre-upgrade checks */
  jobEnabled?: boolean;
  upgradeVersionCheck?: boolean;
}

interface LonghornConfig {
  /** Global settings */
  global?: GlobalConfig;
  networkPolicies?: NetworkPolicies;
  /** Container image overrides for Longhorn components */
  image?: object;
  /** Longhorn UI service configuration */
  service?: object;
  /** Default StorageClass configuration */
  persistence?: LonghornPersistence;
  preUpgradeChecker?: PreUpgradeChecker;
  /** CSI driver configuration */
  csi?: CsiConfig;
  /** Longhorn default settings (see https://longhorn.io/docs/latest/references/settings/) */
  defaultSettings?: DefaultSettings;
  defaultBackupStore?: DefaultBackupStore;
  privateRegistry?: PrivateRegistry;
  /** Longhorn Manager DaemonSet configuration */
  longhornManager?: LonghornManagerConfig;
  /** Longhorn Driver Deployer configuration */
  longhornDriver?: LonghornDriverConfig;
  /** Longhorn UI Deployment configuration */
  longhornUI?: LonghornUIConfig;
  longhornConversionWebhook?: object;
  longhornAdmissionWebhook?: object;
  longhornRecoveryBackend?: object;
  /** Ingress for the Longhorn UI */
  ingress?: LonghornIngressConfig;
  /** HTTPRoute for the Longhorn UI (Gateway API) */
  httproute?: LonghornHttpRoute;
  /** Override the deployment namespace */
  namespaceOverride?: string;
  /** Global annotations */
  annotations?: { [key: string]: string };
  serviceAccount?: object;
  /** Metrics and ServiceMonitor configuration */
  metrics?: LonghornMetrics;
  /** OpenShift integration settings */
  openshift?: LonghornOpenshift;
  /** Enable PodSecurityPolicy */
  enablePSP?: boolean;
  /** Enable Go coverage directory */
  enableGoCoverDir?: boolean;
  /** Extra Kubernetes manifests to deploy */
  extraObjects?: object[];
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Longhorn upstream chart values (alias for the longhorn dependency, see https://longhorn.io/docs/) */
  config?: LonghornConfig;
  /** Helm injects the dependency's chart name as an additional values key alongside the alias */
  longhorn?: object;
}
