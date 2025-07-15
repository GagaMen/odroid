# Adguard

## Option 1: Use as DHCP server

> Pods are isolated and do not have access to your local network. To use Adguard as DHCP server for your local network, you must run it on your host network.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adguard-deployment
  namespace: adguard
spec:
  selector:
    matchLabels:
      app: adguard
  template:
    metadata:
      labels:
        app: adguard
    spec:
      # set this to true
      hostNetwork: true
      containers:
        - name: adguard
          image: adguard/adguardhome:latest
          ports:
            - containerPort: 53
              name: dns-udp
              protocol: UDP
            - containerPort: 53
              name: dns-tcp
              protocol: TCP
            - containerPort: 8080
              name: http
              protocol: TCP
            - containerPort: 8443
              name: https-udp
              protocol: UDP
            - containerPort: 8443
              name: https-tcp
              protocol: TCP
            - containerPort: 67
              name: dhcp-udp
              protocol: UDP
          volumeMounts:
            - mountPath: /opt/adguardhome/conf
              name: adguard-storage
              subPath: config
            - mountPath: /opt/adguardhome/work
              name: adguard-storage
              subPath: work
      volumes:
        - name: adguard-storage
          persistentVolumeClaim:
            claimName: adguard-pvc
```

## Option 2: Use only as DNS server

1. Enable metallLB

```bash
microk8s enable metallb
```

2. Use service of type "LoadBalancer"

> To use adguard as dns service in your local network, you must provide a service with port 53 and a static IP using metallb.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: adguard-service
  namespace: adguard
  annotations:
    # Define your prefered IP address here
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
