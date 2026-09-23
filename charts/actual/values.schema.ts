/** Volume size (e.g. 500Mi, 2Gi) @pattern ^[0-9]+(Mi|Gi|Ti)$ */
type StorageSize = string;

/** @asType integer */
type IntegerType = number;

type PullPolicy = "Always" | "IfNotPresent" | "Never";
type ServiceType = "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
type AccessMode = "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany";
type PathType = "Prefix" | "Exact" | "ImplementationSpecific";

interface Image {
  /** Container image repository */
  repository?: string;
  /** Image pull policy */
  pullPolicy?: PullPolicy;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
}

interface DeploymentStrategy {
  type?: "Recreate" | "RollingUpdate";
  rollingUpdate?: object;
}

interface Config {
  /** Networks whose X-Forwarded-For is trusted (ACTUAL_TRUSTED_PROXIES). Empty means the server's own default: every private range plus loopback. Only set this to narrow that list. */
  trustedProxies?: string;
  /** Largest budget file the server accepts, in MB (ACTUAL_UPLOAD_FILE_SIZE_LIMIT_MB) */
  uploadFileSizeLimitMb?: IntegerType;
}

interface EnvVar {
  name: string;
  value?: string;
}

interface PersistenceVolume {
  /** Enable persistent volume */
  enabled?: boolean;
  /** Volume size (e.g. 500Mi, 2Gi) */
  size?: StorageSize;
  /** PVC access mode */
  accessMode?: AccessMode;
  /** Labels for the PVC */
  labels?: Record<string, string>;
  /** Storage class name */
  storageClass?: string;
}

interface Service {
  /** Service type */
  type?: ServiceType;
  /** Service port number; the container is told to listen on it as well */
  port?: IntegerType;
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
  annotations?: Record<string, string>;
  /** Ingress host rules */
  hosts?: IngressHost[];
  /** Ingress TLS configuration */
  tls?: IngressTls[];
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

interface ResourceSpec {
  cpu?: string;
  memory?: string;
}

interface Resources {
  /** CPU/memory resource limits */
  limits?: ResourceSpec;
  /** CPU/memory resource requests */
  requests?: ResourceSpec;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Override the deployment namespace */
  namespaceOverride?: string;
  /** Container image configuration */
  image?: Image;
  /** Override the chart name */
  nameOverride?: string;
  /** Override the full release name */
  fullnameOverride?: string;
  /** Deployment update strategy -- Recreate, because two pods would write the same SQLite file */
  strategy?: DeploymentStrategy;
  /** Server settings, handed to the container as ACTUAL_* environment variables */
  config?: Config;
  /** Additional environment variables for the container */
  env?: EnvVar[];
  /** Persistent Volume Claim for the budget data */
  persistence?: {
    /** PVC for server-files and user-files */
    data?: PersistenceVolume;
  };
  /** Service configuration */
  service?: Service;
  /** Ingress configuration */
  ingress?: Ingress;
  /** Liveness probe configuration */
  livenessProbe?: Probe;
  /** Readiness probe configuration */
  readinessProbe?: Probe;
  /** CPU/memory resource requests and limits */
  resources?: Resources;
  /** Node selector for pod assignment */
  nodeSelector?: Record<string, string>;
  /** Tolerations for pod assignment */
  tolerations?: object[];
  /** Affinity rules for pod assignment */
  affinity?: object;
}
