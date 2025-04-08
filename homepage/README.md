# Homepage

## Deployement

1. Export environment variable DOMAIN:

```bash
export DOMAIN=local
```

2. Apply yaml with kubectl

```bash
envsubst < homepage.yaml | kubectl apply -f -
```

## Setup homepage

To setup the homepage service:

1. Get pod name:

```bash
kubectl get pods --namespace=homepage
```

2. Connect to pod:

```bash
kubectl exec --stdin --tty --namespace=homepage homepage-deployment-598c79d975-cggr5 -- /bin/sh
```

3. Change config files in config folder:

```bash
cd config/
vi settings.yaml
```
