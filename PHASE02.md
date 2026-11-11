# Phase 02 — 静态多字体签名预览

本阶段仅新增静态字体预览，保留原有 TYX Brush 动态笔迹。分支：`phase02/static-font-preview`；基线：`afe31602bef2adbac52834135755a9b9126b92f0`。不合并 main，不进行线上部署。

## 使用

在“签名 → 字体”中选择中文或英文静态字体，然后输入姓名。选项中显示真实字体字样。颜色、大小和画幅沿用原有设置；情侣模式可分别选择字体。字体与姓名随浏览器配置保存，并支持原有 JSON 导入/下载。

字体列表仍保留 TYX Brush 动态笔迹。若画面中有普通字体，整幅作品使用静态预览；其中 TYX 部分显示完成后的笔迹和装饰。全部活动签名切回 TYX 后，恢复原有动画、时间轴与 MP4 导出。普通字体没有笔画数据，不模拟逐笔书写；静态模式的 MP4 在界面与导出函数两层阻止。

静态字体不应用 TYX 的笔压、笔宽、矢量装饰与首尾变形，相关控件按能力隐藏或禁用。基础画布位置沿用已有配置；静态模式暂不提供自由拖动控件。

## 实现与文件清单

| 文件 | 内容 |
| --- | --- |
| `web/font-catalog.ts` | 读取集中注册表：ID、名称、语言、风格、资源、许可、回退和覆盖范围 |
| `public/fonts/catalog.json` | 六款字体的元数据、版权、固定来源提交、原/衍生文件 SHA-256、大小与字符范围 |
| `public/fonts/<id>/font.woff2` | 完整字符覆盖的本地字体（变量字体固定 400 字重） |
| `public/fonts/<id>/sample.woff2` | 字体选项专用小字样子集 |
| `public/fonts/<id>/OFL.txt`、`NOTICE.txt` | 原始许可、版权、来源与衍生修改说明，随构建分发 |
| `web/font-loader.ts` | FontFace 按需加载、共享请求、12 秒超时、失败回退、后续请求可重试 |
| `web/FontPicker.tsx` | 同一编辑器内的中英分组选择与真实字样预览 |
| `web/static-renderer.ts` | 独立 Canvas 静态绘制与实际字形边界测量；复用 TYX 完成帧用于混合情侣构图 |
| `web/StaticPreview.tsx` | 等待字体后重绘、处理异步切换竞争、保留上次完整画面、响应式画布 |
| `web/model.ts` | 静态姓名验证、字体持久化、v7→v8 配置兼容，保持动态英文验证 |
| `web/main.tsx` | 接入选择器与静态预览，保留原流程；静态导出禁用 |
| `web/export.ts` | 导出前拒绝含活动静态字体的配置，其余编码流程不变 |
| `web/style.css` | 小范围字体控件样式，沿用原色彩、卡片和布局 |
| `tests/web-fonts.test.ts` | 许可/资源哈希、姓名覆盖、混排回退、保存兼容、边界布局、加载去重与失败重试、导出保护 |
| `scripts/prepare-fonts.py`、`assets/fonts/static-sources.json` | 官方来源的字体转换和样本生成工具及固定源清单 |
| `THIRD_PARTY_NOTICES.md` | 新增字体授权与衍生名称说明 |

采用 Canvas 而非单独 DOM 签名：静态输出与现有画布使用同一设计像素、颜色和构图坐标，`renderStaticScene` 可供未来独立导出流程复用。当前并未实现静态字体导出。

## 字体来源与许可

六款字体来自 Google Fonts 官方仓库固定提交 `c30b221beb0c1da59d563feb91ec8656a1fa972a`：

- [Ma Shan Zheng](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/mashanzheng)
- [Long Cang](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/longcang)
- [Zhi Mang Xing](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/zhimangxing)
- [Caveat](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/caveat)
- [Dancing Script](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/dancingscript)
- [Pacifico](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/pacifico)

均为 SIL OFL 1.1，保留版权和许可，允许商用、网页嵌入、未来 Android 内置及随软件分发。不能单独出售字体。转换与子集均是衍生版本，使用独立内部字体名称；Dancing Script 使用 `Signature Studio DS`，避免使用其保留字体名称作为衍生主字体名。OFL 不要求应用代码改用 OFL。

## 性能、覆盖与失败处理

动态模式初始不请求六款静态字库。打开字体列表时加载约 16 KB 的六个字样子集；仅选择字体时加载完整字库。中文 WOFF2 约 2.3–3.2 MB，英文约 35–105 KB。请求在同一文档内共享，浏览器也可复用缓存。

完整字库转换前后检查 cmap 一致，本阶段不对姓名字库删字。字样子集只用于选项，不用于姓名显示。以后可评估按 Unicode 范围拆包；本阶段优先保留中文覆盖。

英文艺术字体缺少汉字时，按注册表加载 Ma Shan Zheng 作为汉字回退，英文仍使用所选字体；其他缺字交给系统 CJK/sans-serif 回退。已验证测试姓名；不承诺六款原字库或每台系统覆盖所有 Unicode/生僻字。加载失败或超时回到系统字体，显示一条简短状态；新字体加载完成后重新测量实际墨迹边界并自适应画布。异步切换不会让较早的结果覆盖较新的选择。

## 验证

- `npm run check` 通过。
- `npm test`：56 项通过（51 项原测试 + 5 项新增），无失败/跳过。
- `npm run build` 通过。
- Windows 应用内浏览器逐款验证六个实际字体效果，保存六张画布样图。
- 实际输入林雨晴、陈思远、张晓月、Ray、Vivian、Alexander、林雨晴 Yuqing Lin；检查字体切换、混排、颜色/大小、横/竖/方形布局及配置刷新保留。
- 桌面 1440×900 与手机视口 390×844 验证；手机页面内容宽度与滚动宽度相同，无横向溢出。这是浏览器尺寸模拟，不是手机真机。
- 隔离本地服务器对 Pacifico 完整字体返回真实 HTTP 404，验证中英文仍以系统字体显示；切换 Caveat 后恢复。
- 切回 TYX 验证情侣、装饰、播放/暂停与时间轴；实际生成原有 1920×1080、5 秒 MP4 并检查页面播放。详细状态与截图保存在本机 `Signature-Studio-Phase02` 交付目录。
- 本阶段不声称已完成带音乐编码、所有浏览器/手机真机、MP4 下载落地或外部完整解码验收。

## 运行与字体重建

正常构建使用已提交的字体资源，不需要 Python：`npm ci`、`npm run build`、`npm run preview -- --host 127.0.0.1 --port 5173 --strictPort`。本机使用构建预览，避开原 Vite 开发配置对 `Workspaces` 目录的拦截。

只有重新制备字体时需要独立构建工具 fonttools 4.68.0 / brotli 1.2.1（不进入网页运行依赖）：

```text
python scripts/prepare-fonts.py <TTF缓存目录> assets/fonts/static-sources.json
```

缺少的源文件从清单中的官方固定 URL 下载，并校验原始 SHA-256；生成完整 WOFF2、选项子集、NOTICE 与注册表。本机字体构建工具、缓存及源文件均保存在 G 盘。

范围到此结束；未开发中文逐笔动画、GIF、Android、搜索收藏、上传字体、后端或新页面。等待 Ray 验收后再继续。
