# Adguard

## Prepare installation

1. Enable metallLB

```bash
microk8s enable metallb
```

2. Use service of type "LoadBalancer"

> To use adguard as dns service in your local network you have to expose a service with port 53.

```bash
apiVersion: v1
kind: Service
metadata:
  name: adguard-service
  namespace: adguard
  annotations:
    metallb.universe.tf/loadBalancerIPs: 192.168.178.201
spec:
  type: LoadBalancer
  ports:
    - name: http-internal
      port: 3000
      protocol: TCP
    - name: dns
      port: 53
      protocol: UDP
    - name: http
      port: 80
      protocol: TCP
  selector:
    app: adguard
```

## Deployment

1. Export environment variable DOMAIN:

```bash
export DOMAIN=local
```

2. Apply yaml with kubectl

```bash
envsubst < adguard.yaml | kubectl apply -f -
```

## Setup adguard

To setup the adguard service:

1. Get pod name:

```bash
kubectl get pods --namespace=adguard
```

2. Connect to pod:

```bash
kubectl exec --stdin --tty --namespace=adguard adguard-deployment-598c79d975-cggr5 -- /bin/sh
```

3. Change config files in config folder:

```bash
cd config/
vi AdGuardHome.yaml
```

## Usage

Define the IP in the annotation "metallb.universe.tf/loadBalancerIPs" as dns server in your device or directly in your router.
