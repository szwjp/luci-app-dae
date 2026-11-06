#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
#
# Builds one .apk package from a package directory, using apk-tools directly
# instead of an OpenWrt SDK: the staging tree is assembled here and apk mkpkg
# writes the ADB container.
#
# A package directory holds:
#   Makefile    the metadata (name, version, deps, conffiles, assets)
#   root/       files that go to /                 (optional)
#   htdocs/     LuCI resources that go to /www    (optional)
#   assets/     files that go somewhere else, listed in the Makefile
#
# Usage: build-pkg.sh <package-dir> [<output-dir>]

set -o errexit
set -o pipefail
set -o nounset

PKG_DIR_ARG="${1:-}"
OUT_DIR="${2:-}"
if [ -z "$PKG_DIR_ARG" ]; then
	echo "usage: $0 <package-dir> [<output-dir>]" >&2
	exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$REPO_DIR/$PKG_DIR_ARG" ]; then
	PKG_DIR="$(cd "$REPO_DIR/$PKG_DIR_ARG" && pwd)"
else
	PKG_DIR="$PKG_DIR_ARG"
fi
if [ ! -f "$PKG_DIR/Makefile" ]; then
	echo "error: no Makefile in $PKG_DIR" >&2
	exit 1
fi
OUT_DIR="${OUT_DIR:-$REPO_DIR/out}"
mkdir -p "$OUT_DIR"

export PKG_SOURCE_DATE_EPOCH="${PKG_SOURCE_DATE_EPOCH:-$(date "+%s")}"
export SOURCE_DATE_EPOCH="$PKG_SOURCE_DATE_EPOCH"

MAKEFILE="$PKG_DIR/Makefile"

# Reads a "KEY:=value" assignment. A value may continue on the next line with
# a trailing backslash; the continuation is joined with a space.
get_mk_value() {
	awk -v key="$1" '
		$0 ~ "^"key":=" {
			line = $0
			sub("^"key":=[ \t]*", "", line)
			while (1) {
				if (line ~ /\\$/) {
					sub(/\\$/, "", line)
					print line
					if ((getline line) <= 0) break
					sub(/^[ \t]*/, "", line)
					continue
				}
				print line
				break
			}
			exit
		}
	' "$MAKEFILE" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//'
}

# The same, but a list: the value is split on whitespace.
get_mk_list() {
	get_mk_value "$1" | tr ' ' '\n' | grep -v '^$' || true
}

# The dependency lists use the feed's "+pkg" form; apk wants plain names.
DEPENDS_RAW="$(get_mk_value "PKG_DEPENDS")"
[ -n "$DEPENDS_RAW" ] || DEPENDS_RAW="$(get_mk_value "LUCI_DEPENDS")"
DEPENDS="$(echo "$DEPENDS_RAW" | tr ' ' '\n' | sed 's/^+//' | grep -v '^$' | tr '\n' ' ')"

# sha256sum is not everywhere; shasum is the macOS spelling of the same thing.
sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | awk '{print $1}'
	else
		shasum -a 256 "$1" | awk '{print $1}'
	fi
}

PKG_NAME="$(get_mk_value "PKG_NAME")"
PKG_VERSION="$(get_mk_value "PKG_VERSION")"
PKG_RELEASE="$(get_mk_value "PKG_RELEASE")"
PKG_ARCH="$(get_mk_value "PKG_ARCH")"
# The workflow builds one package per architecture and overrides the value
# from the Makefile.
[ -n "${PKG_ARCH_OVERRIDE:-}" ] && PKG_ARCH="$PKG_ARCH_OVERRIDE"
PKG_LICENSE="$(get_mk_value "PKG_LICENSE")"
PKG_MAINTAINER="$(get_mk_value "PKG_MAINTAINER")"
PKG_URL="$(get_mk_value "PKG_URL")"
PKG_DESCRIPTION="$(get_mk_value "PKG_DESCRIPTION")"
[ -n "$PKG_DESCRIPTION" ] || PKG_DESCRIPTION="$(get_mk_value "LUCI_TITLE")"
[ -n "$PKG_DESCRIPTION" ] || PKG_DESCRIPTION="$PKG_NAME"
[ -n "$PKG_ARCH" ] || PKG_ARCH="noarch"

[ -n "$PKG_NAME" ] || { echo "error: PKG_NAME missing in $MAKEFILE" >&2; exit 1; }
[ -n "$PKG_VERSION" ] || { echo "error: PKG_VERSION missing in $MAKEFILE" >&2; exit 1; }

VERSION="$PKG_VERSION"
[ -n "$PKG_RELEASE" ] && VERSION="${PKG_VERSION}-r${PKG_RELEASE}"

# Assets that do not belong under root/: "source=destination" pairs.
ASSETS="$(get_mk_value "PKG_ASSETS")"

CONFFILES="$(get_mk_list "PKG_CONFFILES")"

# The LuCI translations live in po/<locale>/<package>.po and become separate
# packages, named the way LuCI looks them up: luci-i18n-<app>-<locale>, with
# the .lmo file named after the app without the luci-app- prefix.
APP_ID="${PKG_NAME#luci-app-}"
locale_for() {
	case "$1" in
		zh_Hans) echo "zh-cn" ;;
		zh_Hant) echo "zh-tw" ;;
		*) echo "$(echo "$1" | tr '[:upper:]_' '[:lower:]-')" ;;
	esac
}

# A package that is not architecture independent carries the architecture in
# its file name, the way the OpenWrt feeds name their packages.
OUT_NAME="${PKG_NAME}-${VERSION}"
[ "$PKG_ARCH" = "noarch" ] || OUT_NAME="${OUT_NAME}-${PKG_ARCH}"

echo "Building $PKG_NAME $VERSION (arch=$PKG_ARCH)"
[ -n "$DEPENDS" ] && echo "  depends: $DEPENDS"

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

STAGE="$TEMP_DIR/$PKG_NAME"
mkdir -p "$STAGE/lib/apk/packages/"

if [ -d "$PKG_DIR/root" ] && [ -n "$(ls -A "$PKG_DIR/root" 2>/dev/null)" ]; then
	cp -a "$PKG_DIR/root/." "$STAGE/"
fi
if [ -d "$PKG_DIR/htdocs" ] && [ -n "$(ls -A "$PKG_DIR/htdocs" 2>/dev/null)" ]; then
	mkdir -p "$STAGE/www"
	cp -a "$PKG_DIR/htdocs/." "$STAGE/www/"
fi
if [ -n "$ASSETS" ]; then
	# The asset directory follows the architecture when the workflow builds
	# several of them from one tree.
	ASSET_ROOT="${PKG_ASSET_DIR:-assets}"
	for pair in $ASSETS; do
		src="${pair%%=*}"
		src="$ASSET_ROOT/${src#assets/}"
		dst="${pair#*=}"
		[ -e "$PKG_DIR/$src" ] || { echo "error: asset $src missing in $PKG_DIR" >&2; exit 1; }
		mkdir -p "$STAGE/$(dirname "$dst")"
		cp -a "$PKG_DIR/$src" "$STAGE/$dst"
	done
fi

# dae refuses to read a configuration file that the group can write or that
# others can read, and the init script has to stay executable.
find "$STAGE/etc/init.d" -type f -exec chmod 0755 {} + 2>/dev/null || true
find "$STAGE/etc/dae" -type f -exec chmod 0600 {} + 2>/dev/null || true
find "$STAGE/etc/config" -type f -exec chmod 0600 {} + 2>/dev/null || true
# The rpcd backend is a program rpcd runs, so it has to stay executable.
find "$STAGE/usr/libexec/rpcd" -type f -exec chmod 0755 {} + 2>/dev/null || true

# The files belong to root on the device. Under fakeroot (which the workflow
# uses) the chown is recorded as root; without it the command fails and the
# staging tree keeps its current owner.
chown -R 0:0 "$STAGE" 2>/dev/null || true

# The file list apk keeps for the package. The type list is spelled out
# instead of "find -type f,l": the comma form is a GNU extension and the BSD
# find of macOS silently drops the symlinks from the list.
(cd "$STAGE" && find . \( -type f -o -type l \) | sed 's|^\./||' | sed 's|^|/|' | sort) > "$TEMP_DIR/$PKG_NAME.list"
mv "$TEMP_DIR/$PKG_NAME.list" "$STAGE/lib/apk/packages/$PKG_NAME.list"

if [ -n "$CONFFILES" ]; then
	printf '%s\n' "$CONFFILES" > "$STAGE/lib/apk/packages/$PKG_NAME.conffiles"
	: > "$STAGE/lib/apk/packages/$PKG_NAME.conffiles_static"
	while IFS= read -r file; do
		[ -f "$STAGE/$file" ] || continue
		csum="$(sha256_of "$STAGE/$file")"
		echo "$file $csum" >> "$STAGE/lib/apk/packages/$PKG_NAME.conffiles_static"
	done < "$STAGE/lib/apk/packages/$PKG_NAME.conffiles"
fi

cat > "$TEMP_DIR/post-install" <<-EOF
	#!/bin/sh
	[ "\${IPKG_NO_SCRIPT}" = "1" ] && exit 0
	[ -s \${IPKG_INSTROOT}/lib/functions.sh ] || exit 0
	. \${IPKG_INSTROOT}/lib/functions.sh
	export root="\${IPKG_INSTROOT}"
	export pkgname="$PKG_NAME"
	default_postinst
	[ -n "\${IPKG_INSTROOT}" ] || {
		rm -f /tmp/luci-indexcache.*
		rm -rf /tmp/luci-modulecache/
		# The LuCI menu is read by rpcd, so its cache has to go and
		# rpcd has to pick the new menu and the new ACLs up.
		/etc/init.d/rpcd reload 2>/dev/null
		/etc/init.d/uhttpd restart 2>/dev/null
		# The dae service is disabled by default; restart it only when
		# the operator has enabled it.
		[ -x /etc/init.d/dae ] && [ "\$(uci -q get dae.main.enabled)" = "1" ] && /etc/init.d/dae restart
		# An upgrade replaces the init script, and the boot links belong to
		# the script that was just overwritten. Without this, a service that
		# the operator had enabled comes back disabled after a reboot: the
		# rc.d links are gone, nothing starts the daemon, and the LAN ends up
		# without a proxy until somebody notices.
		if [ -x /etc/init.d/dae ] && [ "\$(uci -q get dae.main.enabled)" = "1" ]; then
			/etc/init.d/dae enable 2>/dev/null
		fi
		exit 0
	}
EOF

cat > "$TEMP_DIR/pre-deinstall" <<-EOF
	#!/bin/sh
	[ -s \${IPKG_INSTROOT}/lib/functions.sh ] || exit 0
	. \${IPKG_INSTROOT}/lib/functions.sh
	export root="\${IPKG_INSTROOT}"
	export pkgname="$PKG_NAME"
	default_prerm
EOF

apk mkpkg \
	--info "name:$PKG_NAME" \
	--info "version:$VERSION" \
	--info "description:$PKG_DESCRIPTION" \
	--info "arch:$PKG_ARCH" \
	--info "origin:$PKG_NAME" \
	--info "maintainer:${PKG_MAINTAINER:-unspecified}" \
	--info "license:${PKG_LICENSE:-unknown}" \
	--info "url:${PKG_URL:-}" \
	${DEPENDS:+--info "depends:libc $DEPENDS"} \
	--script "post-install:$TEMP_DIR/post-install" \
	--script "pre-deinstall:$TEMP_DIR/pre-deinstall" \
	--files "$STAGE" \
	--output "$OUT_DIR/${OUT_NAME}.apk"

echo "  -> $OUT_DIR/${OUT_NAME}.apk"

# ---- the translations -------------------------------------------------------
if [ -d "$PKG_DIR/po" ]; then
	for podir in "$PKG_DIR"/po/*/; do
		[ -d "$podir" ] || continue
		lang_dir="$(basename "$podir")"
		pofile="$podir$PKG_NAME.po"
		[ -f "$pofile" ] || pofile="$podir$APP_ID.po"
		[ -f "$pofile" ] || continue

		locale="$(locale_for "$lang_dir")"
		lmo_name="$APP_ID.$locale.lmo"

		if ! command -v po2lmo >/dev/null 2>&1; then
			echo "error: po2lmo is not installed; the $lang_dir translation needs it" >&2
			exit 1
		fi
		po2lmo "$pofile" "$TEMP_DIR/$lmo_name"

		i18n_name="luci-i18n-${APP_ID}-${locale}"
		i18n_dir="$TEMP_DIR/$i18n_name"
		mkdir -p "$i18n_dir/usr/lib/lua/luci/i18n/"
		mkdir -p "$i18n_dir/lib/apk/packages/"
		cp "$TEMP_DIR/$lmo_name" "$i18n_dir/usr/lib/lua/luci/i18n/"

		(cd "$i18n_dir" && find . \( -type f -o -type l \) | sed 's|^\./||' | sed 's|^|/|' | sort) > "$TEMP_DIR/$i18n_name.list"
		mv "$TEMP_DIR/$i18n_name.list" "$i18n_dir/lib/apk/packages/$i18n_name.list"

		apk mkpkg \
			--info "name:$i18n_name" \
			--info "version:$VERSION" \
			--info "description:$PKG_DESCRIPTION ($locale translation)" \
			--info "arch:noarch" \
			--info "origin:$PKG_NAME" \
			--info "maintainer:${PKG_MAINTAINER:-unspecified}" \
			--info "depends:$PKG_NAME" \
			--files "$i18n_dir" \
			--output "$OUT_DIR/${i18n_name}-${VERSION}.apk"

		echo "  -> $OUT_DIR/${i18n_name}-${VERSION}.apk"
	done
else
	echo "note: no po/ directory -- skipping the translation packages"
fi

