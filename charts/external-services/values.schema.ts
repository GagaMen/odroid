/**
 * IPv4 address
 * @format ipv4
 */
type IPv4 = string;

interface Ingress {
  /** Ingress class name */
  className?: string;
  /** Annotations for every Ingress; an entry's own annotations are merged over them */
  annotations?: { [key: string]: string };
  /** Add a TLS section per host, with the certificate in the secret "<name>-tls" */
  tls?: boolean;
}

interface ExternalService {
  /** Name of the Service, EndpointSlice and Ingress */
  name: string;
  /** IPv4 addresses of the device */
  addresses: IPv4[];
  /**
   * Port of the web interface on the device
   * @asType integer
   * @minimum 1
   * @maximum 65535
   */
  port: number;
  /** Host name the Ingress serves */
  host: string;
  /** Additional annotations for this Ingress */
  annotations?: { [key: string]: string };
}

export interface Values {
  /** Injected by Helm for sub-chart coordination */
  global?: object;
  /** Enable/disable this chart (used by platform condition) */
  enabled?: boolean;
  /** Override the deployment namespace */
  namespaceOverride?: string;
  /** Settings shared by all Ingresses */
  ingress?: Ingress;
  /** Devices outside the cluster to put behind the ingress controller */
  services?: ExternalService[];
}
