# luci-app-dae

**dae** 内核 + **doona** 面板的 OpenWrt / ImmortalWrt 软件包。

仓库提供三个包：

| 包 | 内容 |
|---|---|
| `dae` | 守护进程，来自 [szwjp/dae](https://github.com/szwjp/dae) fork（分支 `feat/dae-native-api`），带 native HTTP 控制面，以及针对 [daeuniverse/api-standardize](https://github.com/daeuniverse/api-standardize) 契约的三处修复。 |
| `luci-app-dae` | doona 面板，来自 [szwjp/doona](https://github.com/szwjp/doona) fork（分支 `feat/dae-native-api`），含 dae 引擎适配器；LuCI 菜单项用来打开面板。 |
| `luci-i18n-dae-zh-cn` / `luci-i18n-dae-zh-tw` | LuCI 页面的简体中文 / 繁体中文翻译。 |

面板通过契约与 dae 通信，同一套面板既能驱动 dae 也能驱动 honk。面板本身由 dae
托管：静态文件与 API 都由内核提供。

## 安装

软件包以 `.apk` 形式发布在 [Releases 页面](https://github.com/szwjp/luci-app-dae/releases)。
守护进程按架构分发，按设备选对应的一个：

| 设备架构 | 包 |
|---|---|
| x86_64 | `dae-2026.11.01-r5-x86_64.apk` |
| arm64 | `dae-2026.11.01-r5-aarch64_generic.apk` |
| riscv64 | `dae-2026.11.01-r5-riscv64_generic.apk` |

```sh
apk add --allow-untrusted \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r05/dae-2026.11.01-r5-x86_64.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r05/luci-app-dae-2026.11.01-r2.apk
```

可选的 LuCI 翻译包（界面语言随浏览器 `Accept-Language` 走）：

```sh
apk add --allow-untrusted \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r05/luci-i18n-dae-zh-cn-2026.11.01-r2.apk
```

服务**默认禁用**。先按设备改好配置再启用：`/etc/dae/config.dae` 是入口文件，模块放在
`/etc/dae/config.d/`，LAN/WAN 接口在 `/etc/dae/config.d/global.dae` 里指定。

```sh
uci set dae.main.enabled=1
uci commit dae
/etc/init.d/dae start
```

API 监听地址与密钥放在 UCI 里，不写进配置文件。首次启动时服务会自动生成一个
密钥并写回：

```sh
uci get dae.main.api_secret
```

面板打开时会要求输入这个密钥，之后由浏览器记住。

| UCI 选项 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `0` | 是否启用服务 |
| `config_file` | `/etc/dae/config.dae` | 运行的配置文件 |
| `api_listen` | `0.0.0.0:9527` | native API 监听地址 |
| `api_secret` | 首次启动自动生成 | API 的 Bearer 令牌 |
| `api_write` | `0` | 允许面板通过 API 写配置 |
| `ui_path` | `/usr/share/dae/doona` | 面板所在目录 |

## 面板

* LuCI 入口：*服务 → dae*，页面内以 frame 方式打开面板。
* 直接访问：`http://<路由器地址>:9527/ui/`。

面板要改配置需要打开 `api_write`：

```sh
uci set dae.main.api_write=1 && uci commit dae && /etc/init.d/dae restart
```

## 架构

`dae` 包发布的是预编译二进制，所以每个架构一个包：x86_64、arm64、riscv64。
二进制来自 [szwjp/dae](https://github.com/szwjp/dae/releases/tag/v2026.11.01-nativeapi-r3)
的发布产物，CI 只负责取下来重新打包，不重复编译。
面板包与翻译包是纯静态构建，各架构通用。

riscv64 的二进制按 RISC-V 2023 profile（rva23u64）构建，若设备内核太老跑不起来，
需要换用上游的其它 profile 或自行编译。

eBPF 程序需要内核带 BTF。ImmortalWrt 与 OpenWrt 24.10+ 的内核自带
（`/sys/kernel/btf/vmlinux`）；更老的内核需要先装 `vmlinux-btf` 包。

## 构建

软件包用 `apk-tools` 直接打包，不走 OpenWrt SDK：`.github/build-pkg.sh` 组装
staging 目录，`apk mkpkg` 写出容器格式。

```sh
fakeroot bash .github/build-pkg.sh dae
fakeroot bash .github/build-pkg.sh luci-app-dae
```

`dae/assets/` 下的二进制与 `luci-app-dae/assets/` 下的面板都是预编译产物；
它们的构建方法见工作区的
[方案文档](https://github.com/szwjp/dae-doona/blob/main/docs/PLAN-dae-doona.md)。

## 许可

* `dae`：AGPL-3.0-only
* `luci-app-dae`（doona）：GPL-3.0-only

AGPL 与 GPL 兼容。两个包是各自独立的程序，通过 HTTP 通信。
