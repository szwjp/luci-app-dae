# luci-app-dae

**dae** 内核 + **doona** 面板的 OpenWrt / ImmortalWrt 软件包。

仓库提供三个包：

| 包 | 内容 |
|---|---|
| `dae` | 守护进程，来自 [szwjp/dae](https://github.com/szwjp/dae) fork（分支 `feat/dae-native-api`），带 native HTTP 控制面，以及针对 [daeuniverse/api-standardize](https://github.com/daeuniverse/api-standardize) 契约的三处修复。 |
| `luci-app-dae` | doona 面板，来自 [szwjp/doona](https://github.com/szwjp/doona) fork（分支 `feat/dae-native-api`），含 dae 引擎适配器；LuCI 页面显示服务状态并打开面板。 |
| `luci-i18n-dae-zh-cn` / `luci-i18n-dae-zh-tw` | LuCI 页面的简体中文 / 繁体中文翻译。 |

面板通过契约与 dae 通信，同一套面板既能驱动 dae 也能驱动 honk。面板本身由 dae
托管：静态文件与 API 都由内核提供。

## 安装

软件包以 `.apk` 形式发布在 [Releases 页面](https://github.com/szwjp/luci-app-dae/releases)。
守护进程按架构分发，按设备选对应的一个：

| 设备架构 | 包 |
|---|---|
| x86_64 | `dae-2026.11.01-r8-x86_64.apk` |
| arm64 | `dae-2026.11.01-r8-aarch64_generic.apk` |
| riscv64 | `dae-2026.11.01-r8-riscv64_generic.apk` |

```sh
apk add --allow-untrusted \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r08/dae-2026.11.01-r8-x86_64.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r08/luci-app-dae-2026.11.01-r5.apk
```

可选的 LuCI 翻译包（界面语言随浏览器 `Accept-Language` 走）：

```sh
apk add --allow-untrusted \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.01-r08/luci-i18n-dae-zh-cn-2026.11.01-r5.apk
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

面板首次打开时会要求填写 API 地址和这个密钥，之后由浏览器记住。LuCI 页面
（*服务 → dae → 面板*）会显示面板地址与密钥，可以直接复制过去。

| UCI 选项 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `0` | 是否启用服务 |
| `config_file` | `/etc/dae/config.dae` | 运行的配置文件 |
| `api_listen` | `0.0.0.0:9527` | native API 监听地址 |
| `api_secret` | 首次启动自动生成 | API 的 Bearer 令牌 |
| `api_write` | `0` | 允许面板通过 API 写配置 |
| `ui_path` | `/usr/share/dae/doona` | 面板所在目录 |

`api_listen` 必须是**数值地址加端口**（`0.0.0.0:9527`、`192.168.1.1:9527`）。
`localhost` 会被改写成 `127.0.0.1`，其它主机名不接受——dae 自己要求数值地址，
写成名字时它会拒绝启动。监听回环地址时面板只在本机可用。

## 面板

* LuCI 入口：*服务 → dae → 面板*。页面显示服务状态、监听地址与 API 密钥，
  并在新标签页里打开面板。
* 直接访问：`http://<路由器地址>:9527/ui/`。

面板要改配置需要打开 `api_write`：

```sh
uci set dae.main.api_write=1 && uci commit dae && /etc/init.d/dae restart
```

## 架构

`dae` 包发布的是预编译二进制，所以每个架构一个包：x86_64、arm64、riscv64。
二进制来自 [szwjp/dae](https://github.com/szwjp/dae/releases/tag/v2026.11.01-nativeapi-r3)
的发布产物，CI 取下来校验摘要后重新打包，不重复编译。
面板包与翻译包是纯静态构建，各架构通用。

riscv64 的二进制按 RISC-V 2023 profile（rva23u64）构建，若设备内核太老跑不起来，
需要换用上游的其它 profile 或自行编译。

eBPF 程序需要内核带 BTF。ImmortalWrt 与 OpenWrt 24.10+ 的内核自带
（`/sys/kernel/btf/vmlinux`）；更老的内核需要先装 `vmlinux-btf` 包。

### 接口配置

`/etc/dae/config.d/global.dae` 里的两个接口按设备形态填：

* `lan_interface`：客户端所在的网桥，OpenWrt 默认是 `br-lan`。
* `wan_interface`：出方向流量离开的网卡。默认写 `auto`，由 dae 按默认路由解析，
  多网口路由器不用改；**单网口设备**（唯一那个口就是 LAN 口，没有 WAN 口）
  要把它留空，否则出方向流量会和 LAN 侧撞在一起。

## 构建

软件包用 `apk-tools` 直接打包，不走 OpenWrt SDK：`.github/build-pkg.sh` 组装
staging 目录，`apk mkpkg` 写出容器格式。

守护进程二进制**不在本仓库里**，构建前从引擎发布取：

```sh
DAE_TAG=v2026.11.01-nativeapi-r3
curl -fsSL -o dae.tar.xz \
  "https://github.com/szwjp/dae/releases/download/$DAE_TAG/dae-linux-x86_64.tar.xz"
tar -xJf dae.tar.xz
mkdir -p dae/assets/x86_64
install -m0755 usr/bin/dae dae/assets/x86_64/dae
```

然后打包（`PKG_ASSET_DIR` 指向取下来的那一份）：

```sh
PKG_ASSET_DIR=assets/x86_64 PKG_ARCH_OVERRIDE=x86_64 \
  fakeroot bash .github/build-pkg.sh dae
fakeroot bash .github/build-pkg.sh luci-app-dae
```

面板包与翻译包是预编译产物；它们的构建方法见工作区的
[方案文档](https://github.com/szwjp/dae-doona/blob/main/docs/PLAN-dae-doona.md)。

## 许可

* `dae`：AGPL-3.0-only
* `luci-app-dae`（doona）：GPL-3.0-only

AGPL 与 GPL 兼容。两个包是各自独立的程序，通过 HTTP 通信。
