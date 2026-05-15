/** Volume size (e.g. 500Mi, 1Gi) @pattern ^[0-9]+(Mi|Gi|Ti)$ */
type StorageSize = string;

/** Scrape interval (e.g. 30s) @pattern ^[0-9]+(ms|s|m|h)$ */
type Duration = string;

type PullPolicy = "Always" | "IfNotPresent" | "Never";
type ServiceType = "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
type AccessMode = "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany";
type Protocol = "TCP" | "UDP";
type PathType = "Prefix" | "Exact" | "ImplementationSpecific";

interface PersistenceVolume {
  /** Enable persistent volume */
  enabled?: boolean;
  /** Volume size (e.g. 500Mi, 1Gi) */
  size?: StorageSize;
  /** PVC access mode */
  accessMode?: AccessMode;
  /** Labels for the PVC */
  labels?: Record<string, string>;
  /** Storage class name */
  storageClass?: string;
}

interface ServicePort {
  /** Enable this port */
  enabled?: boolean;
  /**
   * Service port number
   * @asType integer
   */
  port?: number;
  /**
   * Target container port number
   * @asType integer
   */
  targetPort?: number;
  /** Protocol */
  protocol?: Protocol;
}

interface ServicePorts {
  /** Plain DNS (TCP) */
  "dns-tcp"?: ServicePort;
  /** Plain DNS (UDP) */
  "dns-udp"?: ServicePort;
  /** DHCP server listen port */
  "dhcp-listen"?: ServicePort;
  /** DHCP (TCP) */
  "dhcp-tcp"?: ServicePort;
  /** DHCP (UDP) */
  "dhcp-udp"?: ServicePort;
  /** Admin panel HTTP */
  http?: ServicePort;
  /** Admin panel (port 3000) */
  admin?: ServicePort;
  /** DNS-over-TLS */
  "dns-over-tls"?: ServicePort;
  /** DNS-over-QUIC */
  "dns-over-quic"?: ServicePort;
  /** DNSCrypt (TCP) */
  "dnscrypt-tcp"?: ServicePort;
  /** DNSCrypt (UDP) */
  "dnscrypt-udp"?: ServicePort;
  /** Debug/profiling endpoint */
  debug?: ServicePort;
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

interface Image {
  /** Container image repository */
  repository?: string;
  /** Image pull policy */
  pullPolicy?: PullPolicy;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
}

interface PrometheusExporter {
  /** Enable the Prometheus exporter sidecar */
  enabled?: boolean;
  /** Exporter container image */
  image?: Image;
  service?: {
    type?: "ClusterIP" | "NodePort" | "LoadBalancer";
    /**
     * @asType integer
     */
    port?: number;
  };
  /** AdGuard server URLs to scrape */
  servers?: string[];
  /** AdGuard admin usernames */
  usernames?: string[];
  /** AdGuard admin passwords */
  passwords?: string[];
  /** Scrape interval (e.g. 30s) */
  interval?: Duration;
  debug?: boolean;
  /** Address the exporter listens on */
  bindAddress?: string;
  resources?: Resources;
  nodeSelector?: Record<string, string>;
  tolerations?: object[];
  affinity?: object;
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
  /** Use host network for DNS service (required for DHCP and direct DNS access) */
  hostNetwork?: boolean;
  /** Persistent Volume Claims for configuration and work data */
  persistence?: {
    /** PVC for AdGuard configuration data */
    conf?: PersistenceVolume;
    /** PVC for AdGuard work/runtime data */
    work?: PersistenceVolume;
  };
  /** Service configuration */
  service?: {
    /** Service type */
    type?: ServiceType;
    /** Service port definitions */
    ports?: ServicePorts;
  };
  /** Ingress configuration */
  ingress?: Ingress;
  /** CPU/memory resource requests and limits */
  resources?: Resources;
  /** Node selector for pod assignment */
  nodeSelector?: Record<string, string>;
  /** Tolerations for pod assignment */
  tolerations?: object[];
  /** Affinity rules for pod assignment */
  affinity?: object;
  /** Prometheus exporter sidecar configuration */
  prometheusExporter?: PrometheusExporter;
}
