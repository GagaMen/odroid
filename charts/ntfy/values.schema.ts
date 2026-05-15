type PullPolicy = "Always" | "IfNotPresent" | "Never";
type ServiceType = "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
type PathType = "Prefix" | "Exact" | "ImplementationSpecific";

interface Image {
  /** Container image repository */
  repository?: string;
  /** Image pull policy */
  pullPolicy?: PullPolicy;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
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
  /** CPU/memory resource limits */
  limits?: ResourceSpec;
  /** CPU/memory resource requests */
  requests?: ResourceSpec;
}

interface ConfigMap {
  /** Enable ConfigMap creation */
  enable?: boolean;
  /** ConfigMap data entries */
  data?: { [key: string]: string };
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
  /** ConfigMap configuration for ntfy server */
  configMap?: ConfigMap;
  /** Service configuration */
  service?: Service;
  /** Ingress configuration */
  ingress?: Ingress;
  /** CPU/memory resource requests and limits */
  resources?: Resources;
  /** Node selector for pod assignment */
  nodeSelector?: { [key: string]: string };
  /** Tolerations for pod assignment */
  tolerations?: object[];
  /** Affinity rules for pod assignment */
  affinity?: object;
}
