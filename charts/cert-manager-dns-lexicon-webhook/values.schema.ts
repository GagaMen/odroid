type PullPolicy = "Always" | "IfNotPresent" | "Never";

/** Image digest @pattern ^sha256:[a-f0-9]{64}$ */
type ImageDigest = string;

interface Image {
  /** Container image repository */
  repository?: string;
  /** Image tag */
  tag?: string;
  /** Image digest (sha256:...) */
  digest?: ImageDigest;
  /** Image pull policy */
  pullPolicy?: PullPolicy;
}

interface CertManager {
  /** Namespace where cert-manager is installed */
  namespace?: string;
  /** cert-manager service account name */
  serviceAccountName?: string;
}

interface Service {
  /** Service type */
  type?: "ClusterIP" | "NodePort" | "LoadBalancer";
  /**
   * Service port number
   * @asType integer
   */
  port?: number;
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

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** ACME DNS01 solver group name (e.g. acme.mycompany.com). Must be unique and referenced in each Issuer's webhook stanza. */
  groupName?: string;
  /**
   * Number of replicas
   * @asType integer
   * @minimum 1
   */
  replicaCount?: number;
  /** Override the namespace where resources are deployed (defaults to release namespace) */
  namespaceOverride?: string;
  /** cert-manager reference configuration */
  certManager?: CertManager;
  /** Container image configuration */
  image?: Image;
  /** Override the chart name */
  nameOverride?: string;
  /** Override the full release name */
  fullnameOverride?: string;
  /** Service configuration */
  service?: Service;
  /** CPU/memory resource requests and limits */
  resources?: Resources;
  /** Node selector for pod assignment */
  nodeSelector?: { [key: string]: string };
  /** Tolerations for pod assignment */
  tolerations?: object[];
  /** Affinity rules for pod assignment */
  affinity?: object;
}
