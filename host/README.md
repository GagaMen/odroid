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

On this board the vendor kernel and systemd come from the Hardkernel PPA and are built against
Ubuntu 20.04, while the userspace is Ubuntu 24.04. systemd is held at version 245 by an epoch
in its version string, so Ubuntu's own 255.4 never replaces it.

systemd 245 predates the `faccessat2` syscall (439 on arm64) and therefore omits it from the
`@system-service` filter group. glibc 2.39 shipped with Ubuntu 24.04 does use it. Any service
with a `SystemCallFilter` that calls `faccessat2` is killed by seccomp with SIGSYS:

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

`panic_on_rcu_stall` is usually the only detector that survives such a configuration. It is a
partial measure: tasks blocked on dead storage yield the CPU and pass through quiescent states,
so they do not reliably produce a stall. It costs nothing to enable and covers the cases where
a CPU really does get stuck.

### Applying

```bash
sudo install -Dm644 host/files/etc/sysctl.d/99-lockup-recovery.conf \
  /etc/sysctl.d/99-lockup-recovery.conf
sudo sysctl --system
```

### Verifying

```bash
sysctl kernel.panic_on_rcu_stall kernel.panic   # -> 1 and 10
```

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
sudo snap refresh --hold microk8s core22
```

The hold is indefinite and blocks both automatic refreshes and a blanket `snap refresh`.
A targeted `snap refresh microk8s` still works, which is the intended path for controlled
updates:

```bash
microk8s stop          # let the CSI driver unmount its volumes cleanly
sudo snap refresh microk8s
microk8s start
```

Holding updates means nothing reminds you they exist. The metrics and alerts described below
close that gap.

### Verifying

```bash
snap list --all microk8s core22     # the Notes column shows "held"
snap refresh --time                 # hold is reflected in the schedule
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
