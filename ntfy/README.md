# Ntfy

ntfy lets you send push notifications to your phone or desktop via scripts from any computer, using simple HTTP PUT or POST requests.

See also [https://docs.ntfy.sh/](https://docs.ntfy.sh/)

## Deployement

1. Export environment variable DOMAIN:

```bash
export DOMAIN=local
```

2. Apply yaml with kubectl

```bash
envsubst < ntfy.yaml | kubectl apply -f -
```
