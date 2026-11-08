# Host Playbook

Brings a freshly flashed ODROID-M2 up to a running MicroK8s: packages, kernel and systemd
hardening, the data disk, MicroK8s with its addons, the shell and the command-line tools.
Deploying the platform on top is a separate step, `scripts/helm-platform install` on a new
machine and `upgrade` after that (see [platform/README.md](../platform/README.md#installation)).

The playbook runs on the machine it configures (`ansible_connection: local` in
`inventory.yml`). To run it from another machine instead, set `ansible_host` there.

Why each host setting exists, and the manual procedures around it, is in
[roles/host/README.md](roles/host/README.md).

## Bootstrap

Starting from a freshly flashed vendor image. The playbook also runs on machines upgraded from
the vendor's older images. It detects whether the machine has the vendor systemd and whether
the kernel ships its own watchdog overlay, and applies only the workarounds that machine needs
(see "How the system got here" in the host README).

```bash
sudo apt install ansible git
git clone https://github.com/GagaMen/odroid.git
cd odroid
```

The playbook needs `host_vars/odroid.yml`. The file is ignored by git: nothing in it is a
credential, but the hostname, disk UUIDs and personal shell exports identify the machine and
its owner. The example file documents every value.

**Rebuilding a machine** whose files are in the vault (see "Personal files" in
[platform/README.md](../platform/README.md#personal-files)): the Bitwarden CLI that restores
them runs on Node.js, which the `devtools` role installs. That role needs no host variables, so
it goes first:

```bash
(cd ansible && ansible-playbook site.yml -K --tags devtools)
hash -r                                   # pick up the new node and npm
npm ci                                    # installs the Bitwarden CLI
npx bw config server https://<server>     # skip for bitwarden.com
npx bw login
export BW_SESSION=$(npx bw unlock --raw)
scripts/personal-files pull               # host_vars/odroid.yml and platform/values.yaml
cd ansible
```

**Setting up a new machine:** copy the example and fill it in:

```bash
cd ansible
cp host_vars/odroid.yml.example host_vars/odroid.yml
```

The data disk must already carry a filesystem. The playbook mounts it and never formats it.

Give the machine its final IP address (a static address or a DHCP reservation) before the
playbook installs MicroK8s. The kubelet's certificate records the address at install time and
is not renewed when it changes; see "Changing the node's address" in the host README.

Then run the playbook, first as a dry run:

```bash
ansible-playbook site.yml -K --check --diff
ansible-playbook site.yml -K
```

`-K` asks for the sudo password. On a fresh image the dry run skips the tasks that depend on
something an earlier task would install, such as the MicroK8s addons. On a machine that is
already set up it should report (almost) nothing as changed. Every change it shows is
either drift on the machine or a mistake in the playbook, and worth a look before the real run.

The clone uses HTTPS, which needs no key. To push from the machine later, switch the remote:

```bash
git remote set-url --push origin git@github.com:GagaMen/odroid.git
```

## Reboots

The playbook never reboots. Changes to the kernel command line or the device tree only take
effect after one, and the run ends with a summary naming them. Drain the node first, as
described under "Snap update discipline" in the host README, and start the cluster again
afterwards.

## Roles

They run in this order. Each role has a tag of the same name, so `--tags boot` runs just that
one.

| Role | What it does |
|---|---|
| `host` | Base packages, hostname, timezone, systemd drop-ins, journald limits, sysctls, multipath blacklist, masked units, textfile collector for node_exporter |
| `boot` | cgroup v2 kernel parameter, hardware watchdog overlay and systemd watchdog |
| `storage` | Data disk and bind mounts in `/etc/fstab`; runs before `microk8s` so its state lands on the data disk |
| `microk8s` | Installs MicroK8s if missing, holds the snaps, grants the user access, enables addons, kubectl wrapper for k9s |
| `shell` | zsh as login shell, Oh My Zsh, Powerlevel10k, `~/.zshrc`, `~/.p10k.zsh` |
| `tools` | k9s and velero from their release tarballs, checksum-verified; k9s config |
| `devtools` | Node.js through `n`, Claude Code |

Versions are pinned in each role's `defaults/main.yml`. Dependabot does not track them.

Some tasks deliberately do nothing on a machine that is already set up:

- **MicroK8s is never refreshed.** If the installed snap tracks a different channel than
  `microk8s_channel`, the role stops. Upgrades go through the drain procedure in the host
  README, after which the variable is updated.
- **Oh My Zsh and Powerlevel10k** are cloned once at the pinned commit and then left alone.
  Oh My Zsh updates itself.
- **n and Claude Code** are installed only when missing; they update themselves. Node.js is
  kept at the version `package.json` requires, because `.npmrc` makes npm refuse any other.

## After a kernel update

Only on kernels without their own watchdog overlay (`wdt.dtbo`), where the playbook installs a
compiled one: a kernel update replaces the directory that holds it. After rebooting into the
new kernel, put the overlay back and reboot again:

```bash
ansible-playbook site.yml -K --tags boot
```
