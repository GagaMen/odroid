// ---------------------------------------------------------------------------
// Wrapper-owned values
// ---------------------------------------------------------------------------
interface LanOnly {
  /** CIDRs allowed to reach any router on the HTTPS entry point; required */
  sourceRange?: string[];
}

// ---------------------------------------------------------------------------
// Upstream chart
// ---------------------------------------------------------------------------
// The upstream chart ships its own strict values.schema.json, which Helm
// validates as well; the keys this wrapper sets are spelled out, the rest is
// left to that schema.

interface RespondingTimeouts {
  /** 0 disables the limit; Traefik 3 defaults to 60s */
  readTimeout?: string | number | null;
  writeTimeout?: string | number | null;
  idleTimeout?: string | number | null;
}

interface EntryPoint {
  port?: number;
  /** Bind this entry point on the node's port */
  hostPort?: number | null;
  hostIP?: string | null;
  containerPort?: number | null;
  expose?: { default?: boolean };
  exposedPort?: number;
  protocol?: string;
  http?: {
    redirections?: {
      entryPoint?: { to?: string; scheme?: string; permanent?: boolean; priority?: number };
    };
    /** Middlewares applied to every router on this entry point */
    middlewares?: string[] | null;
    tls?: { enabled?: boolean; options?: string; certResolver?: string; domains?: object[] };
    [key: string]: unknown;
  };
  transport?: {
    respondingTimeouts?: RespondingTimeouts;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Volume {
  /** ConfigMap or Secret name (passed through tpl) */
  name: string;
  mountPath: string;
  type: "configMap" | "secret";
}

interface TraefikUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: {
    checkNewVersion?: boolean;
    sendAnonymousUsage?: boolean;
    [key: string]: unknown;
  };
  deployment?: {
    kind?: "Deployment" | "DaemonSet";
    replicas?: number | null;
    [key: string]: unknown;
  };
  updateStrategy?: {
    type?: string;
    rollingUpdate?: { maxUnavailable?: number | string | null; maxSurge?: number | string | null };
  };
  ingressClass?: { enabled?: boolean; isDefaultClass?: boolean; name?: string };
  ports?: { [name: string]: EntryPoint | null };
  volumes?: Volume[];
  additionalArguments?: string[];
  providers?: object;
  service?: object;
  api?: object;
  resources?: object;
  namespaceOverride?: string;
  image?: object;
  imagePullSecrets?: object[];
  commonLabels?: object;
  podDisruptionBudget?: object;
  core?: object;
  experimental?: object;
  gateway?: object;
  gatewayClass?: object;
  ingressRoute?: object;
  readinessProbe?: object;
  livenessProbe?: object;
  startupProbe?: object;
  additionalVolumeMounts?: object[];
  log?: object;
  accessLog?: object;
  metrics?: object;
  ocsp?: object;
  tracing?: object;
  env?: object[];
  envFrom?: object[];
  tlsOptions?: object;
  tlsStore?: object;
  autoscaling?: object;
  persistence?: object;
  certificatesResolvers?: object;
  hostNetwork?: boolean;
  rbac?: object;
  serviceAccount?: object;
  serviceAccountAnnotations?: object;
  affinity?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  topologySpreadConstraints?: object[];
  priorityClassName?: string;
  securityContext?: object;
  podSecurityContext?: object;
  extraObjects?: object[];
  instanceLabelOverride?: string;
  versionOverride?: string;
  nameOverride?: string;
  fullnameOverride?: string;
  hub?: object;
  oci_meta?: object;
  offering_version?: string | null;
  enabled?: boolean;
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Source address allow list on the HTTPS entry point */
  lanOnly?: LanOnly;
  /** Traefik upstream chart values (see https://github.com/traefik/traefik-helm-chart/tree/master/traefik) */
  traefik?: TraefikUpstream;
}
