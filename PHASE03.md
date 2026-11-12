# Phase 03 — 免费商用字体库扩展

沿用现有仓库及 `phase02/static-font-preview` 开发分支，在 Phase 02 提交 `c09c9e89463ef09ad0046893f51d10b6d3db663c` 上增量开发，不合并 main，不正式发布。

## 接管检查与结果

先阅读实际注册、加载、制备、选择器和测试代码，再在原运行页面逐款选择 Ma Shan Zheng、Long Cang、Zhi Mang Xing、Caveat、Dancing Script、Pacifico，确认真实字形正常。之后才加入新字体。原六款完整 WOFF2 和样本文件按哈希复用，字节不变。

现在同一个选择器有 12 款静态字体：中文六款、英文六款，另保留 TYX Brush 动态笔迹入口。选择器组件和分类沿用原样，没有添加新页面、标签、搜索、收藏、上传或复杂筛选。

## 新增六款

| 字体 | 完整 WOFF2 | 字符数 | 本机首次选择到预览就绪 | 许可来源 |
| --- | ---: | ---: | ---: | --- |
| LXGW WenKai（霞鹜文楷） | 8,099,088 B（8.10 MB） | 46,926 | 506 ms | [作者 OFL](https://github.com/lxgw/LxgwWenKai/blob/8afc526476c2811e2e90e765444e7a6e4a7ecf77/OFL.txt) |
| Noto Serif SC | 5,732,860 B（5.73 MB） | 30,928 | 313 ms | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/notoserifsc/OFL.txt) |
| ZCOOL XiaoWei（站酷小薇体） | 2,632,596 B（2.63 MB） | 7,016 | 312 ms | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/zcoolxiaowei/OFL.txt) |
| Sacramento | 32,232 B（32.2 KB） | 370 | 312 ms | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/sacramento/OFL.txt) |
| Great Vibes | 162,276 B（162.3 KB） | 1,081 | 302 ms | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/greatvibes/OFL.txt) |
| Allura | 87,132 B（87.1 KB） | 587 | 306 ms | [Google Fonts OFL](https://github.com/google/fonts/blob/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl/allura/OFL.txt) |

字节数使用十进制单位。时间在新的本地隔离端口、禁止 HTTP 缓存的静态服务上测得，包含 UI 自动化操作、请求、字体解析及预览准备，不是精确网络下载时长，也不能外推为公网/手机速度。此次每款仅测一次，不能当作统计基准。缓存后连续切换的观测约 339–355 ms，同样包含自动化开销。

逐款读取了源文件版权、OFL、许可 URL 和 OS/2 嵌入字段（六款 fsType 均为 0）。六款均可按 OFL 1.1 商用、网页嵌入、随 Android 内置和重新分发；必须保留版权/OFL，字体本身继续采用 OFL、不得单独出售，修改版本遵守保留名称限制。详细来源、内部衍生命名与维护规则见 [FONT_LIBRARY.md](FONT_LIBRARY.md)。无需替代字体。

## 主要修改

- `assets/fonts/static-sources.json`：将原脚本固定字体清单并入现有来源注册配置。每款记录唯一 ID、名称、中文显示名、语言、风格、格式、来源、哈希、许可、预览文本、回退及独立内部字体名称。
- `scripts/prepare-fonts.py`：从配置读取所有字体，校验来源/许可哈希、复用既有资源、转换新 WOFF2、检查完整 cmap 与姓名覆盖，生成注册表、小样、覆盖表及 NOTICE。添加字体无需修改 React/Canvas/导出业务组件。
- `public/fonts/catalog.json` 及逐款资源：新增六款、补齐元数据；字符覆盖表分离到 `coverage.json`，避免随库增长塞进首屏脚本。
- `web/font-catalog.ts`、`web/font-loader.ts`：选中字体时并行加载完整字库与覆盖表，两者均去重、超时回退和失败后可重试。混排仍按既有回退规则处理。
- `tests/web-fonts.test.ts`：覆盖 12 款资源/许可/哈希/测试姓名、注册与持久化、加载去重，以及新增的覆盖表失败与重试。
- `.gitattributes`：保留 OFL 原文的确切字节，避免 Windows 换行转换破坏许可哈希。
- `FONT_LIBRARY.md`、`THIRD_PARTY_NOTICES.md`、本报告：记录许可、维护方式与验收证据。

本阶段没有修改 `FontPicker.tsx`、`main.tsx`、`Preview.tsx`、`brush-engine.ts`、`renderer.ts` 或 `export.ts`；原动态、情侣、装饰和导出业务逻辑保持不动。

## 加载与体积

新增完整字体约 16.75 MB，但只有实际选择时下载。12 个选择器字样合计 32,028 B；打开列表只请求字样，不会同时下载完整字库。隔离服务日志确认：动态初始状态未请求静态字体资源；首轮逐款选择期间，每款完整字体和覆盖表仅请求一次；随后同文档连续切换没有重复请求。刷新后的新文档正常加载所选字体。

完整中文字库不裁剪姓名字符；WOFF2 转换前后 cmap 一致。小样只用于字体选项，不能代替姓名字库。覆盖表按需加载后，本次主脚本 559.17 KB（gzip 182.22 KB），Phase 02 为 611.43 KB（gzip 198.12 KB）。

霞鹜文楷与 Noto Serif SC 首次下载仍较大。未来可评估完整 Unicode 分包，本阶段不为压缩体积牺牲基本姓名。当前加载超过 12 秒会回退系统字体；低速公网或低性能设备可能触发该回退，尚未进行网络限速与真机性能测试。

## 验收证据

- 类型检查通过；58 项自动化测试通过，无失败/跳过；生产构建通过。
- 浏览器实际检查原六款 + 新六款，中文“林雨晴”、英文“Vivian”和全部字体下的“林雨晴 Vivian”均正常；逐款生成效果截图。
- 连续切换 12 款字体后，未观察到空白或明显布局异常；刷新后保留 Allura 与混排姓名。
- 真实字体文件 404 后使用系统字体继续显示中英文，切换可用字体恢复。覆盖表失败/重试另由自动化测试覆盖。
- TYX 动态情侣签名恢复正常；实际生成 1920×1080、5 秒 MP4 并检查页面播放。
- 原有 51 项测试仍全部通过；全部检查日志、字体请求日志、加载观测、截图及源字体版权审计存于本机 `G:\AI\OpenAI\Workspaces\Signature-Studio-Phase03`。

未声明完成所有生僻字/Unicode、手机真机、低速公网、带音乐导出、MP4 下载落地或外部完整解码验收。当前指定测试姓名未发现缺字或排版问题。

## 运行与停止边界

预览：http://localhost:5173/ 。可使用本机 Phase 03 交付目录内 `开始预览.cmd` 重开；沿用原生产构建预览，避开原开发服务器对 Workspaces 目录的拦截。

本阶段只扩展静态字体库并完善资源维护。没有开发中文逐笔动画、GIF、Android、字体管理新页面或后台。交付后停止，等待 Ray 验收。
