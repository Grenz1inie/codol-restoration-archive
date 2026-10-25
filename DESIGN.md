# 设计说明

设计判断：面向关注 COD:OL 恢复过程的读者，采用工业编辑式档案语言。阅读、比较状态、查证依据是核心任务。

`DESIGN_VARIANCE: 6`、`MOTION_INTENSITY: 2`、`VISUAL_DENSITY: 5`。局部不对称由真实信息层级决定；状态界面保持紧凑。Astro 静态 HTML、原生 CSS 与小型 TypeScript 筛选脚本，不引入 React 或后台管理框架。

## 视觉与结构

- 纸面 `#E7E5DF`、阅读表面 `#F3F1EB`、炭黑 `#252722`、次要文字 `#62665E`、橄榄强调 `#5E684D`、受阻/暂不可用 `#934B3F`。
- 中文采用系统中文无衬线字体栈，优先 PingFang SC / Microsoft YaHei / Noto Sans CJK SC，不依赖外部字体请求。等宽只用于版本与日期。
- 导航保持紧凑，四个入口为概览、恢复状态、开发日志、关于项目。
- 桌面矩阵左侧状态索引与右侧详情约 7:5；中小屏收为单列，条目进入独立详情页。版本号是已有事实，不作为进度数字。
- 0–2px 圆角、平面表面、不叠卡片、不使用玻璃或阴影。细线用于分隔真实信息组。
- 当前无公开记录时保留有意义的框架和说明，公开数量从数据计算，不制造功能行、总进度或发布日期。

## 参考与实际使用的 skill

已读取本机 `design-taste-frontend/SKILL.md`，并检查工作区：没有 `.agents/skills` 或已有站点约束。也实际读取用户指定的[上游 taste-skill](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md)及其 [app-screens.md](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/references/app-screens.md)。

此任务的矩阵属于带筛选的工作界面：应用上游关于平面层级、真实数据、完整空态、状态语义、三宽度浏览器检查与截图复核的原则。概览采用编辑式标题层级。技能中与明确需求冲突的通用默认项不适用：不改用 React，不添加宣传照片或生成成果，不添加自动动效，不改动用户指定色板，不取消版本日期等宽字。

实际检出的上游提交为 `12af471f627f866411b4bd785b19646d3672784c`。已运行 `draw.mjs --app --kind devtools --screens list,detail,report --theme light --keep palette,type --options 3`，选择 Achromatic ledger（seed `542480433`），适用其平面列表和克制状态强调。因初始 Icon rail 与文字导航要求冲突，执行一次 `--redraw shell` 得到 Open plane；仍保留用户明确要求的紧凑顶栏。上游代码、方向输出与审计截图放在站点仓库外或被忽略的 `output/` 中，不随站点发布。

- [TP-7 概念页](https://dribbble.com/shots/21847117--TP-7-Product-Page)：借鉴主体、细节与索引的层次组织，不复制照片、色彩或倾斜画板。
- [Apollo 11 in Real Time](https://apolloinrealtime.org/11/)：借鉴证据与记录的可追溯关联，不借用自动播放或实时性表述。
- [VGHF Digital Archive](https://archive.gamehistory.org/)：借鉴关键词、分类与集合组织，明确未收录不代表不存在。

## 状态与内容边界

可用性、工程状态、公开获取分为三个字段。已验证可用必须有证据和验证日期；部分可用、暂不可用与受阻需有已知限制。证据和日志通过稳定 ID 关联。日期可以未披露，构建不生成日期。

生产数据仅包含获准公开条目。校验在构建前执行，也在服务端读取时执行；未批准内容会使构建失败，而不是发送到浏览器后隐藏。公开仓库本身不是私密存储，维护者必须在提交前确认公开权限。

## 可访问性与功能

HTML 语义、跳过导航、中文语言标记、文字状态、显式表单标签、焦点边框、原生移动导航、无脚本可读和静态详情页。筛选后公布结果数，支持清除、无结果、URL 查询条件与刷新。桌面选择条目更新关联详情；移动端与无脚本直接打开稳定详情地址。

功能性反馈为 180ms；`prefers-reduced-motion` 下取消过渡和入场效果。无音频、自动播放、跟踪服务或虚构图表。所有实际浏览器结果与部署证据见 `docs/VERIFICATION.md`，不把预期当作验证结论。
