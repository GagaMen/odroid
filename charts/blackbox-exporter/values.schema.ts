/** @asType integer */
type IntegerType = number;

interface ContainerImage {
  registry?: string;
  repository?: string;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
  pullPolicy?: string;
  digest?: string;
}

/** One probe module of the blackbox exporter configuration */
interface ProbeModule {
  /** Prober that runs the module: http, tcp, dns, icmp or grpc */
  prober: "http" | "tcp" | "dns" | "icmp" | "grpc";
  /** Time after which the probe counts as failed, e.g. 5s */
  timeout?: string;
  http?: object;
  tcp?: object;
  dns?: object;
  icmp?: object;
  grpc?: object;
}

interface BlackboxConfig {
  /** Probe modules, selected per target by the module parameter of the scrape */
  modules?: { [name: string]: ProbeModule };
}

interface ServiceConfig {
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  type?: "ClusterIP" | "NodePort" | "LoadBalancer";
  port?: IntegerType;
  ipDualStack?: object;
}

interface ServiceAccount {
  create?: boolean;
  name?: string | null;
  annotations?: { [key: string]: string };
}

interface ConfigReloader {
  /** Reload the configuration in place instead of restarting the pod */
  enabled?: boolean;
  containerPort?: IntegerType;
  config?: object;
  image?: ContainerImage;
  securityContext?: object;
  resources?: object;
  livenessProbe?: object;
  readinessProbe?: object;
  service?: object;
  serviceMonitor?: object;
}

interface BlackboxExporterUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  nameOverride?: string;
  fullnameOverride?: string;
  namespaceOverride?: string;
  kubeVersionOverride?: string;
  restartPolicy?: string;
  kind?: "Deployment" | "DaemonSet";
  releaseLabel?: boolean;
  podDisruptionBudget?: object;
  automountServiceAccountToken?: boolean;
  extraEnv?: object[];
  extraEnvFrom?: object[];
  extraVolumes?: object[];
  extraVolumeMounts?: object[] | null;
  extraInitContainers?: object[];
  extraContainers?: object[];
  revisionHistoryLimit?: IntegerType;
  hostNetwork?: boolean;
  strategy?: object;
  image?: ContainerImage;
  podSecurityContext?: object;
  securityContext?: object;
  livenessProbe?: object;
  readinessProbe?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  topologySpreadConstraints?: object[];
  /** Secret with the configuration instead of the config value */
  configExistingSecretName?: string;
  /** Store the configuration in a Secret instead of a ConfigMap */
  secretConfig?: boolean;
  /** Path of the configuration file inside the container */
  configPath?: string;
  config?: BlackboxConfig;
  extraConfigmapMounts?: object[];
  extraSecretMounts?: object[];
  resources?: object;
  priorityClassName?: string;
  service?: ServiceConfig;
  containerPort?: IntegerType;
  hostPort?: IntegerType;
  serviceAccount?: ServiceAccount;
  ingress?: object;
  route?: object;
  podAnnotations?: { [key: string]: string };
  deploymentAnnotations?: { [key: string]: string };
  secretAnnotations?: { [key: string]: string };
  hostAliases?: object[];
  pod?: { labels?: { [key: string]: string } };
  extraArgs?: string[];
  replicas?: IntegerType;
  /** Needs the Prometheus Operator CRDs */
  serviceMonitor?: object;
  /** Needs the Prometheus Operator CRDs */
  prometheusRule?: object;
  /** Needs the Google Managed Prometheus CRDs */
  podMonitoring?: object;
  networkPolicy?: object;
  dnsPolicy?: string | null;
  dnsConfig?: object | null;
  extraManifests?: object[];
  commonLabels?: { [key: string]: string };
  verticalPodAutoscaler?: object;
  configReloader?: ConfigReloader;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** prometheus-blackbox-exporter upstream chart values (see https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus-blackbox-exporter) */
  "prometheus-blackbox-exporter"?: BlackboxExporterUpstream;
}
