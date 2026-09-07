# Host Configuration

Configuration of the ODROID-M2 below Kubernetes: kernel, systemd, logging and update
discipline. These are the settings that Helm charts cannot manage because they apply to the
machine itself.

## Layout

Every file under `files/` sits at its **target-faithful path**. Installing means copying:

```
files/etc/systemd/system/rsyslog.service.d/10-faccessat2.conf
  -> /etc/systemd/system/rsyslog.service.d/10-faccessat2.conf
```

This mirrors the `files/` directory of an Ansible role. If the setup is automated later, the
directory moves to `ansible/roles/host/files/` without a single file needing to change.

## Logging

### The problem

### How the system got here

The board vendor shipped an Ubuntu 20.04 image. Moving to a current LTS meant two consecutive
`do-release-upgrade` runs, 20.04 to 22.04 to 24.04. Userspace moved with them; the vendor's
kernel and systemd did not.

They stayed behind because of an epoch. The vendor package is versioned
`5:245.4-4ubuntu3+...~focal`, and apt compares the leading `5:` before anything else, so
`5:245.4` outranks Ubuntu's `255.4`. apt therefore considers the installed package newer than
the one in the archive and never offers the upgrade. Nothing warns about this: the release
upgrade completes, the machine boots, and the mismatch only surfaces later as unrelated-looking
failures in individual services.

The consequence is a userspace built against systemd 255 running on systemd 245.

### The seccomp symptom

systemd 245 predates the `faccessat2` syscall (439 on arm64) and therefore omits it from the
`@system-service` filter group. glibc 2.39 shipped with Ubuntu 24.04 does use it. Any service
with a `SystemCallFilter` that calls `faccessat2` is killed by seccomp with SIGSYS.

The failure looks like this:

```
audit: type=1326 ... comm="rsyslogd" sig=31 arch=c00000b7 syscall=439
audit: type=1326 ... comm="fstrim"   sig=31 arch=c00000b7 syscall=439
```

In practice this kills `rsyslog` and `fstrim` on every boot, so `/var/log/syslog` and
`/var/log/kern.log` stay empty and TRIM never runs. Check whether a system is affected with:

```bash
systemctl show rsyslog -p SystemCallFilter --value | tr ' ' '\n' | grep -x faccessat2
```

No output means the syscall is missing from the allowlist.

Separately, `journald` defaults to `Storage=auto`. That mode silently falls back to volatile
storage in `/run` when it cannot write persistently, so the logs are gone after the next
reboot — precisely when they matter most. `Storage=persistent` fails visibly instead.

### Applying

```bash
sudo install -Dm644 host/files/etc/systemd/system/rsyslog.service.d/10-faccessat2.conf \
  /etc/systemd/system/rsyslog.service.d/10-faccessat2.conf
sudo install -Dm644 host/files/etc/systemd/system/fstrim.service.d/10-faccessat2.conf \
  /etc/systemd/system/fstrim.service.d/10-faccessat2.conf
sudo install -Dm644 host/files/etc/systemd/journald.conf.d/10-limits.conf \
  /etc/systemd/journald.conf.d/10-limits.conf

sudo systemctl daemon-reload
sudo systemctl reset-failed rsyslog.service syslog.socket fstrim.service
sudo systemctl start rsyslog.service

sudo journalctl --verify                    # record the state before cleaning up
sudo rm -f /var/log/journal/*/*.journal~     # drop corrupted journal files
sudo systemctl restart systemd-journald
sudo journalctl --vacuum-size=1G
```

> **Do not use a global drop-in** in `/etc/systemd/system/service.d/`. `SystemCallFilter` is
> additive, but for units that carry *no* filter a global drop-in would create an allowlist
> permitting **only** `faccessat2` — breaking nearly every service on the system.

### Verifying

```bash
systemctl is-active rsyslog                             # -> active
logger "test" && sleep 2 && tail -1 /var/log/syslog     # -> the line shows up
sudo journalctl --disk-usage                            # -> within the new limit
```

The real test comes with the next reboot, because the seccomp kills happen at startup:

```bash
dmesg | grep -c "sig=31"                                # -> 0
stat -c "%n %s bytes" /var/log/syslog /var/log/kern.log # -> both > 0
sudo journalctl --list-boots | tail -3                  # -> previous boot present
```

`journalctl -b -1` is the indicator that matters: only once that works can a future incident
be analysed at all.

## Services that cannot run here

Seven units fail on every boot. Four of them are collateral damage from the same pinned systemd
described above; the fifth asks for a kernel feature this build does not have.

| Unit | What it is for | Why it fails |
|---|---|---|
| `polkit` | Decides whether a program may perform a privileged action without being root — on a desktop, the password prompt when installing software | `libsystemd.so.0: version 'LIBSYSTEMD_253' not found` |
| `udisks2` | Detects and mounts removable media, such as a USB stick being plugged in | `libudev.so.1: version 'LIBUDEV_247' not found` |
| `fwupd` | Fetches firmware updates from LVFS, the cross-vendor service used for PC BIOS/UEFI | `libfwupdengine.so: cannot change memory protections` |
| `fwupd-refresh` | Downloads the LVFS metadata for `fwupd` once a day | follows from `fwupd` — `fwupdmgr refresh` needs the daemon |
| `fwupd-refresh.timer` | Triggers the above once a day | fails once its service is masked |
| `systemd-binfmt` | Registers foreign binary formats so the kernel runs them through an interpreter, e.g. ARM binaries on x86 via qemu | `CONFIG_BINFMT_MISC is not set` in this kernel |
| `ModemManager` | Manages mobile broadband modems (WWAN, LTE sticks) | `Requires=polkit.service`, so masking polkit stops it too |

The distribution builds `polkitd` and `udisksd` against the systemd its release ships. A vendor
systemd held at an older version provides those shared libraries at its own, older symbol
versions, so the binaries cannot resolve what they were linked against. `fwupd` fails a step
earlier: its unit sets `MemoryDenyWriteExecute=yes`, and the older systemd's seccomp filter for
that option rejects the `mprotect` call the dynamic loader needs.

None can be repaired without unpinning systemd, which on a vendor BSP risks an unbootable
system. None of them has a job on a headless Kubernetes node either: authorization runs through
`sudo`, there is no removable media to manage, and firmware comes from the board vendor rather
than LVFS.

Masking them states that plainly, stops the retries at every boot, and keeps the "failed units"
alert meaningful instead of permanently red.

`mask` rather than `disable` on purpose. `disable` only stops a unit from starting on its own —
it can still be started by hand or pulled in as another unit's dependency. `mask` links it to
`/dev/null` so it cannot start at all. These units genuinely cannot work here, so the stronger
statement is the accurate one. Both are reversible: `systemctl unmask <unit>`.

The real repair would be to unpin systemd and let the distribution's own version take over,
which would fix all four at once along with the seccomp problem above. That means overriding
apt's version comparison to install an apparently older package, on the component that boots the
machine. It is worth doing only with console access and a bootable recovery medium at hand, and
it is deliberately not part of this configuration.

```bash
sudo systemctl mask fwupd.service fwupd-refresh.service fwupd-refresh.timer \
  polkit.service udisks2.service systemd-binfmt.service ModemManager.service
```

`ModemManager` is on the list as a consequence, not a cause: it declares `Requires=polkit.service`,
so once polkit is masked it can no longer start. Check what a unit pulls along before masking it:

```bash
systemctl list-dependencies --reverse polkit.service
```

Here that lists `ModemManager` and nothing else, and this board has no WWAN hardware at all --
no modem device nodes, no `ww*` interfaces -- so it has no work to do either way.

Mask the timer along with its service. A timer whose service is masked still fires and still
fails, so masking only the service trades one failed unit for another. Check for companions
before masking anything:

```bash
systemctl list-unit-files 'fwupd*'
```

Verify none remain, and that the metric agrees:

```bash
systemctl list-units --state=failed
curl -s localhost:9100/metrics | grep 'state="failed"} 1'
```

## Deadlock recovery

### The problem

This vendor kernel is built without any lockup detector — `CONFIG_DETECT_HUNG_TASK`,
`CONFIG_SOFTLOCKUP_DETECTOR` and `CONFIG_PSI` are all disabled, and there is no hardware
watchdog device by default. A machine that deadlocks in uninterruptible sleep therefore stays
up, answers pings, and serves nothing — indefinitely, with nothing to notice or end it.

Check what a given kernel offers:

```bash
ls /proc/sys/kernel/ | grep -E "hung|lockup|watchdog|panic"
ls /proc/pressure /dev/watchdog 2>/dev/null
```

`panic_on_rcu_stall` is usually the only detector that survives such a configuration, and it is
a partial measure: tasks blocked on dead storage yield the CPU and pass through quiescent
states, so they do not reliably produce a stall. It costs nothing and covers a genuinely stuck
CPU, but it cannot be the whole answer.

The hardware watchdog can. It does not depend on the kernel noticing anything — if nothing feeds
it, the board resets.

### The watchdog is present but switched off

Check before concluding there is none. The device tree may carry the node with
`status = "disabled"` while the driver is built into the kernel:

```bash
grep -r . /proc/device-tree/watchdog*/status /proc/device-tree/watchdog*/compatible 2>/dev/null
grep -E "CONFIG_(WATCHDOG|DW_WATCHDOG)=" /boot/config-$(uname -r)
```

A node reading `disabled` next to a compiled-in driver means only the node needs enabling, which
a device tree overlay does. See `files/boot/overlays/watchdog.dts`.

### Applying

```bash
sudo install -Dm644 host/files/etc/sysctl.d/99-lockup-recovery.conf \
  /etc/sysctl.d/99-lockup-recovery.conf
sudo sysctl --system

# Back up the boot config before touching it -- a broken one means booting from
# removable media to repair it.
sudo cp -n /boot/config.ini /boot/config.ini.bak

dtc -I dts -O dtb -o /tmp/watchdog.dtbo host/files/boot/overlays/watchdog.dts
sudo install -Dm644 /tmp/watchdog.dtbo \
  /boot/dtbs/$(uname -r)/rockchip/overlays/odroidm2/watchdog.dtbo
# Append the overlay name to the overlays= line under [generic] -- note there is a
# second overlays= line further down that must stay untouched.
sudo nano /boot/config.ini

sudo install -Dm644 host/files/etc/systemd/system.conf.d/10-watchdog.conf \
  /etc/systemd/system.conf.d/10-watchdog.conf
sudo reboot
```

Verify the overlay offline before rebooting — it costs nothing and turns a failed boot into a
caught mistake:

```bash
fdtoverlay -i "$(readlink -f /boot/dtb)" -o /tmp/merged.dtb /tmp/watchdog.dtbo
fdtget /tmp/merged.dtb /watchdog@feaf0000 status     # -> okay
```

### Verifying

```bash
sysctl kernel.panic_on_rcu_stall kernel.panic       # -> 1 and 10
ls -l /dev/watchdog                                 # exists after the reboot
systemctl show -p RuntimeWatchdogUSec               # -> 2min
journalctl -b | grep -i "hardware watchdog"         # names the driver and the timeout applied
```

The journal line matters: the driver clamps the requested timeout to its own maximum, and this
is where you find out what you actually got. `/sys/class/watchdog/` carries that information on
kernels built with `CONFIG_WATCHDOG_SYSFS`; without it, the journal is the only report.

### Testing that it really resets

Configuration proves the driver answers ioctls, not that the hardware pulls the reset line.
Testing that means letting the watchdog bite, which hard-resets the board — so drain the node
first and confirm every volume reads `detached`.

systemd holds `/dev/watchdog` open, and a second open fails with `EBUSY`, so it has to let go
first. Doing that through a separate drop-in is deliberate: the machine comes back with the
watchdog unfed rather than into a reset loop.

```bash
printf '[Manager]\nRuntimeWatchdogSec=0\n' | sudo tee /etc/systemd/system.conf.d/99-watchdog-test.conf
sudo systemctl daemon-reexec
systemctl show -p RuntimeWatchdogUSec               # -> 0, systemd has released it

sudo sh -c 'exec 3>/dev/watchdog; sleep 600'        # open, never feed
```

The board resets within roughly the configured timeout; the session dies without warning. That
is the pass condition. Afterwards:

```bash
sudo rm /etc/systemd/system.conf.d/99-watchdog-test.conf
sudo systemctl daemon-reexec
systemctl show -p RuntimeWatchdogUSec               # -> back to 2min
```

### After every kernel update

`/boot/overlays` points into a version-specific directory that a kernel update replaces, and the
`.dtbo` files belong to no package. An update therefore removes the overlay silently, taking the
only self-heal with it. Re-install it and reboot:

```bash
dtc -I dts -O dtb -o /tmp/watchdog.dtbo host/files/boot/overlays/watchdog.dts
sudo install -Dm644 /tmp/watchdog.dtbo \
  /boot/dtbs/$(uname -r)/rockchip/overlays/odroidm2/watchdog.dtbo
```

The "watchdog not active" alert exists to catch this when the step is forgotten.

## Snap update discipline

### The problem

MicroK8s is distributed as a snap, and snapd refreshes snaps automatically up to four times a
day. A refresh restarts `containerd` and `kubelite` without warning. If a CSI driver such as
Longhorn is serving volumes over iSCSI at that moment, its instance manager is killed while
the filesystems on those volumes are still mounted. The block devices vanish underneath them,
ext4 aborts its journal and remounts read-only, and every pod holding a persistent volume
loses its data until the node is repaired.

Refreshing the snap's base has the same effect, because snapd restarts the snaps that use it:

```bash
snap list                                     # note the base column
grep ^base /snap/microk8s/current/meta/snap.yaml
```

### Applying

```bash
sudo snap refresh --hold microk8s core22 snapd
```

The hold is indefinite and blocks both automatic refreshes and a blanket `snap refresh`.
A targeted `snap refresh microk8s` still works, which is the intended path for controlled
updates.

`snapd` is held for a narrower reason. Refreshing it restarts `snapd.service`, and an
unattended refresh arrives in one of four daily windows -- almost certainly while volumes are
attached. Whether that restart also reaches the microk8s services was measured on 2026-09-04:
refreshing 2.76.2 to 2.76.3 restarted `snapd.service` alone, while all six
`snap.microk8s.daemon-*` units kept the start timestamps they had from the last boot. A single
observation is not a guarantee, so the drain described below stays the documented path -- but
the exposure is narrower than it looked. The price of the hold is that snapd's own security
fixes no longer arrive by themselves.

`microk8s stop` does **not** unmount CSI volumes. There is no `umount` anywhere in the snap,
and the stop script's first act is to stop kubelite, which kills the pod serving the iSCSI
targets. Every mount kubelet made stays behind pointing at a device that no longer answers --
the same state an unplanned restart produces, and the reason a later shutdown blocks.

Remove the workloads first, so the CSI driver unmounts and the storage layer detaches while its
provider is still alive:

```bash
microk8s kubectl cordon <node>
microk8s kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
microk8s kubectl -n longhorn get volumes.longhorn.io   # wait for detached
microk8s stop
sudo snap refresh microk8s
microk8s start
microk8s kubectl uncordon <node>
```

`microk8s stop` passes `--disable` to the kubelite service, so the cluster does not come back
on its own after a reboot. Start it with `microk8s start`.

### Recovering stranded volumes

If the devices are already gone while the mounts are still listed, detach them before
rebooting -- otherwise the shutdown blocks on filesystems that cannot answer. Confirm the
situation first; a bounded read returns immediately when the device is dead:

```bash
timeout 5 dd if=/dev/sda of=/dev/null bs=512 count=1   # no output, non-zero exit = gone
```

Then detach, deepest paths first. Lazy unmount returns at once instead of waiting on dead I/O;
the pending writes are lost either way, since their target is already gone:

```bash
awk '$2 ~ /globalmount|kubernetes\.io~csi/ {print $2}' /proc/mounts \
  | awk '{print length"\t"$0}' | sort -rn | cut -f2- \
  | while read -r m; do sudo umount -l "$m"; done
sudo iscsiadm -m node --logoutall=all
```

Before rebooting, `/proc/mounts` should list none of those paths and `lsblk` should show no
leftover `sd*` devices.

Holding updates means nothing reminds you they exist. The metrics and alerts described below
close that gap.

### Verifying

```bash
snap list --all microk8s core22 snapd   # the Notes column shows "held"
snap refresh --time                     # hold is reflected in the schedule
```

## TRIM scope

### Why TRIM matters

Flash storage cannot overwrite in place. A cell must be erased before it is rewritten, and
erasing happens in large blocks. When a file is deleted the filesystem marks the space free,
but the device controller is never told — to it those blocks still look like live data it must
preserve during wear levelling.

TRIM is the notification that those blocks are no longer needed. The controller can then erase
them in the background and keep a pool of ready-to-write blocks. Without it that pool shrinks,
and writes increasingly require a read-modify-erase-write cycle. The result is slower writes
and faster wear, because each logical write costs more physical erase cycles.

Running it weekly rather than continuously is the usual compromise: the `discard` mount option
issues a TRIM on every delete, which hurts latency on many devices.

### The problem

The stock `fstrim.service` reads its list of targets from `/proc/self/mountinfo`, so it trims
**everything currently mounted**. On a Kubernetes node that includes volumes provided by a CSI
driver over iSCSI. Those advertise discard support:

```bash
lsblk -o NAME,DISC-GRAN,DISC-MAX,MOUNTPOINT
```

so `fstrim` sends discards down the iSCSI path into the storage engine. That subsystem is
exactly the one most likely to be fragile under load, and a distributed volume has its own
notion of which blocks are free across replicas. Trimming it from the host is at best
redundant work and at worst a stall in the storage path.

Restrict the service to the machine's own devices and let the storage layer handle its own
volumes through its own tooling.

### Applying

Because the timer may fire a long-delayed catch-up run — `fstrim.timer` has `Persistent=true`,
so a run missed while the service was broken is executed at the next opportunity — mask the
timer first and do the initial pass by hand, watching it:

```bash
sudo systemctl mask fstrim.timer

sudo install -Dm644 host/files/etc/systemd/system/fstrim.service.d/20-scope.conf \
  /etc/systemd/system/fstrim.service.d/20-scope.conf
sudo systemctl daemon-reload

# One device at a time. The first pass after a long gap has the most work to do.
time sudo fstrim --verbose /
time sudo fstrim --verbose /mnt/data

sudo systemctl unmask fstrim.timer
sudo systemctl start fstrim.service
```

Watch load and I/O from a second shell while the manual passes run:

```bash
watch -n1 'uptime; grep -E " (mmcblk0|nvme0n1) " /proc/diskstats'
```

If a pass stalls the machine noticeably, leave the timer masked and run `fstrim` by hand at a
quiet time instead.

### Verifying

```bash
systemctl cat fstrim.service | grep ExecStart   # only the intended mountpoints
systemctl is-failed fstrim.service              # -> not failed
systemctl list-timers fstrim.timer              # active again, next run scheduled
```

## Update visibility

### The problem

Holding a snap (see above) means nothing tells you an update exists. Distribution packages
have the same gap in the other direction: unattended-upgrades may install them, but nothing
reports what is outstanding or that a reboot is now required.

Both gaps are filled by writing metrics into the node_exporter textfile collector, so update
state shows up beside every other host metric and can be alerted on.

### What is exported

`node-exporter-apt` (Python, uses `python3-apt`):

| Metric | Meaning |
|---|---|
| `apt_upgrades_all_pending` | packages that can be upgraded |
| `apt_upgrades_security_pending` | of those, ones from a security source |
| `apt_upgrades_pending{origin,archive}` | breakdown by source |
| `node_reboot_required` | `/var/run/reboot-required` exists |

Note that Ubuntu mirrors security fixes into `-updates`, so a package can appear in both
archives. The script counts a package as a security update if *any* of its origins is a
security source, which matches what `/usr/lib/update-notifier/apt-check` reports.

`node-exporter-snap` (Python, standard library only):

| Metric | Meaning |
|---|---|
| `snap_refresh_available{snap,held}` | a newer revision exists on the tracked channel |
| `node_watchdog_present` | `/dev/watchdog` exists |

It queries snapd over its REST socket rather than parsing CLI output. The socket is
world-readable and these are read-only queries, so no privileges are needed:

```bash
curl -s --unix-socket /run/snapd.socket http://localhost/v2/snaps
```

Two sources are combined deliberately. `/v2/find?select=refresh` is what `snap refresh --list`
uses, but whether it includes held snaps is not guaranteed — and a held snap is exactly the one
whose updates must not go unnoticed. Held snaps are therefore also compared directly against
the revision their channel currently offers.

That comparison uses the snap's `channel` field rather than `tracking-channel`. A snap may
track a branch such as `4.0/stable/ubuntu-24.04`, which the channel map does not list, while
`channel` holds the resolved track/risk pair that does.

Both scripts write atomically, because node_exporter may read a file at any moment.

### Applying

```bash
sudo install -Dm755 host/files/usr/local/bin/node-exporter-apt  /usr/local/bin/node-exporter-apt
sudo install -Dm755 host/files/usr/local/bin/node-exporter-snap /usr/local/bin/node-exporter-snap
sudo install -Dm644 host/files/etc/systemd/system/node-exporter-textfile.service \
  /etc/systemd/system/node-exporter-textfile.service
sudo install -Dm644 host/files/etc/systemd/system/node-exporter-textfile.timer \
  /etc/systemd/system/node-exporter-textfile.timer

sudo systemctl daemon-reload
sudo systemctl enable --now node-exporter-textfile.timer
sudo systemctl start node-exporter-textfile.service
```

The service unit deliberately carries **no** `SystemCallFilter`. On a system affected by the
`faccessat2` defect described above, any allowlist would kill these scripts with SIGSYS.

Then let node_exporter read the directory and query systemd, by adding to its chart values:

```yaml
extraArgs:
  - --collector.systemd
  - --collector.textfile.directory=/host/textfile
extraHostVolumeMounts:
  - name: textfile
    hostPath: /var/lib/prometheus/node-exporter
    mountPath: /host/textfile
    readOnly: true
  - name: dbus
    hostPath: /run/dbus/system_bus_socket
    mountPath: /var/run/dbus/system_bus_socket
    readOnly: true
```

The systemd collector reaches systemd over the D-Bus system bus, which a container does not see
by default. node_exporter dials `/var/run/dbus/system_bus_socket` literally and its image has
no `/var/run`, so the mount must land on that path rather than on `/run`. Give the host path
unresolved, since `/var/run` is itself a symlink to `/run`.

node_exporter runs unprivileged, so systemd answers read-only queries over the bus and refuses
anything else. Mounting the socket read-only is fine: the kernel exempts sockets from the
read-only mount check, so `connect()` still succeeds.

### Verifying

```bash
ls -l /var/lib/prometheus/node-exporter/            # apt.prom and snap.prom
systemctl list-timers node-exporter-textfile.timer

curl -s localhost:9100/metrics | grep -E \
  "apt_upgrades|snap_refresh_available|node_reboot_required|node_watchdog_present"
curl -s localhost:9100/metrics | grep -c node_systemd_unit_state   # > 0
```

A zero count for `node_systemd_unit_state` means the systemd collector could not reach the
socket; check `kubectl logs` for the node_exporter pod.
