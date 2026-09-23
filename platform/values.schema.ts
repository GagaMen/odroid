import type { Values as ActualValues } from "../charts/actual/values.schema";
import type { Values as AdguardValues } from "../charts/adguard/values.schema";
import type { Values as AlloyValues } from "../charts/alloy/values.schema";
import type { Values as CertManagerDnsLexiconWebhookValues } from "../charts/cert-manager-dns-lexicon-webhook/values.schema";
import type { Values as GrafanaValues } from "../charts/grafana/values.schema";
import type { Values as HomepageValues } from "../charts/homepage/values.schema";
import type { Values as LokiValues } from "../charts/loki/values.schema";
import type { Values as LonghornValues } from "../charts/longhorn/values.schema";
import type { Values as NtfyValues } from "../charts/ntfy/values.schema";
import type { Values as PrometheusValues } from "../charts/prometheus/values.schema";
import type { Values as RustfsValues } from "../charts/rustfs/values.schema";
import type { Values as SnapshotControllerValues } from "../charts/snapshot-controller/values.schema";
import type { Values as VeleroValues } from "../charts/velero/values.schema";

interface ClusterIssuer {
  /** Enable ClusterIssuer creation */
  enabled?: boolean;
  /** ClusterIssuer resource name */
  name?: string;
  /**
   * ACME account email address
   * @format email
   */
  email?: string;
  /**
   * ACME server URL
   * @format uri
   */
  server?: string;
  /** Webhook solver configuration */
  webhook?: {
    /** Webhook solver group name */
    groupName?: string;
    /** DNS provider name (e.g. inwx, cloudflare, route53) */
    provider?: string;
    /** DNS record TTL in seconds */
    ttl?: number | string;
  };
  /** Secret for DNS provider credentials */
  secret?: {
    /** Secret resource name */
    name?: string;
    /** Namespace for the secret */
    namespace?: string;
    /** DNS provider API username */
    auth_username?: string;
    /** DNS provider API password */
    auth_password?: string;
  };
}

export interface PlatformValues {
  /** cert-manager-dns-lexicon-webhook chart values */
  "cert-manager-dns-lexicon-webhook"?: {
    /** Enable cert-manager-dns-lexicon-webhook deployment */
    enabled?: boolean;
  } & CertManagerDnsLexiconWebhookValues;
  /** ClusterIssuer configuration (platform-level) */
  clusterIssuer?: ClusterIssuer;
  /** longhorn chart values (wrapper: chart values go under config) */
  longhorn?: LonghornValues;
  /** snapshot-controller chart values (wrapper: upstream values go under snapshot-controller) */
  "snapshot-controller"?: SnapshotControllerValues;
  /** rustfs chart values (wrapper: upstream values go under rustfs) */
  rustfs?: RustfsValues;
  /** velero chart values (wrapper: upstream values go under velero) */
  velero?: VeleroValues;
  /** homepage chart values */
  homepage?: HomepageValues;
  /** adguard chart values */
  adguard?: AdguardValues;
  /** actual chart values */
  actual?: ActualValues;
  /** ntfy chart values */
  ntfy?: NtfyValues;
  /** prometheus chart values (wrapper: upstream values go under prometheus) */
  prometheus?: PrometheusValues;
  /** grafana chart values (wrapper: upstream values go under grafana) */
  grafana?: GrafanaValues;
  /** loki chart values (wrapper: upstream values go under loki) */
  loki?: LokiValues;
  /** alloy chart values (wrapper: upstream values go under alloy) */
  alloy?: AlloyValues;
}