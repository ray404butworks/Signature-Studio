# 第三方许可

## 扩展字体（Phase 03）

新增 LXGW WenKai、Noto Serif SC、ZCOOL XiaoWei、Sacramento、Great Vibes、Allura，均为 SIL OFL 1.1。霞鹜文楷来自作者 `lxgw/LxgwWenKai` 官方仓库，其余来自 Google Fonts 官方仓库。精确提交、原始/衍生哈希、字体内版权及许可文件见 `assets/fonts/static-sources.json` 和 `public/fonts/catalog.json`，逐款说明见 [FONT_LIBRARY.md](FONT_LIBRARY.md)。

字体可商用、网页嵌入并随 Android App 内置/重新分发，须保留版权与 OFL，字体本身仍按 OFL 分发，不得单独出售。LXGW 与 Sacramento 的保留名称均避开，衍生内部名称分别为 `Signature Studio WK` 与 `Signature Studio SM`。保留霞鹜文楷的 Klee 来源版权和附加许可原文，同时保留 Noto/Great Vibes 等字体文件与许可中不同的版权记录。所有字体保留原字符覆盖；菜单字样子集只作选项预览。

## 静态签名字体（Phase 02）

Ma Shan Zheng、Long Cang、Zhi Mang Xing、Caveat、Dancing Script、Pacifico 来自 Google Fonts 官方仓库，均为 SIL OFL 1.1。各字体的 `OFL.txt` 和 `NOTICE.txt` 位于 `public/fonts/<id>/`，会随网站构建一同分发。精确来源提交、原文件 SHA-256、衍生文件 SHA-256、版权声明见 `public/fonts/catalog.json`。

WOFF2 为本项目转换的衍生版本；变量字体固定为 400 字重。完整字体保留上游 cmap 字符集合；选择器另用仅含“林雨晴”或“Vivian”的小型子集。所有衍生字体使用独立内部名称，Dancing Script 改为 `Signature Studio DS`（样本为 `Signature Studio DS Sample`），避免使用其 Reserved Font Name 作为修改版本的主字体名。界面显示原字体名称用于说明来源。

OFL 允许商业使用、网页嵌入及随 Android App 内置/分发。分发时须保留版权与 OFL 原文，字体仍按 OFL 发布，不可将字体单独出售；保留名称限制同样适用于未来转换或子集。构建工具与复现方式见 `PHASE02.md`。

本项目使用下列运行时组件和界面资产。各组件保留其原有版权和许可，项目 MIT 许可不替代第三方内容的权利。

| 组件 | 许可 | 许可全文 |
| --- | --- | --- |
| React / React DOM / Scheduler | MIT | [React](public/licenses/React-MIT.txt)、[React DOM 与 Scheduler](public/licenses/React-DOM-MIT.txt) |
| Zod | MIT | [Zod](public/licenses/Zod-MIT.txt) |
| Mediabunny 1.56.1 | MPL-2.0 | [Mediabunny](public/licenses/Mediabunny-MPL-2.0.txt) |
| Geist Sans 可变字体（geist 1.9.2） | SIL OFL 1.1 | [Geist](licenses/Geist-OFL-1.1.txt) |
| Phosphor Icons 2.1.1，regular | MIT | [Phosphor Icons](licenses/Phosphor-Icons-MIT.txt) |

Mediabunny 的对应源码可从 [1.56.1 源码包](https://registry.npmjs.org/mediabunny/-/mediabunny-1.56.1.tgz) 取得，适用 MPL-2.0。

上游来源：[React](https://github.com/facebook/react)、[Zod](https://github.com/colinhacks/zod)、[Mediabunny](https://github.com/Vanilagy/mediabunny)、[Geist](https://github.com/vercel/geist-font)、[Phosphor Icons](https://github.com/phosphor-icons/core)。

网站分发包携带相同的运行时许可和署名。开发工具的许可随对应 npm 包提供。
