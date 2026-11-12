#
# Package metadata for luci-app-dae, the LuCI side of the dae engine.
#
# The page shows the state of the service, opens the doona panel dae serves at
# /ui/, hands out the API secret and drives the manual geo data update. The
# panel itself is the doona package from szwjp/doona (installed under
# /usr/share/doona); this package only ships the LuCI page, its rpcd backend
# and the translations, so it stays architecture independent and small.
#
# This file is free software, licensed under the GNU General Public License v3
# or later.

PKG_NAME:=luci-app-dae
# 版本跟着触发发版的自然日期走。
PKG_VERSION:=2026.11.12
PKG_RELEASE:=1

PKG_LICENSE:=GPL-3.0-only
PKG_MAINTAINER:=szwjp <szwjp@users.noreply.github.com>
PKG_URL:=https://github.com/szwjp/luci-app-dae

LUCI_TITLE:=LuCI page for the dae engine
LUCI_DESCRIPTION:=Shows the dae service state, opens the doona panel dae serves, and updates the geo data. The panel comes from the doona package.
LUCI_DEPENDS:=+luci-base +dae +doona

PKG_DESCRIPTION:=LuCI page for the dae engine. The doona panel itself is the doona package; dae serves it from its own listener.

# The page is static, so the package is the same on every architecture.
PKG_ARCH:=noarch

# The LuCI page reads the state of the service over rpcd, so the package
# ships a small backend next to the view.
PKG_CONFFILES:=
