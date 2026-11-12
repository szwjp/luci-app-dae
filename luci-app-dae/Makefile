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
PKG_VERSION:=0.1.0
PKG_RELEASE:=8

PKG_LICENSE:=GPL-3.0-only
PKG_MAINTAINER:=szwjp <szwjp@users.noreply.github.com>
PKG_URL:=https://github.com/szwjp/luci-app-dae

LUCI_DEPENDS:=+luci-base +dae +doona

PKG_DESCRIPTION:=LuCI page for the dae engine. The doona panel itself is the doona package; dae serves it from its own listener.

# The page is static, so the package is the same on every architecture.
PKG_ARCH:=noarch

# The LuCI page reads the state of the service over rpcd, so the package
# ships a small backend next to the view.
PKG_CONFFILES:=
