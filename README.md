# Odroid setup

## Hardware

[https://www.hardkernel.com/shop/odroid-m2-with-16gbyte-ram/](https://www.hardkernel.com/shop/odroid-m2-with-16gbyte-ram/)

## Install Microk8s

Use this command to install the lastet version:

```bash
snap install microk8s --classic
```

To install a specific veraion see [https://microk8s.io/docs/setting-snap-channel](https://microk8s.io/docs/setting-snap-channel)

### Enable basic addons

```bash
microk8s enable dns
microk8s enable ingress
microk8s enable metallb
```

## Configure z shell (zsh)

Add some kubectl aliases and enable autocompletion:

```bash
alias kubectl="microk8s.kubectl"
alias k="kubectl"
source <(kubectl completion zsh | sed "s/kubectl/microk8s.kubectl/g")
source <(k completion zsh | sed "s/k/microk8s.kubectl/g")
```

Add helm alias and enable autocompletion:

```bash
alias helm="microk8s.helm3"
source <(helm completion zsh | sed "s/helm/microk8s.helm3/g")
```

## Install k9s as kubernetes cli management software

Go to [release page](https://github.com/derailed/k9s/releases), download latest arm64 binary and add them to your bin folder:

```bash
wget https://github.com/derailed/k9s/releases/download/v0.40.10/k9s_Linux_arm64.tar.gz
tar -xvzf k9s_Linux_arm64.tar.gz
mv k9s /usr/local/bin

# Remove unnecessary files form archive
rm README.md LICENSE 
```

### Shell access

To access shell in a pod add kubectl to your $PATH envrionment variable

```bash
sudo ln -s microk8s.kubectl kubectl
```

## Export environment variable KUBECONFIG for k9s and helm

```bash
export KUBECONFIG=/var/snap/microk8s/current/credentials/client.config
```
