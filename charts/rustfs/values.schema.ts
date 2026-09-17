/** @asType integer */
type IntegerType = number;

/** Storage size @pattern ^[0-9]+(Mi|Gi|Ti)$ */
type StorageSize = string;

interface ContainerImage {
  repository?: string;
  pullPolicy?: string;
  tag?: string;
}

// ---------------------------------------------------------------------------
// Wrapper-owned values
// ---------------------------------------------------------------------------
interface BucketConfig {
  /** Bucket created by the post-install hook (Velero's target) */
  name?: string;
  /** Image of the S3 client that creates the bucket */
  image?: ContainerImage;
}

// ---------------------------------------------------------------------------
// Upstream chart
// ---------------------------------------------------------------------------
interface ModeStandalone {
  enabled?: boolean;
  strategy?: object;
  /** Use PVCs that already exist instead of the chart's own */
  existingClaim?: { dataClaim?: string; logsClaim?: string };
}

interface RustfsMode {
  standalone?: ModeStandalone;
  distributed?: { enabled?: boolean };
}

interface RustfsSecret {
  /** Name of a Secret holding the credentials instead of the values below */
  existingSecret?: string;
  /** Allow the well-known default credentials (development only) */
  allowInsecureDefaults?: boolean;
  rustfs?: {
    access_key?: string;
    secret_key?: string;
  };
}

interface RustfsAppConfig {
  /** Data directories; empty lets the chart derive them from the topology */
  volumes?: string;
  /** S3 API listen address */
  address?: string;
  console_enable?: string;
  console_address?: string;
  region?: string;
  /** Domains for virtual-hosted-style requests */
  domains?: string;
  ec?: { storage_class_standard?: string };
  scanner?: object;
  timeout_profile?: string;
  log_level?: string;
  log_rotation?: object | null;
  /** Log directory; empty logs to stdout and creates no logs PVC */
  obs_log_directory?: string;
  obs_environment?: string;
  obs_endpoint?: object;
  kms?: object;
}

interface RustfsService {
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  headlessAnnotations?: { [key: string]: string };
  traefikAnnotations?: { [key: string]: string };
  type?: "ClusterIP" | "NodePort" | "LoadBalancer";
  loadBalancerIP?: string;
  loadBalancerClass?: string;
  loadBalancerSourceRanges?: string[];
  externalIPs?: string[];
  endpoint?: { port?: IntegerType; nodePort?: IntegerType };
  console?: { port?: IntegerType; nodePort?: IntegerType };
}

interface RustfsStorageClass {
  /** StorageClass for the data (and log) PVCs */
  name?: string;
  dataStorageSize?: StorageSize;
  logStorageSize?: StorageSize;
  pvcAnnotations?: { data?: object; logs?: object };
}

interface RustfsUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  replicaCount?: IntegerType;
  /** Data drives per pod; null lets the chart infer it */
  drivesPerNode?: IntegerType | null;
  clusterDomain?: string;
  /** Deprecated upstream, kept so existing values still render */
  startupWaitTimeoutSeconds?: IntegerType;
  localEndpointHost?: { autoInject?: boolean | null };
  image?: { rustfs?: ContainerImage; initImage?: ContainerImage };
  imagePullSecrets?: object[];
  imageRegistryCredentials?: object;
  nameOverride?: string;
  fullnameOverride?: string;
  mode?: RustfsMode;
  /** Additional server pools (distributed mode only) */
  pools?: { enabled?: boolean; list?: object[] };
  secret?: RustfsSecret;
  config?: { rustfs?: RustfsAppConfig };
  extraEnv?: object[];
  extraVolumes?: object[];
  extraVolumeMounts?: object[];
  serviceAccount?: object;
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  commonLabels?: { [key: string]: string };
  podSecurityContext?: object;
  containerSecurityContext?: object;
  priorityClassName?: string;
  service?: RustfsService;
  ingress?: object;
  gatewayApi?: object;
  mtls?: object;
  resources?: object;
  livenessProbe?: object;
  readinessProbe?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  topologySpreadConstraints?: object[] | object;
  storageclass?: RustfsStorageClass;
  pdb?: object;
  enableServiceLinks?: boolean;
  extraManifests?: object[];
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Bucket created by this wrapper after install */
  bucket?: BucketConfig;
  /** RustFS upstream chart values (see https://charts.rustfs.com) */
  rustfs?: RustfsUpstream;
}
