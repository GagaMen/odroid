# Cert Manager

See also official documentation [https://microk8s.io/docs/addon-cert-manager](https://microk8s.io/docs/addon-cert-manager)

## Prepare installation

```bash
microk8s enable cert-manager
```

## Deployment

1. Export environment variable LETS\_ENCRYPT\_MAIL:

```bash
export LETS_ENCRYPT_MAIL=test@test.com
```

2. Apply yaml with kubectl

```bash
envsubst < cert-manager.yaml | kubectl apply -f -
```

## Usage

1. Open ports 80 and 443 for your odroid

    This is necessary for the http challenge.

2. Add cluster issuer annotation to your ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
 name: microbot-ingress
 annotations:
   cert-manager.io/cluster-issuer: lets-encrypt
```

3. Enable automatic https redirection:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
 name: microbot-ingress
 annotations:
   cert-manager.io/cluster-issuer: lets-encrypt
   nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

4. Limit access to your ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
 name: microbot-ingress
 annotations:
   cert-manager.io/cluster-issuer: lets-encrypt
   nginx.ingress.kubernetes.io/whitelist-source-range: 192.168.178.0/24
```
