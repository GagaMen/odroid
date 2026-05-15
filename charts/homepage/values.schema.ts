type PullPolicy = "Always" | "IfNotPresent" | "Never";
type ServiceType = "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
type PathType = "Prefix" | "Exact" | "ImplementationSpecific";
type DnsPolicy = "ClusterFirst" | "Default" | "ClusterFirstWithHostNet" | "None";

/** @asType integer */
type IntegerType = number;

interface Image {
  /** Container image repository */
  repository?: string;
  /** Image pull policy */
  pullPolicy?: PullPolicy;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
}

interface ServiceAccount {
  /** Create a service account */
  create?: boolean;
  /** Automatically mount API credentials */
  automount?: boolean;
  /** Annotations for the service account */
  annotations?: { [key: string]: string };
  /** Service account name (generated from fullname if empty) */
  name?: string;
}

interface Service {
  /** Service type */
  type?: ServiceType;
  /**
   * Service port number
   * @asType integer
   */
  port?: number;
}

interface ConfigMapData {
  /** Allowed hosts for Homepage (required) */
  allowedHosts?: string;
  "kubernetes.yaml"?: string;
  "settings.yaml"?: string;
  "custom.css"?: string;
  "custom.js"?: string;
  "bookmarks.yaml"?: string;
  "services.yaml"?: string;
  "widgets.yaml"?: string;
  "docker.yaml"?: string;
  [key: string]: string | undefined;
}

interface ConfigMap {
  /** Enable ConfigMap creation */
  enable?: boolean;
  /** ConfigMap data entries (YAML config files as strings) */
  data?: ConfigMapData;
}

interface Secret {
  /** Annotations for the secret */
  annotations?: { [key: string]: string };
}

interface RbacRule {
  apiGroups?: string[];
  resources?: string[];
  verbs?: string[];
}

interface ClusterRole {
  /** Enable ClusterRole creation */
  enable?: boolean;
  /** RBAC policy rules */
  rules?: RbacRule[];
}

interface IngressPath {
  path?: string;
  pathType?: PathType;
}

interface IngressHost {
  host?: string;
  paths?: IngressPath[];
}

interface IngressTls {
  secretName?: string;
  hosts?: string[];
}

interface Ingress {
  /** Enable ingress */
  enabled?: boolean;
  /** Ingress class name */
  className?: string;
  /** Ingress annotations */
  annotations?: { [key: string]: string };
  /** Ingress host rules */
  hosts?: IngressHost[];
  /** Ingress TLS configuration */
  tls?: IngressTls[];
}

interface ResourceSpec {
  cpu?: string;
  memory?: string;
}

interface Resources {
  /** CPU/memory resource requests and limits */
  limits?: ResourceSpec;
  requests?: ResourceSpec;
}

interface ProbeHttpGet {
  path?: string;
  port?: string | IntegerType;
}

interface Probe {
  httpGet?: ProbeHttpGet;
  /**
   * @asType integer
   */
  initialDelaySeconds?: number;
  /**
   * @asType integer
   */
  periodSeconds?: number;
  /**
   * @asType integer
   */
  timeoutSeconds?: number;
  /**
   * @asType integer
   */
  failureThreshold?: number;
}

interface EnvVar {
  name: string;
  value?: string;
}

interface VolumeMount {
  mountPath?: string;
  name?: string;
  subPath?: string;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Override the deployment namespace */
  namespaceOverride?: string;
  /**
   * Number of replicas
   * @asType integer
   * @minimum 1
   */
  replicaCount?: number;
  /**
   * Number of old ReplicaSets to retain
   * @asType integer
   * @minimum 0
   */
  revisionHistoryLimit?: number;
  /** Container image configuration */
  image?: Image;
  /** Override the chart name */
  nameOverride?: string;
  /** Override the full release name */
  fullnameOverride?: string;
  /** Service account configuration */
  serviceAccount?: ServiceAccount;
  /** Annotations for the pod */
  podAnnotations?: { [key: string]: string };
  /** Labels for the pod */
  podLabels?: { [key: string]: string };
  /** Pod security context */
  podSecurityContext?: object;
  /** DNS policy for the pod */
  dnsPolicy?: DnsPolicy;
  /** Enable service links in the pod */
  enableServiceLinks?: boolean;
  /** Container security context */
  securityContext?: object;
  /** Service configuration */
  service?: Service;
  /** ConfigMap for Homepage configuration files */
  configMap?: ConfigMap;
  /** Secret configuration */
  secret?: Secret;
  /** ClusterRole for Kubernetes API access */
  clusterrole?: ClusterRole;
  /** Ingress configuration */
  ingress?: Ingress;
  /** CPU/memory resource requests and limits */
  resources?: Resources;
  /** Liveness probe configuration */
  livenessProbe?: Probe;
  /** Readiness probe configuration */
  readinessProbe?: Probe;
  /** Environment variables for the container */
  env?: EnvVar[];
  /** Additional volumes for the deployment */
  volumes?: object[];
  /** Additional volume mounts for the container */
  volumeMounts?: VolumeMount[];
  /** Node selector for pod assignment */
  nodeSelector?: { [key: string]: string };
  /** Tolerations for pod assignment */
  tolerations?: object[];
  /** Affinity rules for pod assignment */
  affinity?: object;
}
