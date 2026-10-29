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
  /** Public URL without trailing slash (BASE_URL); empty means derived from the first ingress host */
  baseUrl?: string;
  /** IANA time zone (TZ) */
  timeZone?: string;
  /** Allow sign-up without an invitation (ALLOW_SIGNUP) */
  allowSignup?: boolean;
  /** Private hosts or CIDRs Mealie may reach (HTTP_ALLOW_LIST); the Bring bridge is added automatically */
  httpAllowList?: string[];
}

interface SidecarImage {
  repository?: string;
  tag?: string;
  pullPolicy?: PullPolicy;
}

interface Bring {
  /** Run the mealie-bring-api sidecar */
  enabled?: boolean;
  image?: SidecarImage;
  /** Bring account email (BRING_USERNAME) */
  username?: string;
  /** Bring account password (BRING_PASSWORD) */
  password?: string;
  /** Exact name of the target Bring list (BRING_LIST_NAME) */
  listName?: string;
  /** Mealie API key; enables moving shopping lists to Bring (MEALIE_API_KEY) */
  mealieApiKey?: string;
  /** Only move items of this Mealie shopping list (MEALIE_SHOPPING_LIST_UUID) */
  shoppingListUuid?: string;
  /** Port the bridge listens on, on 127.0.0.1 */
  port?: IntegerType;
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
  /** Service port number (the container always listens on 9000) */
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
  /** Settings handed to the container as environment variables */
  config?: Config;
  /** Additional environment variables for the mealie container */
  env?: EnvVar[];
  /** Sidecar that pushes ingredients to a Bring! list */
  bring?: Bring;
  /** Persistent Volume Claims */
  persistence?: {
    /** SQLite database, recipe images, backups */
    data?: PersistenceVolume;
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
