// ---------------------------------------------------------------------------
// Wrapper-owned values
// ---------------------------------------------------------------------------
interface Pool {
  /** Address ranges ("192.168.0.240-192.168.0.250") or CIDRs; must lie outside every DHCP pool */
  addresses?: string[];
  /** Hand out addresses to any LoadBalancer service, not only to those that request one by annotation */
  autoAssign?: boolean;
}

interface L2Advertisement {
  /** Interfaces the addresses are announced on; empty means all */
  interfaces?: string[];
}

// ---------------------------------------------------------------------------
// Upstream chart
// ---------------------------------------------------------------------------
interface Memberlist {
  /** Speakers agree on the announcing node through memberlist (useless on one node) */
  enabled?: boolean;
  mlBindPort?: number;
  mlBindAddrOverride?: string;
  mlSecretKeyPath?: string;
}

interface Workload {
  enabled?: boolean;
  logLevel?: string;
  image?: object;
  serviceAccount?: object;
  securityContext?: object;
  resources?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  priorityClassName?: string;
  runtimeClassName?: string;
  affinity?: object;
  podAnnotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  livenessProbe?: object;
  readinessProbe?: object;
  extraContainers?: object[];
}

interface Controller extends Workload {
  webhookMode?: string;
  strategy?: object;
}

interface Speaker extends Workload {
  tolerateMaster?: boolean;
  memberlist?: Memberlist;
  excludeInterfaces?: { enabled?: boolean };
  ignoreExcludeLB?: boolean;
  bgpDebounceTimeout?: number | null;
  updateStrategy?: object;
  startupProbe?: object;
  /** FRR sidecar for BGP (not used in layer 2 mode) */
  frr?: object;
  reloader?: object;
  frrMetrics?: object;
  initContainers?: object;
}

interface MetallbUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  imagePullSecrets?: object[];
  nameOverride?: string;
  fullnameOverride?: string;
  loadBalancerClass?: string;
  rbac?: { create?: boolean };
  tls?: object;
  prometheus?: object;
  controller?: Controller;
  speaker?: Speaker;
  /** CRDs subchart; validationFailurePolicy applies to the admission webhooks */
  crds?: {
    /** Injected by Helm into the CRDs subchart */
    global?: object;
    enabled?: boolean;
    validationFailurePolicy?: "Fail" | "Ignore";
  };
  /** frr-k8s BGP stack (not used in layer 2 mode) */
  frrk8s?: { enabled?: boolean; external?: boolean; namespace?: string };
  "frr-k8s"?: object;
  networkpolicies?: object;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Address pools, keyed by name; a pool without addresses is not rendered */
  pools?: { [name: string]: Pool };
  /** Layer 2 announcement of all rendered pools */
  l2Advertisement?: L2Advertisement;
  /** MetalLB upstream chart values (see https://github.com/metallb/metallb/tree/main/charts/metallb) */
  metallb?: MetallbUpstream;
}
