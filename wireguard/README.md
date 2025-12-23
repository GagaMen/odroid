# WireGuard

## Installation

```bash
sudo apt update
sudo apt install wireguard
```

## Create server configuration

> You need sudo rights for the following steps. The best way to do this is to switch to a root shell with `sudo su`.

1. Switch to wireguard configuration folder

```bash
cd /etc/wireguard
```

2. Set default permissions

```bash
umask 077
```

3. Generate a server key pair

```bash
wg genkey | tee server.key | wg pubkey > server.pub
```

4. Create wireguard config file

```bash
sudo vi /etc/wireguard/wg0.conf
```

5. Insert the following lines

```
[Interface]
Address = 10.8.0.1/24
ListenPort = 47111
```

6. Add private server key to the config

```bash
echo "PrivateKey = $(cat server.key)" >> /etc/wireguard/wg0.conf
```

## Open the VPN port in your router

Go to your router configuration page and enable port 47111 for your Odroid.

## Start wireguard service

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

## Check status

```bash
sudo wg
```

The output should look like the following:

```bash
interface: wg0
  public key: XYZ123456ABC=   <-- Your public key will be different
  private key: (hidden)
  listening port: 47111
```

## Add client

1. Generate a client key pair

```bash
wg genkey | tee client1.key | wg pubkey > client1.pub
```

2. Generate pre-shared key

> A pre-shared key should be generated for each peer pair and should not be reused.

```bash
wg genpsk > "client1.psk"
```

3. Add client to server configuration

```bash
echo "[Peer]" >> /etc/wireguard/wg0.conf
echo "PublicKey = $(cat "client1.pub")" >> /etc/wireguard/wg0.conf
echo "PresharedKey = $(cat "client1.psk")" >> /etc/wireguard/wg0.conf
echo "AllowedIPs = 10.8.0.2/32" >> /etc/wireguard/wg0.conf
```

4. Reload server configuration

```bash
wg syncconf wg0 <(wg-quick strip wg0)
```

5. Create client configuration

```bash
echo "[Interface]" > "client1.conf"
echo "Address = 10.8.0.2/32" >> "client1.conf"
echo "DNS = 192.168.178.1" >> "client1.conf" # DNS Server IP
echo "PrivateKey = $(cat "client1.key")" >> "client1.conf"
echo "" >> "client1.conf"
echo "[Peer]" >> "client1.conf"
echo "AllowedIPs = 0.0.0.0/32" >> "client1.conf"
echo "Endpoint = [your public IP or domain]:47111" >> "client1.conf"
echo "PersistentKeepalive = 25" >> "client1.conf"
echo "PublicKey = $(cat server.pub)" >> "client1.conf"
echo "PresharedKey = $(cat "client1.psk")" >> "client1.conf"
```

6. Create a QR code for easier transfer of the client configuration (optional)

Install qrencode if not already installed:

```bash
sudo apt install qrencode
```

Then generate QR Code:

```bash
qrencode -t ansiutf8 < client1.conf
```
