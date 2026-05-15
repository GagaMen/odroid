type PullPolicy = "Always" | "IfNotPresent" | "Never";
type StorageAccessMode = "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany";
type DatasourceAccess = "proxy" | "direct";

/** Storage size @pattern ^[0-9]+(Mi|Gi|Ti)$ */
type StorageSize = string;

interface GlobalConfig {
  /** Global Docker registry override */
  imageRegistry?: string | null;
  imagePullSecrets?: object[];
}

interface GrafanaRbac {
  create?: boolean;
  pspEnabled?: boolean;
  pspUseAppArmor?: boolean;
  /** Restrict RBAC to namespace scope */
  namespaced?: boolean;
  useExistingRole?: string;
  useExistingClusterRole?: string;
  extraRoleRules?: object[];
  extraClusterRoleRules?: object[];
}

interface GrafanaServiceAccount {
  create?: boolean;
  name?: string | null;
  nameTest?: string | null;
  labels?: { [key: string]: string };
  annotations?: { [key: string]: string };
  automountServiceAccountToken?: boolean;
}

interface GrafanaPersistence {
  type?: string;
  enabled?: boolean;
  size?: StorageSize;
  storageClassName?: string;
  volumeName?: string;
  accessModes?: StorageAccessMode[];
  existingClaim?: string;
  extraPvcLabels?: object;
  finalizers?: string[];
  disableWarning?: boolean;
  inMemory?: { enabled?: boolean; sizeLimit?: string };
  lookupVolumeName?: boolean;
}

interface IngressTls {
  secretName?: string;
  hosts?: string[];
}

interface GrafanaIngress {
  enabled?: boolean;
  ingressClassName?: string;
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  hosts?: string[];
  tls?: IngressTls[];
  path?: string;
  pathType?: string;
  extraPaths?: object[];
}

interface RouteMain {
  enabled?: boolean;
  apiVersion?: string;
  kind?: string;
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  hostnames?: string[];
  parentRefs?: object[];
  matches?: object[];
  filters?: object[];
  additionalRules?: object[];
  httpsRedirect?: boolean;
}

interface GrafanaRoute {
  main?: RouteMain;
}

interface Datasource {
  name?: string;
  type?: string;
  uid?: string;
  url?: string;
  access?: DatasourceAccess;
  isDefault?: boolean;
  jsonData?: object;
}

interface DatasourceFile {
  /**
   * @asType integer
   */
  apiVersion?: number;
  datasources?: Datasource[];
}

interface GrafanaImage {
  /** Docker registry */
  registry?: string;
  repository?: string;
  tag?: string;
  sha?: string;
  pullPolicy?: PullPolicy;
  pullSecrets?: object[];
}

interface GrafanaImageBase {
  registry?: string;
  repository?: string;
  tag?: string;
  sha?: string;
  pullPolicy?: PullPolicy;
}

interface GrafanaAutoscaling {
  enabled?: boolean;
  /** @asType integer */
  minReplicas?: number;
  /** @asType integer */
  maxReplicas?: number;
  targetCPU?: string;
  targetMemory?: string;
  behavior?: object;
}

interface GrafanaService {
  enabled?: boolean;
  type?: string;
  ipFamilyPolicy?: string;
  ipFamilies?: string[];
  loadBalancerIP?: string;
  loadBalancerClass?: string;
  loadBalancerSourceRanges?: string[];
  /** @asType integer */
  port?: number;
  /** @asType integer */
  targetPort?: number;
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  portName?: string;
  appProtocol?: string;
  sessionAffinity?: string;
}

interface GrafanaServiceMonitor {
  enabled?: boolean;
  path?: string;
  labels?: { [key: string]: string };
  interval?: string;
  scheme?: string;
  tlsConfig?: object;
  scrapeTimeout?: string;
  relabelings?: object[];
  metricRelabelings?: object[];
  basicAuth?: object;
  targetLabels?: string[];
}

interface GrafanaAdminSecret {
  /** Name of existing secret for admin credentials */
  existingSecret?: string;
  userKey?: string;
  passwordKey?: string;
}

interface GrafanaLdap {
  enabled?: boolean;
  existingSecret?: string;
  config?: string;
}

interface GrafanaSmtp {
  existingSecret?: string;
  userKey?: string;
  passwordKey?: string;
}

interface GrafanaNetworkPolicy {
  enabled?: boolean;
  ingress?: boolean;
  allowExternal?: boolean;
  explicitNamespacesSelector?: object;
  egress?: {
    enabled?: boolean;
    blockDNSResolution?: boolean;
    ports?: object[];
    to?: object[];
  };
}

interface GrafanaImageRenderer {
  enabled?: boolean;
  deploymentStrategy?: object;
  /** @asType integer */
  replicas?: number;
  autoscaling?: GrafanaAutoscaling;
  serverURL?: string;
  renderingCallbackURL?: string;
  image?: GrafanaImageBase & { pullSecrets?: object[] };
  env?: { [key: string]: string };
  envValueFrom?: object;
  serviceAccountName?: string;
  automountServiceAccountToken?: boolean;
  hostUsers?: boolean | null;
  securityContext?: object;
  containerSecurityContext?: object;
  podAnnotations?: { [key: string]: string };
  hostAliases?: object[];
  priorityClassName?: string;
  service?: object;
  serviceMonitor?: object;
  grafanaProtocol?: string;
  grafanaSubPath?: string;
  podPortName?: string;
  /** @asType integer */
  revisionHistoryLimit?: number;
  networkPolicy?: object;
  resources?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  extraConfigmapMounts?: object[];
  extraSecretMounts?: object[];
  extraVolumeMounts?: object[];
  extraVolumes?: object[];
}

interface GrafanaUpstream {
  global?: GlobalConfig;
  rbac?: GrafanaRbac;
  serviceAccount?: GrafanaServiceAccount;
  /**
   * Number of replicas
   * @asType integer
   * @minimum 1
   */
  replicas?: number;
  /** Create a headless service for the deployment */
  headlessService?: boolean;
  /** Auto-mount service account token on the pod */
  automountServiceAccountToken?: boolean;
  autoscaling?: GrafanaAutoscaling;
  podDisruptionBudget?: object;
  deploymentStrategy?: object;
  readinessProbe?: object;
  livenessProbe?: object;
  image?: GrafanaImage;
  testFramework?: object;
  dnsPolicy?: string | null;
  dnsConfig?: object;
  hostUsers?: boolean | null;
  securityContext?: object;
  containerSecurityContext?: object;
  /** Enable creating the Grafana ConfigMap */
  createConfigmap?: boolean;
  extraConfigmapMounts?: object[];
  extraEmptyDirMounts?: object[];
  extraLabels?: { [key: string]: string };
  downloadDashboardsImage?: GrafanaImageBase;
  downloadDashboards?: object;
  podPortName?: string;
  gossipPortName?: string;
  annotations?: { [key: string]: string };
  podAnnotations?: { [key: string]: string };
  configMapAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  service?: GrafanaService;
  serviceMonitor?: GrafanaServiceMonitor;
  extraExposePorts?: object[];
  hostAliases?: object[];
  /** Ingress configuration */
  ingress?: GrafanaIngress;
  route?: GrafanaRoute;
  resources?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  topologySpreadConstraints?: object[];
  extraInitContainers?: object[];
  extraContainers?: string | object[];
  extraContainerVolumes?: object[];
  /** Persistence configuration */
  persistence?: GrafanaPersistence;
  initChownData?: object;
  /** Admin username */
  adminUser?: string;
  /** Admin password (override in platform/values.yaml!) */
  adminPassword?: string;
  admin?: GrafanaAdminSecret;
  /** Extra environment variables */
  env?: object;
  envValueFrom?: object;
  envFromSecret?: string;
  envRenderSecret?: object;
  envFromSecrets?: object[];
  envFromConfigMaps?: object[];
  enableServiceLinks?: boolean;
  extraSecretMounts?: object[];
  extraVolumeMounts?: object[];
  extraVolumes?: object[];
  lifecycleHooks?: object;
  /** List of Grafana plugins to install */
  plugins?: string[];
  /** Datasource provisioning configuration */
  datasources?: { [key: string]: DatasourceFile };
  alerting?: object;
  notifiers?: object;
  /** Dashboard provider configuration */
  dashboardProviders?: object;
  defaultCurlOptions?: string;
  /** Dashboard definitions */
  dashboards?: object;
  dashboardsConfigMaps?: { [key: string]: string };
  /** Grafana.ini configuration sections */
  "grafana.ini"?: object;
  ldap?: GrafanaLdap;
  shareProcessNamespace?: boolean;
  smtp?: GrafanaSmtp;
  /** Sidecar configuration for auto-discovery */
  sidecar?: object;
  /** Namespace override for the Grafana deployment */
  namespaceOverride?: string;
  /** @asType integer */
  revisionHistoryLimit?: number;
  imageRenderer?: GrafanaImageRenderer;
  networkPolicy?: GrafanaNetworkPolicy;
  enableKubeBackwardCompatibility?: boolean;
  useStatefulSet?: boolean;
  extraObjects?: object[];
  assertNoLeakedSecrets?: boolean;
  priorityClassName?: string;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Grafana upstream chart values (see https://github.com/grafana/helm-charts/tree/main/charts/grafana) */
  grafana?: GrafanaUpstream;
}
