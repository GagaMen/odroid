type LokiDeploymentMode = "SingleBinary" | "SimpleScalable" | "Distributed";
type StorageType = "filesystem" | "s3" | "gcs" | "azure" | "swift";
type StoreType = "tsdb" | "boltdb-shipper";
type SchemaVersion = "v11" | "v12" | "v13";

/** Storage size @pattern ^[0-9]+(Mi|Gi|Ti)$ */
type StorageSize = string;

// ---------------------------------------------------------------------------
// Shared base for all Loki component configs
// ---------------------------------------------------------------------------
interface LokiComponentBase {
  /**
   * @asType integer
   * @minimum 0
   */
  replicas?: number;
  autoscaling?: object;
  resources?: object;
  image?: object;
  annotations?: { [key: string]: string };
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  labels?: { [key: string]: string };
  selectorLabels?: { [key: string]: string };
  serviceAnnotations?: { [key: string]: string };
  serviceLabels?: { [key: string]: string };
  service?: object;
  serviceType?: string;
  appProtocol?: string | object;
  trafficDistribution?: string;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  topologySpreadConstraints?: object[];
  hostAliases?: object[];
  hostUsers?: boolean | string | null;
  dnsConfig?: object;
  extraArgs?: object | string[];
  extraEnv?: object[];
  extraEnvFrom?: object[];
  extraVolumes?: object[];
  extraVolumeMounts?: object[];
  extraContainers?: object[];
  initContainers?: object[];
  lifecycle?: object;
  /**
   * @asType integer
   */
  terminationGracePeriodSeconds?: number;
  podManagementPolicy?: string;
  persistence?: object;
  priorityClassName?: string;
  livenessProbe?: object;
  readinessProbe?: object;
  startupProbe?: object;
}

// ---------------------------------------------------------------------------
// Schema config
// ---------------------------------------------------------------------------
interface SchemaIndex {
  prefix?: string;
  period?: string;
}

interface SchemaConfig {
  /** Date from which this schema applies (YYYY-MM-DD) */
  from?: string;
  store?: StoreType;
  object_store?: StorageType;
  schema?: SchemaVersion;
  index?: SchemaIndex;
}

// ---------------------------------------------------------------------------
// Loki storage config
// ---------------------------------------------------------------------------
interface LokiStorage {
  type?: StorageType;
  s3?: object;
  gcs?: object;
  azure?: object;
  swift?: object;
  filesystem?: object;
  object_store?: object;
  use_thanos_objstore?: boolean;
  bucketNames?: object;
}

// ---------------------------------------------------------------------------
// Loki app config (the nested `loki:` key)
// ---------------------------------------------------------------------------
interface LokiCommonConfig {
  path_prefix?: string;
  /**
   * @asType integer
   * @minimum 1
   */
  replication_factor?: number;
  compactor_grpc_address?: string;
}

interface LokiPatternIngester {
  enabled?: boolean;
}

interface LokiLimitsConfig {
  allow_structured_metadata?: boolean;
  volume_enabled?: boolean;
  retention_period?: string;
  /**
   * @asType integer
   */
  max_query_series?: number;
  reject_old_samples?: boolean;
  reject_old_samples_max_age?: string;
  max_cache_freshness_per_query?: string;
  split_queries_by_interval?: string;
  query_timeout?: string;
}

interface LokiRuler {
  enable_api?: boolean;
}

interface LokiAppConfig {
  /** Enable multi-tenancy */
  auth_enabled?: boolean;
  commonConfig?: LokiCommonConfig;
  storage?: LokiStorage;
  schemaConfig?: { configs?: SchemaConfig[] };
  pattern_ingester?: LokiPatternIngester;
  limits_config?: LokiLimitsConfig;
  ruler?: LokiRuler;
  rulerConfig?: object | null;
  // Image and pod config
  image?: object;
  annotations?: { [key: string]: string };
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  serviceAnnotations?: { [key: string]: string };
  serviceLabels?: { [key: string]: string };
  /**
   * @asType integer
   */
  revisionHistoryLimit?: number;
  podSecurityContext?: object;
  containerSecurityContext?: object;
  enableServiceLinks?: boolean;
  dnsConfig?: object;
  // Config file options
  configStorageType?: string;
  configObjectName?: string;
  generatedConfigObjectName?: string;
  config?: string;
  structuredConfig?: object;
  // Clustering
  server?: object;
  memberlistConfig?: object;
  extraMemberlistConfig?: object;
  tenants?: object[];
  // Runtime
  runtimeConfig?: object;
  // Loki configuration sections (passed into templated config)
  query_scheduler?: object;
  storage_config?: object;
  compactor?: object;
  compactor_grpc_client?: object;
  analytics?: object;
  query_range?: object;
  querier?: object;
  ingester?: object;
  ingester_client?: object;
  block_builder?: object;
  index_gateway?: object;
  frontend?: object;
  frontend_worker?: object;
  distributor?: object;
  tracing?: object;
  bloom_build?: object;
  bloom_gateway?: object;
  operational_config?: object;
  // Probes
  livenessProbe?: object;
  readinessProbe?: object;
  startupProbe?: object;
  // Service
  service?: object;
  // Test schema
  useTestSchema?: boolean;
  testSchemaConfig?: object;
  // UI
  ui?: object;
}

// ---------------------------------------------------------------------------
// SingleBinary persistence
// ---------------------------------------------------------------------------
interface SingleBinaryPersistence {
  enabled?: boolean;
  size?: StorageSize;
  storageClass?: string;
  accessModes?: string[];
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  enableStatefulSetAutoDeletePVC?: boolean;
  enableStatefulSetRecreationForSizeChange?: boolean;
  whenDeleted?: string;
  whenScaled?: string;
}

// ---------------------------------------------------------------------------
// SingleBinary
// ---------------------------------------------------------------------------
interface SingleBinary extends LokiComponentBase {
  persistence?: SingleBinaryPersistence;
  targetModule?: string;
}

// ---------------------------------------------------------------------------
// Chunks/Results cache
// ---------------------------------------------------------------------------
interface MemcachedCache extends LokiComponentBase {
  enabled?: boolean;
  addresses?: string;
  /** @asType integer */
  port?: number;
  /** @asType integer */
  replicas?: number;
  /** @asType integer */
  allocatedMemory?: number;
  /** @asType integer */
  maxItemMemory?: number;
  /** @asType integer */
  connectionLimit?: number;
  writebackBuffer?: number;
  writebackParallelism?: number;
  writebackSizeLimit?: string;
  timeout?: string;
  defaultValidity?: string;
  /** @asType integer */
  batchSize?: number;
  /** @asType integer */
  parallelism?: number;
  suffix?: string;
  maxUnavailable?: number | string;
  statefulStrategy?: object;
  podManagementPolicy?: string;
  extraExtendedOptions?: string | object[];
  l2?: object;
}

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------
interface LokiGateway extends LokiComponentBase {
  enabled?: boolean;
  /** @asType integer */
  replicas?: number;
  /** @asType integer */
  containerPort?: number;
  verboseLogging?: boolean;
  deploymentStrategy?: object;
  podSecurityContext?: object;
  containerSecurityContext?: object;
  basicAuth?: object;
  nginxConfig?: object;
  ingress?: object;
}

// ---------------------------------------------------------------------------
// MinIO sub-chart
// ---------------------------------------------------------------------------
interface MinioConfig {
  enabled?: boolean;
  /** @asType integer */
  replicas?: number;
  /** @asType integer */
  drivesPerNode?: number;
  rootUser?: string;
  rootPassword?: string;
  buckets?: object[];
  users?: object[];
  resources?: object;
  persistence?: object;
}

// ---------------------------------------------------------------------------
// Ingester (extends base with zone-aware replication)
// ---------------------------------------------------------------------------
interface LokiIngester extends LokiComponentBase {
  zoneAwareReplication?: object;
  maxUnavailable?: number | string;
  updateStrategy?: object;
  addIngesterNamePrefix?: boolean;
}

// ---------------------------------------------------------------------------
// Write / Read / Backend (SimpleScalable)
// ---------------------------------------------------------------------------
interface LokiScalableComponent extends LokiComponentBase {
  targetModule?: string;
  legacyReadTarget?: boolean;
  extraVolumeClaimTemplates?: object[];
}

// ---------------------------------------------------------------------------
// Querier / Distributor / QueryFrontend
// ---------------------------------------------------------------------------
interface LokiDistributorComponent extends LokiComponentBase {
  maxSurge?: number | string;
  loadBalancer?: object;
}

// ---------------------------------------------------------------------------
// QueryScheduler
// ---------------------------------------------------------------------------
interface LokiQueryScheduler extends LokiComponentBase {
  maxUnavailable?: number | string;
}

// ---------------------------------------------------------------------------
// IndexGateway / BloomGateway / Compactor
// ---------------------------------------------------------------------------
interface LokiIndexGateway extends LokiComponentBase {
  joinMemberlist?: boolean;
  updateStrategy?: object;
  serviceAccount?: object;
}

// ---------------------------------------------------------------------------
// Full upstream values
// ---------------------------------------------------------------------------
interface LokiUpstream {
  kubeVersionOverride?: string | null;
  /** Global configuration */
  global?: object;
  nameOverride?: string | null;
  fullnameOverride?: string | null;
  /** Namespace override for the Loki deployment */
  namespaceOverride?: string | null;
  clusterLabelOverride?: string | null;
  imagePullSecrets?: object[];
  /** Loki deployment mode */
  deploymentMode?: LokiDeploymentMode;
  /** Loki application configuration */
  loki?: LokiAppConfig;
  /** Enterprise configuration */
  enterprise?: object;
  /** SingleBinary mode configuration */
  singleBinary?: SingleBinary;
  // SimpleScalable components
  read?: LokiScalableComponent;
  write?: LokiScalableComponent;
  backend?: LokiScalableComponent;
  // Distributed components
  ingester?: LokiIngester;
  querier?: LokiDistributorComponent;
  queryFrontend?: LokiDistributorComponent;
  queryScheduler?: LokiQueryScheduler;
  distributor?: LokiDistributorComponent;
  compactor?: LokiIndexGateway;
  indexGateway?: LokiIndexGateway;
  bloomCompactor?: LokiComponentBase;
  bloomGateway?: LokiIndexGateway;
  bloomBuilder?: object;
  bloomPlanner?: object;
  patternIngester?: object;
  overridesExporter?: object;
  rollout_operator?: object;
  // Gateway
  gateway?: LokiGateway;
  enterpriseGateway?: object;
  // Caches
  chunksCache?: MemcachedCache;
  resultsCache?: MemcachedCache;
  memcached?: object;
  memcachedExporter?: object;
  // Ingress
  ingress?: object;
  // MinIO sub-chart
  minio?: MinioConfig;
  /** Built-in Promtail configuration */
  promtail?: { enabled?: boolean };
  // Auth & RBAC
  serviceAccount?: object;
  rbac?: object;
  // Network
  networkPolicy?: object;
  memberlist?: object;
  // Observability
  monitoring?: object;
  ruler?: object;
  sidecar?: object;
  // Other
  tableManager?: object;
  adminApi?: object;
  migrate?: object;
  test?: object;
  lokiCanary?: object;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Loki upstream chart values (see https://github.com/grafana/loki/tree/main/production/helm/loki) */
  loki?: LokiUpstream;
}
