type PodAntiAffinity = "" | "soft" | "hard";

/** @asType integer */
type IntegerType = number;

interface AlertmanagerPodSecurityContext {
  /**
   * @asType integer
   */
  fsGroup?: number;
  /**
   * @asType integer
   */
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  /**
   * @asType integer
   */
  runAsUser?: number;
}

interface AlertmanagerPersistence {
  accessModes?: string[];
  annotations?: object;
  emptyDir?: object;
  enabled?: boolean;
  labels?: object;
  size?: string;
}

interface Alertmanager {
  enabled?: boolean;
  persistence?: AlertmanagerPersistence;
  podSecurityContext?: AlertmanagerPodSecurityContext;
}

interface ConfigmapReloadImage {
  digest?: string;
  pullPolicy?: string;
  repository?: string;
  tag?: string;
}

interface ConfigmapReloadPrometheus {
  containerSecurityContext?: object;
  /** @asType integer */
  containerPort?: number;
  containerPortName?: string;
  enabled?: boolean;
  extraArgs?: object;
  extraConfigmapMounts?: any[];
  extraVolumeDirs?: any[];
  extraVolumeMounts?: any[];
  image?: ConfigmapReloadImage;
  livenessProbe?: object;
  name?: string;
  readinessProbe?: object;
  resources?: object;
  startupProbe?: object;
}

interface ConfigmapReload {
  env?: any[];
  prometheus?: ConfigmapReloadPrometheus;
  reloadUrl?: string;
}

interface KubeStateMetrics {
  enabled?: boolean;
  namespaceOverride?: string;
  releaseNamespace?: boolean;
  releaseLabel?: boolean;
  global?: object;
  image?: object;
  imagePullSecrets?: any[];
  automountServiceAccountToken?: boolean;
  serviceAccount?: object;
  rbac?: object;
  kubeRBACProxy?: object;
  prometheusServiceAccountTokenFile?: string;
  prometheusScrape?: boolean;
  service?: object;
  selfMonitor?: object;
  customLabels?: object;
  hostNetwork?: boolean;
  annotations?: object;
  labels?: object;
  podAnnotations?: object;
  podLabels?: object;
  /** @asType integer */
  replicas?: number;
  /** @asType integer */
  revisionHistoryLimit?: number;
  resources?: object;
  securityContext?: object;
  containerSecurityContext?: object;
  nodeSelector?: object;
  tolerations?: any[];
  affinity?: object;
  topologySpreadConstraints?: any[];
  podDisruptionBudget?: object;
  dnsPolicy?: string;
  dnsConfig?: object;
  extraArgs?: any[];
  env?: any[];
  containers?: any[];
  initContainers?: any[];
  volumes?: any[];
  volumeMounts?: any[];
  selectorOverride?: object;
  collectors?: any[];
  namespaces?: string | object;
  namespacesDenylist?: string | object;
  metricAllowlist?: any[];
  metricDenylist?: any[];
  metricAnnotationsAllowList?: any[];
  metricLabelsAllowlist?: any[];
  customResourceState?: object;
  verticalPodAutoscaler?: object;
  autosharding?: object;
  networkPolicy?: object;
  livenessProbe?: object;
  readinessProbe?: object;
  startupProbe?: object;
  extraManifests?: any[];
  kubeconfig?: object;
  prometheus?: object;
}

interface NetworkPolicy {
  enabled?: boolean;
}

interface NodeExporterContainerSecurityContext {
  allowPrivilegeEscalation?: boolean;
  readOnlyRootFilesystem?: boolean;
}

interface NodeExporterRbac {
  create?: boolean;
  pspEnabled?: boolean;
}

interface PrometheusNodeExporter {
  namespaceOverride?: string;
  nameOverride?: string;
  fullnameOverride?: string;
  containerSecurityContext?: NodeExporterContainerSecurityContext;
  securityContext?: object;
  enabled?: boolean;
  rbac?: NodeExporterRbac;
  serviceAccount?: object;
  global?: object;
  image?: object;
  imagePullSecrets?: any[];
  service?: object;
  resources?: object;
  nodeSelector?: object;
  tolerations?: any[];
  affinity?: object;
  topologySpreadConstraints?: any[];
  podLabels?: object;
  podAnnotations?: object;
  daemonsetAnnotations?: object;
  updateStrategy?: object;
  extraArgs?: any[];
  extraVolumeMounts?: any[];
  extraVolumes?: any[];
  extraHostVolumeMounts?: any[];
  sidecarVolumeMount?: any[];
  sidecarHostVolumeMounts?: any[];
  configmaps?: any[];
  secrets?: any[];
  sidecars?: any[];
  extraInitContainers?: any[];
  hostNetwork?: boolean;
  hostPID?: boolean;
  hostIPC?: boolean;
  hostRootFsMount?: object;
  hostSysFsMount?: object;
  hostProcFsMount?: object;
  endpoints?: any[];
  dnsConfig?: object;
  dnsPolicy?: string;
  kubeRBACProxy?: object;
  livenessProbe?: object;
  readinessProbe?: object;
  networkPolicy?: object;
  prometheus?: object;
  releaseLabel?: boolean;
  revisionHistoryLimit?: number;
  tlsSecret?: string | object;
  version?: string;
  verticalPodAutoscaler?: object;
  commonLabels?: object;
  terminationMessageParams?: string | object;
  env?: any[] | object;
  extraManifests?: any[];
}

interface PrometheusPushgateway {
  enabled?: boolean;
  serviceAnnotations?: { "prometheus.io/probe"?: string };
}

interface Rbac {
  create?: boolean;
}

interface ServerEmptyDir {
  sizeLimit?: string;
  medium?: string;
}

interface ServerGlobal {
  evaluation_interval?: string;
  scrape_interval?: string;
  scrape_timeout?: string;
}

interface ServerImage {
  digest?: string;
  pullPolicy?: string;
  repository?: string;
  tag?: string;
}

interface ServerIngress {
  annotations?: object;
  enabled?: boolean;
  extraLabels?: object;
  extraPaths?: any[];
  hosts?: any[];
  ingressClassName?: string;
  path?: string;
  pathType?: string;
  tls?: any[];
}

interface ServerGrpc {
  enabled?: boolean;
  /**
   * @asType integer
   */
  servicePort?: number;
}

interface ServerService {
  additionalPorts?: any[];
  annotations?: object;
  clusterIP?: string;
  enabled?: boolean;
  externalIPs?: any[];
  externalTrafficPolicy?: string;
  gRPC?: ServerGrpc;
  labels?: object;
  loadBalancerClass?: string;
  loadBalancerIP?: string;
  loadBalancerSourceRanges?: any[];
  /**
   * @asType integer
   */
  servicePort?: number;
  sessionAffinity?: string;
  statefulsetReplica?: {
    enabled?: boolean;
    /**
     * @asType integer
     */
    replica?: number;
  };
  type?: string;
}

interface StartupProbe {
  enabled?: boolean;
  /**
   * @asType integer
   */
  failureThreshold?: number;
  /**
   * @asType integer
   */
  periodSeconds?: number;
  /**
   * @asType integer
   */
  timeoutSeconds?: number;
}

interface StatefulSetHeadless {
  annotations?: object;
  gRPC?: {
    enabled?: boolean;
    /**
     * @asType integer
     */
    servicePort?: number;
  };
  labels?: object;
  /**
   * @asType integer
   */
  servicePort?: number;
}

interface StatefulSet {
  annotations?: object;
  enabled?: boolean;
  headless?: StatefulSetHeadless;
  labels?: object;
  podManagementPolicy?: string;
  pvcDeleteOnStsDelete?: boolean;
  pvcDeleteOnStsScale?: boolean;
}

interface ServerStrategy {
  type?: string;
}

interface ServerPodDisruptionBudget {
  enabled?: boolean;
  maxUnavailable?: string | IntegerType;
}

interface ServerSecurityContext {
  /**
   * @asType integer
   */
  fsGroup?: number;
  /**
   * @asType integer
   */
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  /**
   * @asType integer
   */
  runAsUser?: number;
}

interface ServerPersistentVolume {
  accessModes?: string[];
  annotations?: object;
  enabled?: boolean;
  existingClaim?: string;
  labels?: object;
  mountPath?: string;
  size?: string;
  storageClass?: string;
  statefulSetNameOverride?: string;
  subPath?: string;
}

interface Server {
  affinity?: object;
  useExistingClusterRoleName?: string | boolean;
  configFromSecret?: string;
  namespaces?: any[] | object;
  daemonSet?: object;
  otlp?: object;
  route?: object;
  alertmanagers?: any[];
  baseURL?: string;
  clusterRoleNameOverride?: string;
  command?: any[];
  configMapAnnotations?: object;
  configMapOverrideName?: string;
  configPath?: string;
  containerSecurityContext?: object;
  defaultFlagsOverride?: any[];
  deploymentAnnotations?: object;
  dnsConfig?: object;
  dnsPolicy?: string;
  emptyDir?: ServerEmptyDir;
  enableServiceLinks?: boolean;
  env?: any[];
  exemplars?: object;
  extraArgs?: object;
  extraConfigmapLabels?: object;
  extraConfigmapMounts?: any[];
  extraFlags?: string[];
  extraHostPathMounts?: any[];
  extraInitContainers?: any[];
  extraSecretMounts?: any[];
  extraVolumeMounts?: any[];
  extraVolumes?: any[];
  fullnameOverride?: string;
  global?: ServerGlobal;
  hostAliases?: any[];
  hostNetwork?: boolean;
  image?: ServerImage;
  ingress?: ServerIngress;
  /**
   * @asType integer
   */
  livenessProbeFailureThreshold?: number;
  /**
   * @asType integer
   */
  livenessProbeInitialDelay?: number;
  /**
   * @asType integer
   */
  livenessProbePeriodSeconds?: number;
  /**
   * @asType integer
   */
  livenessProbeSuccessThreshold?: number;
  /**
   * @asType integer
   */
  livenessProbeTimeout?: number;
  name?: string;
  nodeSelector?: object;
  persistentVolume?: ServerPersistentVolume;
  podAnnotations?: object;
  /** @default "" */
  podAntiAffinity?: PodAntiAffinity;
  podAntiAffinityTopologyKey?: string;
  podDisruptionBudget?: ServerPodDisruptionBudget;
  podLabels?: object;
  portName?: string;
  prefixURL?: string;
  priorityClassName?: string;
  runtimeClassName?: string;
  probeHeaders?: any[];
  probeScheme?: string;
  /**
   * @asType integer
   */
  readinessProbeFailureThreshold?: number;
  /**
   * @asType integer
   */
  readinessProbeInitialDelay?: number;
  /**
   * @asType integer
   */
  readinessProbePeriodSeconds?: number;
  /**
   * @asType integer
   */
  readinessProbeSuccessThreshold?: number;
  /**
   * @asType integer
   */
  readinessProbeTimeout?: number;
  releaseNamespace?: boolean;
  remoteRead?: any[];
  remoteWrite?: any[];
  /**
   * @asType integer
   */
  replicaCount?: number;
  resources?: object;
  retention?: string;
  retentionSize?: string;
  /**
   * @asType integer
   */
  revisionHistoryLimit?: number;
  securityContext?: ServerSecurityContext;
  service?: ServerService;
  sidecarContainers?: object;
  sidecarTemplateValues?: object;
  startupProbe?: StartupProbe;
  statefulSet?: StatefulSet;
  storagePath?: string;
  strategy?: ServerStrategy;
  tcpSocketProbeEnabled?: boolean;
  /**
   * @asType integer
   */
  terminationGracePeriodSeconds?: number;
  tolerations?: any[];
  topologySpreadConstraints?: any[];
  tsdb?: object;
  verticalAutoscaler?: { enabled?: boolean };
}

interface ScrapeConfig {
  job_name?: string;
  static_configs?: Array<{ targets?: string[] }>;
}

interface PrometheusYml {
  rule_files?: string[];
  scrape_configs?: ScrapeConfig[];
}

interface ServerFiles {
  "alerting_rules.yml"?: object;
  alerts?: object;
  "prometheus.yml"?: PrometheusYml;
  "recording_rules.yml"?: object;
  rules?: object;
}

interface ServiceAccountEntry {
  annotations?: object;
  create?: boolean;
  name?: string;
  automountServiceAccountToken?: boolean;
}

interface ServiceAccounts {
  server?: ServiceAccountEntry;
}

interface PrometheusUpstream {
  namespaceOverride?: string;
  global?: object;
  commonMetaLabels?: object;
  scrapeConfigs?: any[] | object;
  alertRelabelConfigs?: object;
  alertmanager?: Alertmanager;
  configmapReload?: ConfigmapReload;
  extraManifests?: any[];
  extraScrapeConfigs?: string;
  forceNamespace?: string;
  imagePullSecrets?: any[];
  "kube-state-metrics"?: KubeStateMetrics;
  networkPolicy?: NetworkPolicy;
  "prometheus-node-exporter"?: PrometheusNodeExporter;
  "prometheus-pushgateway"?: PrometheusPushgateway;
  rbac?: Rbac;
  ruleFiles?: object;
  server?: Server;
  scrapeConfigFiles?: any[];
  serverFiles?: ServerFiles;
  serviceAccounts?: ServiceAccounts;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  prometheus?: PrometheusUpstream;
}
