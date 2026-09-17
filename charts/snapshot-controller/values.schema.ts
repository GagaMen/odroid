/** @asType integer */
type IntegerType = number;

interface ContainerImage {
  repository?: string;
  pullPolicy?: string;
  /** Overrides the image tag whose default is the chart appVersion */
  tag?: string;
}

interface ServiceAccount {
  create?: boolean;
  name?: string;
}

/** Settings shared by the controller and the conversion webhook */
interface WorkloadBase {
  /** Deploy this component at all */
  enabled?: boolean;
  replicaCount?: IntegerType;
  revisionHistoryLimit?: IntegerType;
  fullnameOverride?: string;
  image?: ContainerImage;
  imagePullSecrets?: object[];
  podAnnotations?: { [key: string]: string };
  podLabels?: { [key: string]: string };
  podSecurityContext?: object;
  securityContext?: object;
  resources?: object;
  nodeSelector?: { [key: string]: string };
  tolerations?: object[];
  affinity?: object;
  /** PodDisruptionBudget spec */
  pdb?: object;
  topologySpreadConstraints?: object[];
  serviceAccount?: ServiceAccount;
  priorityClassName?: string;
  hostNetwork?: boolean;
  dnsConfig?: object;
  dnsPolicy?: string;
}

interface ControllerArgs {
  leaderElection?: boolean;
  leaderElectionNamespace?: string;
  httpEndpoint?: string;
  /** Comma-separated feature gates, e.g. CSIVolumeGroupSnapshot=true */
  featureGates?: string;
}

interface Controller extends WorkloadBase {
  args?: ControllerArgs;
  rbac?: { create?: boolean };
  serviceMonitor?: { create?: boolean };
}

interface WebhookTls {
  certificateSecret?: string;
  autogenerate?: boolean;
  renew?: boolean;
  certManagerIssuerRef?: object;
  caBundle?: string;
  certificate?: string;
  key?: string;
}

interface Webhook extends WorkloadBase {
  tls?: WebhookTls;
  args?: {
    port?: IntegerType;
    tlsCertFile?: string;
    tlsPrivateKeyFile?: string;
  };
}

interface SnapshotClass {
  name: string;
  driver: string;
  deletionPolicy?: "Delete" | "Retain";
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  parameters?: { [key: string]: string };
}

interface SnapshotControllerUpstream {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Render the VolumeSnapshot CRDs (templates, not crds/) */
  installCRDs?: boolean;
  controller?: Controller;
  /** Conversion webhook for VolumeGroupSnapshots in old beta API versions */
  webhook?: Webhook;
  /** VolumeSnapshotClasses rendered by the chart */
  volumeSnapshotClasses?: SnapshotClass[];
  /** VolumeGroupSnapshotClasses rendered by the chart */
  volumeGroupSnapshotClasses?: SnapshotClass[];
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** snapshot-controller upstream chart values (see https://github.com/piraeusdatastore/helm-charts/tree/main/charts/snapshot-controller) */
  "snapshot-controller"?: SnapshotControllerUpstream;
}
