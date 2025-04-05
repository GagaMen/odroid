# Longhorn

Longhorn is a backup solution for persistent volume claims in a kubernetes cluster.
See also [https://longhorn.io/](https://longhorn.io/)

## Prepare installation

1. Export environment variable "DOMAIN" for ingress (optional)

```bash
export DOMAIN=local
```

2. Pull default values.yaml

```bash
curl -Lo values.yaml https://raw.githubusercontent.com/longhorn/charts/master/charts/longhorn/values.yaml
```

> Keep in mind to change the image version so that they match the installed chart version

3. Set correct path to kubelet

```yaml
csi:
  kubeletRootDir: /var/snap/microk8s/common/var/lib/kubelet
```

4. Enable ingress and optionally set the host

```yaml
ingress:
  enabled: true
  host: longhorn.local
```

## Installation using helm

> Use --set flag to override ingress host with predefined environment variable

```´bah
helm install longhorn longhorn/longhorn \
  --namespace longhorn \
  --create-namespace \
  --values values.yaml
  --set ingress.host=longhorn.$DOMAIN
```

## Upgrading existing installation

> Use --set flag to override ingress host with predefined environment variable

```bash
helm upgrade longhorn longhorn/longhorn --values values.yaml --set ingress.host=longhorn.$DOMAIN --namespace longhorn
```
