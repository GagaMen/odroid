# MetalLB

Helm chart wrapper for [metallb](https://github.com/metallb/metallb/tree/main/charts/metallb),
a load balancer implementation for bare-metal clusters.

Without it, a `LoadBalancer` service never gets an external address and stays `<pending>`.
With it, a service can have **its own address in the home network**, so a port such as SMB
445 can be offered without binding it on the node through `hostPort` or `hostNetwork`.

MetalLB runs in **layer 2 mode**: the speaker answers ARP requests for the service address,
so the network sends that traffic to the node, where kube-proxy forwards it to the pod.
No router configuration is needed. BGP mode and its frr-k8s stack are switched off.

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `pools.<name>.addresses` | `[]` | Ranges (`192.168.0.240-192.168.0.250`) or CIDRs. A pool without addresses is not rendered |
| `pools.<name>.autoAssign` | `false` | Only services that request an address get one (see below) |
| `l2Advertisement.interfaces` | `[]` | Interfaces the addresses are announced on; empty means all |
| `metallb.frrk8s.enabled` | `false` | BGP stack, not needed for layer 2 |
| `metallb.speaker.memberlist.enabled` | `false` | Node agreement protocol, pointless on a single node |

The address range belongs in `platform/values.yaml` (gitignored):

```yaml
metallb:
  enabled: true
  pools:
    lan:
      addresses:
        - 192.168.0.240-192.168.0.250
```

The range **must lie outside every DHCP pool** in the network -- the router's and, if it
hands out addresses, AdGuard's. Otherwise a DHCP client and a service can end up with the
same address, and ARP decides at random which of them receives the traffic.

The upstream chart has no namespace override, so MetalLB runs in the namespace of the
Helm release (`platform`).

## Requesting an Address

With `autoAssign: false` a service gets an address only if it names one:

```yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    metallb.io/loadBalancerIPs: 192.168.0.240
spec:
  type: LoadBalancer
```

This keeps existing `LoadBalancer` services that were never meant to be exposed on their own
address -- in this repository the AdGuard and ntfy services -- where they are. With
`autoAssign: true` every one of them would be handed an address the moment MetalLB starts.

Services that filter by client address (`loadBalancerSourceRanges`, or the application's
own allow list) need `externalTrafficPolicy: Local`. With the default `Cluster`, kube-proxy
replaces the client address with the node's before the packet reaches the pod.

## Installing: Two Upgrades

The `IPAddressPool` and `L2Advertisement` CRDs arrive with this chart. Helm cannot map a kind
whose CRD does not exist yet when it builds a release, so the release that installs MetalLB
**skips the pool and the advertisement**, and the next upgrade creates them:

```bash
helm upgrade platform ./platform -n platform -f platform/values.yaml   # CRDs, controller, speaker
helm upgrade platform ./platform -n platform -f platform/values.yaml   # pools, advertisement
kubectl -n platform get ipaddresspool,l2advertisement
```

A Helm hook would avoid the second run, but hooks are deleted and recreated on every upgrade,
which would withdraw every assigned address for a moment each time.

## MicroK8s Addon

MicroK8s ships MetalLB as the `metallb` addon. Keep it disabled: the addon and this chart
would install the same CRDs and fight over them. The addon also creates a pool with
automatic assignment and takes the address range as a command-line argument, so the
configuration would live only in the cluster.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:metallb
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [MetalLB Documentation](https://metallb.io/)
- [Layer 2 Mode](https://metallb.io/concepts/layer2/)
- [Helm Chart](https://github.com/metallb/metallb/tree/main/charts/metallb)
