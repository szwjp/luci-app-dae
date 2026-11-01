#
# Package metadata for the dae engine (eBPF transparent proxy) with the native
# HTTP control plane.
#
# The binary under assets/ is built from the szwjp/dae fork (branch
# feat/dae-native-api), which carries the native API and three fixes against
# the daeuniverse/api-standardize contract. Nothing is downloaded or compiled
# while packaging: .github/build-pkg.sh reads this Makefile and stages the
# files under root/ plus the binary under assets/.
#
# The service is disabled by default. Enable it in /etc/config/dae, then adapt
# /etc/dae/config.dae to the device.
#
# This file is free software, licensed under the GNU General Public License v3
# or later.

PKG_NAME:=dae
PKG_VERSION:=2026.11.01
PKG_RELEASE:=7

PKG_LICENSE:=AGPL-3.0-only
PKG_MAINTAINER:=szwjp <szwjp@users.noreply.github.com>
PKG_URL:=https://github.com/szwjp/luci-app-dae

# The daemon is a static Go binary, so it needs no libraries at runtime. Its
# eBPF datapath attaches TC programs to the LAN/WAN interfaces and creates a
# veth pair plus the daens namespace, hence the kernel modules below; its
# CO-RE programs need the kernel's BTF. ImmortalWrt and OpenWrt 24.10+ ship a
# kernel with BTF built in (/sys/kernel/btf/vmlinux), so no vmlinux-btf package
# is needed here; a kernel without it needs one before dae can start.
# The geo packages ship the dat files dae looks up as geoip:/geosite:.
PKG_DEPENDS:=+ca-bundle +kmod-sched-core +kmod-sched-bpf +kmod-veth +v2ray-geoip +v2ray-geosite

PKG_DESCRIPTION:=dae is an eBPF-based transparent proxy for Linux. This build carries the native HTTP control plane, so a web panel can drive it over the daeuniverse/api-standardize contract.

PKG_ARCH:=x86_64

# The prebuilt daemon, staged outside root/ because it goes to /usr/bin. The
# path is architecture neutral: the CI puts the daemon of the architecture it
# builds into assets/<arch>/dae and points the packaging script at that
# directory, so the same Makefile serves every architecture.
PKG_ASSETS:=assets/dae=usr/bin/dae

# The files that survive an upgrade untouched.
PKG_CONFFILES:=/etc/config/dae /etc/dae/config.dae /etc/dae/config.d/global.dae /etc/dae/config.d/routing.dae /etc/dae/config.d/dns.dae /etc/dae/config.d/node.dae /etc/dae/config.d/group.dae /etc/dae/config.d/subscription.dae
