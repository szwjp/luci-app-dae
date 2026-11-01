#
# Package metadata for luci-app-dae, the doona web panel for the dae engine.
#
# The panel is the doona static build from the szwjp/doona fork (branch
# feat/dae-native-api), which carries the dae engine adapter. dae serves the
# panel from its native API listener, so this package installs the assets and
# the LuCI entry that opens them; the dae package itself does not depend on it.
#
# This file is free software, licensed under the GNU General Public License v3
# or later.

PKG_NAME:=luci-app-dae
PKG_VERSION:=2026.11.01
PKG_RELEASE:=3

PKG_LICENSE:=GPL-3.0-only
PKG_MAINTAINER:=szwjp <szwjp@users.noreply.github.com>
PKG_URL:=https://github.com/szwjp/luci-app-dae

LUCI_TITLE:=Web panel for the dae engine (doona)
LUCI_DESCRIPTION:=The doona web panel, adapted to the dae engine's native HTTP API. dae serves the panel itself; the LuCI page opens it in the browser.
LUCI_DEPENDS:=+luci-base +dae

PKG_DESCRIPTION:=The doona web panel, adapted to the dae engine's native HTTP API. dae serves the panel itself; the LuCI page opens it in the browser.

# The panel is a static build, so the package is the same on every architecture.
PKG_ARCH:=noarch

# The doona panel, staged to the directory dae's api.ui points at.
PKG_ASSETS:=assets/doona=usr/share/dae/doona

PKG_CONFFILES:=
