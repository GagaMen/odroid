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
  /** Public URL without trailing slash (PAPERLESS_URL); empty means derived from the first ingress host */
  url?: string;
  /** Tesseract languages joined with "+" (PAPERLESS_OCR_LANGUAGE) */
  ocrLanguage?: string;
  /** IANA time zone (PAPERLESS_TIME_ZONE) */
  timeZone?: string;
  /** Background tasks in parallel (PAPERLESS_TASK_WORKERS) */
  taskWorkers?: IntegerType;
  /** OCR threads per task (PAPERLESS_THREADS_PER_WORKER) */
  threadsPerWorker?: IntegerType;
  /** Webserver processes, each with its own copy of the app in memory (PAPERLESS_WEBSERVER_WORKERS) */
  webserverWorkers?: IntegerType;
  /** Proxy hops in X-Forwarded-For, for the login rate limiter (PAPERLESS_ALLAUTH_TRUSTED_PROXY_COUNT) */
  trustedProxyCount?: IntegerType;
}

interface Secret {
  /** Signs sessions and tokens (PAPERLESS_SECRET_KEY); required */
  secretKey?: string;
  /** Superuser created on first start (PAPERLESS_ADMIN_USER) */
  adminUser?: string;
  /** Password of that superuser, only used when it is created (PAPERLESS_ADMIN_PASSWORD) */
  adminPassword?: string;
}

interface SidecarImage {
  repository?: string;
  tag?: string;
  pullPolicy?: PullPolicy;
}

interface Broker {
  /** Valkey image used as the task queue broker */
  image?: SidecarImage;
  resources?: Resources;
}

interface ScanShareService {
  /** Service type; LoadBalancer gives the share its own address */
  type?: ServiceType;
  /** Address requested from MetalLB (metallb.io/loadBalancerIPs) */
  address?: string;
  /** Additional service annotations */
  annotations?: Record<string, string>;
}

interface ScanShare {
  /** Run a Samba sidecar that shares the consume directory */
  enabled?: boolean;
  image?: SidecarImage;
  /** Share name as clients see it */
  shareName?: string;
  /** Samba account the scanner logs in with */
  user?: string;
  /** Password of that account; no spaces */
  password?: string;
  /** uid (and gid) files are written with; must be paperless's uid */
  uid?: IntegerType;
  /** Client networks (CIDR) allowed to connect */
  allowedNetworks?: string[];
  service?: ScanShareService;
  resources?: Resources;
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
  /** Service port number (the container always listens on 8000) */
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
  httpHeaders?: { name: string; value: string }[];
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
  /** Settings handed to the container as PAPERLESS_* environment variables */
  config?: Config;
  /** Values rendered into the chart's Secret */
  secret?: Secret;
  /** Additional environment variables for the paperless container */
  env?: EnvVar[];
  /** Task queue broker sidecar */
  broker?: Broker;
  /** SMB share onto the consume directory, for network scanners */
  scanShare?: ScanShare;
  /** Persistent Volume Claims */
  persistence?: {
    /** SQLite database, search index, classifier */
    data?: PersistenceVolume;
    /** Originals, archive copies, thumbnails */
    media?: PersistenceVolume;
    /** Inbox for new documents */
    consume?: PersistenceVolume;
  };
  /** Service configuration */
  service?: Service;
  /** Ingress configuration */
  ingress?: Ingress;
  /** Startup probe configuration */
  startupProbe?: Probe;
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
