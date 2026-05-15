type PullPolicy = "Always" | "IfNotPresent" | "Never";
type ControllerType = "daemonset" | "deployment" | "statefulset";
type StabilityLevel = "experimental" | "public-preview" | "generally-available";
type DNSPolicy = "ClusterFirst" | "ClusterFirstWithHostNet" | "Default" | "None";

interface GlobalImage {
  /** Global image registry override */
  registry?: string;
  /** Global image pull secrets */
  pullSecrets?: object[];
}

interface GlobalConfig {
  image?: GlobalImage;
  /** Security context to apply to the Grafana Alloy pod */
  podSecurityContext?: object;
}

interface CrdsConfig {
  /** Whether to install CRDs for monitoring */
  create?: boolean;
  /** Helm global values propagated by Helm into sub-chart sections */
  global?: object;
}

interface ClusteringConfig {
  /** Deploy Alloy in a cluster to allow for load distribution */
  enabled?: boolean;
  /** Name for the Alloy cluster */
  name?: string;
  /** Name for the port used for clustering */
  portName?: string;
}

interface ConfigMap {
  /** Create a ConfigMap for Alloy configuration */
  create?: boolean;
  /** Alloy pipeline configuration (River format) */
  content?: string;
  /** Name of existing ConfigMap to use (when create is false) */
  name?: string;
  /** ConfigMap key for the config file */
  key?: string;
}

interface AlloyMounts {
  /** Mount /var/log from the host into the container for log collection */
  varlog?: boolean;
  /** Mount /var/lib/docker/containers from the host into the container for log collection */
  dockercontainers?: boolean;
  /** Extra volume mounts to add into the Grafana Alloy container */
  extra?: object[];
}

interface AlloyAppConfig {
  configMap?: ConfigMap;
  clustering?: ClusteringConfig;
  /** Minimum stability level of components and behavior to enable */
  stabilityLevel?: StabilityLevel;
  /** Path to where Grafana Alloy stores data */
  storagePath?: string;
  /** Enables Grafana Alloy container's http server port */
  enableHttpServerPort?: boolean;
  /** Address to listen for traffic on */
  listenAddr?: string;
  /**
   * Port to listen for traffic on
   * @asType integer
   */
  listenPort?: number;
  /** Scheme for readiness probes. Set to "HTTPS" if TLS is enabled */
  listenScheme?: string;
  /**
   * Initial delay for readiness probe
   * @asType integer
   */
  initialDelaySeconds?: number;
  /**
   * Timeout for readiness probe
   * @asType integer
   */
  timeoutSeconds?: number;
  /** Base path where the UI is exposed */
  uiPathPrefix?: string;
  /** Enables sending Grafana Labs anonymous usage stats */
  enableReporting?: boolean;
  /** Extra environment variables to pass to the Alloy container */
  extraEnv?: object[];
  /** Maps all the keys on a ConfigMap or Secret as environment variables */
  envFrom?: object[];
  /** Extra args to pass to `alloy run` */
  extraArgs?: string[];
  /** Extra ports to expose on the Alloy container */
  extraPorts?: object[];
  /** Host aliases to add to the Alloy container */
  hostAliases?: object[];
  /** Extra mounts for the Alloy container */
  mounts?: AlloyMounts;
  /** Security context to apply to the Grafana Alloy container */
  securityContext?: object;
  resources?: object;
  /** Lifecycle hooks for the Grafana Alloy container */
  lifecycle?: object;
  /** Liveness probe for the Grafana Alloy container */
  livenessProbe?: object;
}

interface RbacConfig {
  /** Whether to create RBAC resources for Alloy */
  create?: boolean;
  /** Namespaces to create Roles/RoleBindings in instead of ClusterRoles */
  namespaces?: string[];
  /** Rules for the ClusterRole or Role objects */
  rules?: object[];
  /** Rules for the ClusterRole objects */
  clusterRules?: object[];
}

interface ServiceAccount {
  /** Whether to create a service account */
  create?: boolean;
  /** Additional labels to add to the created service account */
  additionalLabels?: { [key: string]: string };
  /** Annotations to add to the created service account */
  annotations?: { [key: string]: string };
  /** Name of the existing service account to use when create is false */
  name?: string;
  /** Whether the Alloy pod should automatically mount the service account token */
  automountServiceAccountToken?: boolean;
}

interface ConfigReloaderImage {
  registry?: string;
  repository?: string;
  tag?: string;
  /** SHA256 digest override */
  digest?: string;
}

interface ConfigReloader {
  /** Enables automatically reloading when the Alloy config changes */
  enabled?: boolean;
  image?: ConfigReloaderImage;
  /** Override the args passed to the container */
  customArgs?: string[];
  resources?: object;
  securityContext?: object;
}

interface PodDisruptionBudget {
  /** Whether to create a PodDisruptionBudget */
  enabled?: boolean;
  minAvailable?: number | string;
  maxUnavailable?: number | string;
}

interface AutoscalingScalePolicy {
  policies?: object[];
  selectPolicy?: string;
  /** @asType integer */
  stabilizationWindowSeconds?: number;
}

interface HorizontalAutoscaling {
  enabled?: boolean;
  /**
   * @asType integer
   * @minimum 1
   */
  minReplicas?: number;
  /**
   * @asType integer
   * @minimum 1
   */
  maxReplicas?: number;
  /** @asType integer */
  targetCPUUtilizationPercentage?: number;
  /** @asType integer */
  targetMemoryUtilizationPercentage?: number;
  scaleDown?: AutoscalingScalePolicy;
  scaleUp?: AutoscalingScalePolicy;
}

interface VerticalAutoscaling {
  enabled?: boolean;
  recommenders?: object[];
  resourcePolicy?: object;
  updatePolicy?: object;
}

interface ControllerAutoscaling {
  /** @deprecated Use horizontal instead */
  enabled?: boolean;
  /**
   * @asType integer
   * @minimum 1
   */
  minReplicas?: number;
  /**
   * @asType integer
   * @minimum 1
   */
  maxReplicas?: number;
  /** @asType integer */
  targetCPUUtilizationPercentage?: number;
  /** @asType integer */
  targetMemoryUtilizationPercentage?: number;
  scaleDown?: AutoscalingScalePolicy;
  scaleUp?: AutoscalingScalePolicy;
  horizontal?: HorizontalAutoscaling;
  vertical?: VerticalAutoscaling;
}

interface ControllerConfig {
  /** Controller type */
  type?: ControllerType;
  /**
   * Number of replicas
   * @asType integer
   * @minimum 1
   */
  replicas?: number;
  extraLabels?: { [key: string]: string };
  extraAnnotations?: { [key: string]: string };
  /** Whether to deploy pods in parallel (statefulset only) */
  parallelRollout?: boolean;
  /**
   * Minimum ready seconds
   * @asType integer
   */
  minReadySeconds?: number;
  /** Configures Pods to use the host network */
  hostNetwork?: boolean;
  /** Configures Pods to use the host PID namespace */
  hostPID?: boolean;
  /** DNS policy for the pod */
  dnsPolicy?: DNSPolicy;
  /**
   * Termination grace period in seconds
   * @asType integer
   */
  terminationGracePeriodSeconds?: number;
  updateStrategy?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  topologySpreadConstraints?: object[];
  priorityClassName?: string;
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  podDisruptionBudget?: PodDisruptionBudget;
  /** Enable automatic deletion of stale PVCs on scale down (statefulset only) */
  enableStatefulSetAutoDeletePVC?: boolean;
  autoscaling?: ControllerAutoscaling;
  affinity?: object;
  volumes?: { extra?: object[] };
  volumeClaimTemplates?: object[];
  initContainers?: object[];
  extraContainers?: object[];
}

interface NetworkPolicy {
  enabled?: boolean;
  flavor?: string;
  policyTypes?: string[];
  ingress?: object[];
  egress?: object[];
}

interface ServiceConfig {
  /** Creates a Service for the controller's pods */
  enabled?: boolean;
  type?: string;
  /** @asType integer */
  nodePort?: number;
  clusterIP?: string;
  internalTrafficPolicy?: string;
  annotations?: { [key: string]: string };
}

interface ServiceMonitor {
  enabled?: boolean;
  additionalLabels?: { [key: string]: string };
  interval?: string;
  metricRelabelings?: object[];
  tlsConfig?: object;
  relabelings?: object[];
}

interface IngressConfig {
  /** Enables ingress for Alloy (Faro port) */
  enabled?: boolean;
  ingressClassName?: string;
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  path?: string;
  /** @asType integer */
  faroPort?: number;
  pathType?: string;
  hosts?: string[];
  extraPaths?: object[];
  tls?: object[];
}

interface AlloyImage {
  registry?: string;
  repository?: string;
  tag?: string;
  /** SHA256 digest override */
  digest?: string;
  pullPolicy?: PullPolicy;
  pullSecrets?: object[];
}

interface AlloyUpstream {
  nameOverride?: string;
  /** Namespace override for the Alloy deployment */
  namespaceOverride?: string;
  fullnameOverride?: string;
  global?: GlobalConfig;
  crds?: CrdsConfig;
  /** Controller configuration */
  controller?: ControllerConfig;
  /** Alloy application configuration */
  alloy?: AlloyAppConfig;
  image?: AlloyImage;
  /** RBAC configuration */
  rbac?: RbacConfig;
  /** Service account configuration */
  serviceAccount?: ServiceAccount;
  configReloader?: ConfigReloader;
  networkPolicy?: NetworkPolicy;
  service?: ServiceConfig;
  serviceMonitor?: ServiceMonitor;
  ingress?: IngressConfig;
  /** Extra Kubernetes manifests to deploy */
  extraObjects?: object[];
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Grafana Alloy upstream chart values (see https://github.com/grafana/alloy/tree/main/operations/helm/charts/alloy) */
  alloy?: AlloyUpstream;
}
