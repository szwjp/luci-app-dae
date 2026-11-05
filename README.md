# luci-app-dae

**dae** 内核 + **doona** 面板的 OpenWrt / ImmortalWrt 软件包。

仓库提供三个包：

| 包 | 内容 |
|---|---|
| `dae` | 守护进程，来自 [szwjp/dae](https://github.com/szwjp/dae) fork（分支 `feat/dae-native-api`），带 native HTTP 控制面，以及针对 [daeuniverse/api-standardize](https://github.com/daeuniverse/api-standardize) 契约的三处修复。 |
| `luci-app-dae` | doona 面板，来自 [szwjp/doona](https://github.com/szwjp/doona) fork（分支 `main`），含 dae 引擎适配器与上游面板更新；LuCI 页面显示服务状态并打开面板。 |
| `luci-i18n-dae-zh-cn` / `luci-i18n-dae-zh-tw` | LuCI 页面的简体中文 / 繁体中文翻译。 |

面板通过契约与 dae 通信，同一套面板既能驱动 dae 也能驱动 honk。面板本身由 dae
托管：静态文件与 API 都由内核提供。

## 安装

软件包以 `.apk` 形式发布在 [Releases 页面](https://github.com/szwjp/luci-app-dae/releases)。
守护进程按架构分发，按设备选对应的一个：

| 设备架构 | 包 |
|---|---|
| x86_64 | `dae-2026.11.02-r11-x86_64.apk` |
| arm64 | `dae-2026.11.02-r11-aarch64_generic.apk` |
| riscv64 | `dae-2026.11.02-r11-riscv64_generic.apk` |

OpenWrt / ImmortalWrt 的 apk v3 只认本地文件，不接受 URL，所以先把包下载下来再装：

```sh
cd /tmp
wget -O dae.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.02-r11/dae-2026.11.02-r11-x86_64.apk
wget -O luci-app-dae.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.02-r11/luci-app-dae-2026.11.02-r10.apk
apk add --allow-untrusted ./dae.apk ./luci-app-dae.apk
```

可选的 LuCI 翻译包（界面语言随浏览器 `Accept-Language` 走）：

```sh
cd /tmp
wget -O luci-i18n-dae-zh-cn.apk \
  https://github.com/szwjp/luci-app-dae/releases/download/v2026.11.02-r11/luci-i18n-dae-zh-cn-2026.11.02-r10.apk
apk add --allow-untrusted ./luci-i18n-dae-zh-cn.apk
```

服务**默认禁用**。先按设备改好配置再启用：`/etc/dae/config.dae` 是入口文件，模块放在
`/etc/dae/config.d/`，LAN/WAN 接口在 `/etc/dae/config.d/global.dae` 里指定。

```sh
uci set dae.main.enabled=1
uci commit dae
/etc/init.d/dae start
```

也可以直接在 LuCI 页面上点「启动」，它会一并把 `enabled` 置为 1 并启动服务。

API 监听地址与密钥放在 UCI 里，不写进配置文件。首次成功启动时服务会自动生成一个
密钥并写回：

```sh
uci get dae.main.api_secret
```

注意：**密钥只在服务真正启动时生成**。`enabled=0` 时启动会被拒绝，也就不会生成，
所以不要用「重启服务」来解决密钥缺失，先把服务启用。

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
| `lan_interface` | 空 | 覆盖 LAN 接口名，默认从 `config.d/global.dae` 读取 |
| `geo_update` | `1` | 是否每周自动更新地理数据文件 |
| `geo_update_cron` | `0 2 * * 1` | 自动更新的时间（分 时 日 月 周） |

`api_listen` 必须是**数值地址加端口**（`0.0.0.0:9527`、`192.168.1.1:9527`）。
`localhost` 会被改写成 `127.0.0.1`，其它主机名不接受——dae 自己要求数值地址，
写成名字时它会拒绝启动。监听回环地址时面板只在本机可用。

### 地理数据自动更新

规则里 `geosite:` 与 `geoip:` 用到的数据文件是 `v2ray-geoip` / `v2ray-geosite`
两个包装的 `geoip.dat` 与 `geosite.dat`，位于 `/usr/share/v2ray`。软件包会每周
一凌晨两点自动更新它们，来源固定为：

```
https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat
https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat
```

更新脚本是 `/usr/bin/dae-geo-update`，cron 条目由 `/etc/init.d/dae-geo-update`
维护（它排在 `cron` 之前启动，因为 crond 在 crontabs 目录为空时不会起来）。
手动跑一次：

```sh
/usr/bin/dae-geo-update
```

时间可以改：

```sh
uci set dae.main.geo_update_cron='30 4 * * 0'
uci commit dae
/etc/init.d/dae-geo-update restart
```

关掉自动更新（会把 cron 条目一并撤掉）：

```sh
uci set dae.main.geo_update=0
uci commit dae
/etc/init.d/dae-geo-update start
```

几点行为值得知道：

* 下载必须带 Range 头。同一个文件同一个节点，普通 GET 实测只有 16KB/s，显式
  Range 是 MB/s 级别；脚本首次下载一律用显式 Range，续传才用 `curl -C -`。
* 完整性靠上游同目录的 `<file>.sha256sum` 判定——CDN 的 `content-length` 和
  `content-range` 不可信。校验不过会重下，最多三轮，仍不过则按大小和文件头
  放行并在日志里记警告。
* 换文件后重启 dae（dae 只在启动时读地理数据，`reload` 不重新加载），并确认
  守护进程真的起来了；没起来就把旧文件放回去再重启一次，避免坏文件把代理
  整个打挂。
* 日志在 `/var/log/dae-geo-update.log`，同时进 syslog（`logread | grep
  dae-geo-update`）。`/var` 是 tmpfs，重启后日志不保留；要长期留档改脚本里的
  `LOGFILE` 常量。
* 上一版文件备份在 `/etc/dae/geo-backup/`。
* 这两个文件归 apk 包所有，`apk upgrade v2ray-geoip v2ray-geosite` 会用 feed
  里的版本覆盖它们；下一次自动更新会装回更新的版本。

### ICMP 重定向

dae 拒绝挂到会发送 ICMP 重定向的接口上，重定向会和 dae 装的规则打架。启动
脚本会在 dae 运行期间把 `all` 与 LAN 接口的 `send_redirects` 置 0，停止时按启动
前的值恢复，所以不用手工改 sysctl。LAN 接口名取自 UCI 的 `lan_interface`，没有
设置时从 `config.d/global.dae` 里读。

## 面板

* LuCI 入口：*服务 → dae → 面板*。页面显示服务状态、监听地址与 API 密钥，
  并在新标签页里打开面板。
* 监听地址可以直接在页面上改：填好地址和端口点"应用"，值写入
  `dae.main.api_listen`，服务随即重启让新地址生效；服务没在跑时只保存，
  下次启动生效。
* 直接访问：`http://<路由器地址>:9527/ui/`。
* 面板的「出站模式」（规则/直连/全局）写在含 `routing` 段的那个文件里，也就是
  `config.d/routing.dae`；入口文件 `config.dae` 只读，面板不会去改它。

LuCI 页面通过 rpcd 的 exec 后端读取状态。软件包安装后会自动 reload rpcd；
如果页面报"读取 dae 服务状态失败"，说明后端没被注册，执行
`/etc/init.d/rpcd reload` 即可。

面板要改配置需要打开 `api_write`：LuCI 页面上的「允许写入配置」开关就是它，
也可以用命令行开：

```sh
uci set dae.main.api_write=1 && uci commit dae && /etc/init.d/dae restart
```

### 启动项页面

服务在 LuCI 的*系统 → 启动项*里以 `99 dae` 出现，页面上的启用/禁用按钮就是
开机自启开关。

rpcd 读取 init 脚本时只看开头若干行里的 `USE_PROCD`、`START`、`STOP`，
所以这三行必须留在脚本的前 11 行内。写在后面的话，脚本不会出现在启动项
列表里，开机自启状态也会被报成未启用。

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
