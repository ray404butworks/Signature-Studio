# 免费商用静态字体库

字体库在 Phase 02 的注册/加载机制上增量维护。当前界面、静态绘制、TYX 笔迹、情侣、时间轴与 MP4 业务流程均不另建一套。

## 添加一款字体

1. 在官方仓库确认实际字体文件与许可，固定来源提交，记录字体及许可 SHA-256。核对商业使用、网页嵌入、Android 内置与重新分发，并检查保留字体名称。不可仅凭第三方“免费商用”标签入库。
2. 在 `assets/fonts/static-sources.json` 增加一条配置：`id`、`name`、`displayName`、`language`、`style`、`styleLabel`、`family`、`sampleText`、`fallback`、`format`、`license`、`source`、`sourceSha256`、`licenseSource`、`licenseSha256`、`copyright`、`commit`。`family` 是衍生资源的独立内部名称，不使用上游保留名称。
3. 使用原有制备工具生成/校验资源：

   ```text
   python scripts/prepare-fonts.py <G盘源文件缓存目录> assets/fonts/static-sources.json
   ```

   构建工具为 fonttools 4.68.0 和 brotli 1.2.1，不属于网页运行依赖。缺少的源文件从配置的固定 GitHub URL 获取并核对哈希。既有 WOFF2 哈希匹配时复用，不重复转换；只有明确需要重制时才传入 `--rebuild`。
4. 运行类型检查、测试、构建，并在浏览器检查新字体的中文/英文姓名、混排、失败回退、连续切换和已有动态功能。审查新增资源体积与初次选择耗时。

正常添加字体不需要修改 React 组件、Canvas 渲染器、验证器或导出器。现有制备工具只接受已核查的 OFL 1.1 字体，其他许可需先单独评估，不可修改许可标记冒充 OFL。

## 生成物与运行时

- `public/fonts/catalog.json`：轻量注册表，由源配置生成；保留中文显示名称、实际语言支持、风格、WOFF2 路径、许可及来源、预览文本、回退、权限、文件哈希与字节数。
- `public/fonts/<id>/font.woff2`：完整上游字符集合，变量字体固定 400 字重。
- `sample.woff2`：选择器专用字样，仅包含“林雨晴”或“Vivian”，不用于姓名绘制。
- `coverage.json`：完整 cmap 字符集合，随所选字体加载，不再打进首屏 JavaScript。
- `OFL.txt` / `NOTICE.txt`：许可原文、源版权元数据、固定来源与转换说明，随构建分发。

完整字体、覆盖表分别使用共享 Promise 去重；打开选择器只加载小型字样，不下载所有完整字体。英文艺术字体缺少汉字时按注册配置加载 Ma Shan Zheng，其他字符继续使用系统回退。加载失败或超时恢复系统字体；异步切换仍由现有预览组件防止旧结果覆盖新选择。

完整 WOFF2 转换后会核对 cmap 不变，并检查林雨晴、陈思远、张晓月或 Vivian、Alexander。中文大字库不在本阶段做姓名字符裁剪。未来若采用 Unicode 分包，必须覆盖常用姓名及生僻姓氏回退，不能把菜单小样当作完整字库。

## 新增字体的许可来源

| 字体 | 官方来源与许可 | 核查说明 |
| --- | --- | --- |
| LXGW WenKai（霞鹜文楷） | [作者仓库](https://github.com/lxgw/LxgwWenKai)、[OFL](https://github.com/lxgw/LxgwWenKai/blob/8afc526476c2811e2e90e765444e7a6e4a7ecf77/OFL.txt) | 使用原版 Regular；保留 LXGW 与 Klee 双方版权及附加许可。衍生内部名称 `Signature Studio WK`，不依赖其限定场景的保留名称额外授权 |
| Noto Serif SC | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/notoserifsc/OFL.txt) | 同时保留许可文件内 Google 版权及实际字体内 Adobe 版权记录；不将其误称为完整思源宋体全家族 |
| ZCOOL XiaoWei（站酷小薇体） | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/zcoolxiaowei/OFL.txt) | 保留项目版权及来源 |
| Sacramento | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/sacramento/OFL.txt) | 有保留名称 Sacramento；衍生内部名称 `Signature Studio SM` |
| Great Vibes | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/greatvibes/OFL.txt) | 同时保留 OFL 与字体文件中各自的版权年份记录，不擅自统一改写 |
| Allura | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/allura/OFL.txt) | 保留项目版权及来源 |

六款均为 SIL OFL 1.1，允许商业使用、网页嵌入及随 Android 软件内置和重新分发。条件是保留版权与许可、字体本身继续按 OFL 分发、不得将字体单独出售，修改版本遵守保留名称限制。已检查六个原始文件的 OS/2 `fsType` 均为 0；同时保存原始字体版权及许可元数据核查记录。没有替换用户指定字体。

Google Fonts 固定提交：`c30b221beb0c1da59d563feb91ec8656a1fa972a`；霞鹜文楷固定提交：`8afc526476c2811e2e90e765444e7a6e4a7ecf77`。哈希及完整文件地址见注册表。

OFL 适用于字体资源，不要求本应用代码采用 OFL。字体字形与真实笔画数据仍严格分开；本阶段不增加普通字体动画或导出能力。
