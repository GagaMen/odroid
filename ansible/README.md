# Ansible

Rebuilds this server from a fresh Ubuntu install: host configuration, MicroK8s,
tooling, WireGuard, and the Helm platform, in one run.

```bash
sudo apt install ansible
git clone <this repo> ~/odroid && cd ~/odroid/ansible
ansible-galaxy install -r requirements.yml
ansible-playbook site.yml --ask-vault-pass -K
```

It runs **on the board**, against `localhost`. There is no control node to keep
alive and no SSH to arrange while the machine is being rebuilt.

## What it does not do

Four things, and it is worth knowing them before trusting the word "restore".

**The kernel and systemd come from the board vendor, not from Ubuntu.** Several
roles work around a systemd 245 pinned underneath a glibc 2.39 userspace. That
combination is a property of the vendor image, not something a playbook installs.
`roles/preflight` measures what it actually found and applies the workarounds
only where they apply — it does not assume this machine is the machine the
comments describe.

**The vault is not in the repository.** It holds what makes this machine *this*
machine: `platform/values.yaml` in full, the WireGuard configuration, and the
versions the host is pinned to. It lives at `~/.odroid-secrets/vault.yml` by
default (`ODROID_VAULT` overrides the path), and it is therefore the one
artefact a restore cannot bring along. **Back it up separately.** Losing it
means losing `velero.repositoryPassword`, and a Kopia repository password cannot
be changed after the first backup: every Velero backup in both targets becomes
unreadable.

**The data is a separate restore.** The playbook rebuilds the cluster; the PVC
contents come back through Velero afterwards. That is the design — workloads,
ConfigMaps and Secrets come from this repository, so a restore means "put the
data back", not "rebuild the cluster".

**`/boot/config.ini` and `/mnt/data` are not touched.** The boot config has two
`overlays=` lines that look identical and only one is the right target; the data
disk is partitioned by hand. Both are checked by `roles/preflight`, which stops
with an explanation rather than guessing.

## Capture before you need it

`site.yml` restores from the vault. `capture.yml` is what fills it, and it has
to run **while a working machine still exists**:

```bash
ansible-playbook capture.yml -K
```

It reads the live `platform/values.yaml`, `/etc/wireguard/wg0.conf`, the tracked
MicroK8s channel and the installed k9s version, writes them out, and encrypts the
result if `ANSIBLE_VAULT_PASSWORD_FILE` is set. If it is not, the file is left at
mode 0600 outside the repository and you are told to run `ansible-vault encrypt`
yourself — that step is visible rather than implied.

Re-run it whenever the platform configuration changes. An existing vault is
backed up beside itself first, never silently replaced.

## Verifying

The playbook is only worth anything if it produces the machine that exists
today. That is a testable claim:

```bash
ansible-playbook site.yml --check --diff --ask-vault-pass -K
```

**Every reported change is a difference between the playbook and reality**, and
each one has to be explained before the playbook can be trusted. A clean run on
the untouched board is the proof.

Then the pieces, in order of how much they tell you:

```bash
# static
ansible-playbook site.yml --syntax-check
ansible-lint .

# the Helm side matches what is deployed
microk8s.helm3 get values platform -n platform
microk8s.helm3 lint ../platform

# the captured values match the live file
diff <(ansible-vault view ~/.odroid-secrets/vault.yml | yq '.vault_platform_values') \
     ../platform/values.yaml

# the host is in the state host/README.md describes
systemctl list-units --state=failed          # empty
ls -l /dev/watchdog                          # exists
systemctl show -p RuntimeWatchdogUSec        # 2min
snap list --all microk8s core22 snapd        # Notes column reads "held"
curl -s localhost:9100/metrics | grep apt_upgrades
```

The real test is a rebuild: install Ubuntu on an SD card, boot from it, clone,
restore the vault, run `site.yml`. Note that booting from removable media can
swap `mmcblk0` and `mmcblk1` — mount by UUID, and the eMMC stays untouched. Have
the partition UUIDs written down somewhere off the machine before starting.

## Layout

```
ansible.cfg          inventory, vault hints, escalation defaults
inventory.yml        one host: this one, over a local connection
site.yml             restore and converge
capture.yml          record a working machine into the vault
maintenance/         procedures that are not convergence
group_vars/all/      non-sensitive defaults: unit lists, paths, addon list
roles/
  preflight/         measure the host; refuse what does not match
  secrets/           load the vault; refuse a partial one
  host/              everything host/README.md describes
  microk8s/          the snap, its addons, and the storage prerequisites
  tooling/           kubectl wrapper, k9s, shell environment
  wireguard/         packages and the captured wg0.conf
  platform/          values, Helm dependencies, the release
```

### Running one piece

```bash
ansible-playbook site.yml --tags host      --ask-vault-pass -K
ansible-playbook site.yml --tags watchdog  --ask-vault-pass -K   # after a kernel update
ansible-playbook site.yml --tags platform  --ask-vault-pass -K
```

`preflight` and `secrets` carry `tags: always`, because every other role depends
on the facts they establish.

## maintenance/

Kept out of `site.yml` on purpose: these describe things you *do*, not how the
machine should *look*.

| Playbook | What it is for |
|---|---|
| `microk8s-update.yml` | Drain, wait for every Longhorn volume to detach, stop, refresh, start, uncordon. `microk8s stop` does not unmount CSI volumes, so the workloads have to go first. |
| `fstrim-initial.yml` | The first TRIM pass after a long gap, one mountpoint at a time with the timer masked. |

Both prompt or report rather than running silently. `microk8s-update.yml` will
not proceed without a typed confirmation — it takes every workload down.

## Ordering

One constraint is not obvious from the role names: the snap holds run **after**
the MicroK8s role, because `snap refresh --hold microk8s` has nothing to hold
until the snap exists. `site.yml` calls `roles/host` a second time with
`tasks_from: snap-holds` for exactly that reason.
