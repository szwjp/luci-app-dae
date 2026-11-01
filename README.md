# luci-app-dae

OpenWrt / ImmortalWrt packages for the **dae** engine with the **doona** web panel.

Two packages:

| Package | What it is |
|---|---|
| `dae` | The daemon, built from the [szwjp/dae](https://github.com/szwjp/dae) fork (branch `feat/dae-native-api`). It carries the native HTTP control plane and three fixes against the [daeuniverse/api-standardize](https://github.com/daeuniverse/api-standardize) contract. |
| `luci-app-dae` | The doona panel, built from the [szwjp/doona](https://github.com/szwjp/doona) fork (branch `feat/dae-native-api`), with the dae engine adapter. The LuCI entry opens the panel. |

The panel talks to dae over the contract, so the same panel serves both dae and
honk. The daemon serves the panel itself: it hosts the static files and
answers the API.

## Install

Packages are published as `.apk` on the [releases page](https://github.com/szwjp/luci-app-dae/releases).

```sh
apk add --allow-untrusted \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r03/dae-2026.11.01-r3.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r03/luci-app-dae-2026.11.01-r1.apk
```

The service is **disabled by default**. Adapt the configuration to the device
first: `/etc/dae/config.dae` is the entry file, the modules live in
`/etc/dae/config.d/`, and `/etc/dae/config.d/global.dae` names the LAN and WAN
interfaces.

```sh
uci set dae.main.enabled=1
uci commit dae
/etc/init.d/dae start
```

The API listener and its secret live in UCI, not in the configuration file.
On the first start the service generates a secret and writes it back:

```sh
uci get dae.main.api_secret
```

The panel asks for that secret when it opens. It is then kept in the browser.

| UCI option | Default | Meaning |
|---|---|---|
| `enabled` | `0` | Whether the service starts |
| `config_file` | `/etc/dae/config.dae` | The configuration file to run |
| `api_listen` | `0.0.0.0:9527` | The native API listener |
| `api_secret` | generated | Bearer token for the API |
| `api_write` | `0` | Allow the panel to write configuration through the API |
| `ui_path` | `/usr/share/dae/doona` | Where the panel is served from |

## The panel

* Service page: *Services → dae* in LuCI, which opens the panel in a frame.
* Direct: `http://<router-address>:9527/ui/`.

The panel needs `api_write` to change the configuration. Turn it on with
`uci set dae.main.api_write=1 && uci commit dae && /etc/init.d/dae restart`.

## Architecture

The `dae` package ships a prebuilt binary, so the release carries one
architecture per build: **x86_64** at the moment. The panel package is a static
build and the same on every architecture.

A kernel with BTF is required for the eBPF programs. ImmortalWrt and OpenWrt
24.10+ ship one (`/sys/kernel/btf/vmlinux`); an older kernel needs the
`vmlinux-btf` package installed.

## Building

The packages are built with `apk-tools` directly, not with an OpenWrt SDK.
`.github/build-pkg.sh` assembles the staging tree and `apk mkpkg` writes the
container.

```sh
fakeroot bash .github/build-pkg.sh dae
fakeroot bash .github/build-pkg.sh luci-app-dae
```

The binaries under `dae/assets/` and the panel under `luci-app-dae/assets/`
are prebuilt artifacts; see the [plan document](../blob/main/docs/PLAN-dae-doona.md)
in the workspace for how they are produced.

## License

* `dae`: AGPL-3.0-only
* `luci-app-dae` (doona): GPL-3.0-only

AGPL and GPL are compatible. The two packages are separate programs that talk
over HTTP.
