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
