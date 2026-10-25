# 验证记录

## 本地构建与数据

- `npm run check`：0 errors、0 warnings、0 hints。
- `npm test`：11/11 通过。包括未批准内容拒绝、三类状态独立、验证证据要求、真实日期、危险链接、重复 ID/引用、长中文、Markdown HTML 拒绝与磁盘读取边界。
- `npm run build`：通过，生产公开内容为 0 条记录、0 篇日志，生成 5 个静态页面。
- 已检查产物 base 路径。未包含私密进度、内部代码、客户端资源、个人联系方式、测试夹具或上游技能源码。

## 真实浏览器

使用 Chromium / Playwright CLI，并实际打开截图复核。

- 1440px：7:5 索引与详情；768px、390px：单列，无水平溢出。
- 生产空数据：记录数为 0、诚实空态、暂无公开影像、无公开日志。
- 关键词无结果、清除筛选、结果计数、查询参数同步通过。
- 390px 原生移动导航展开与页面导航通过。
- 独立本地夹具 20/20 断言通过：分类/可用性/关键词组合筛选、有结果/无结果、清除、筛选刷新、桌面选择及刷新、三种状态区分、受阻限制、无影像、长中文布局、手机独立详情及刷新、reduced-motion、禁用 JavaScript 的列表和详情阅读。
- 测试夹具位于忽略目录 `output/qa-fixture/`，没有进入生产数据或 Git 历史。

浏览器截图和执行记录位于本地 `output/playwright/`、`output/taste-inspection/` 与 `output/taste-production/`。

## taste-skill

上游 `lint.mjs --app src`：0 FAIL、3 WARN。提示一处说明标签（源码与样式分别计数）和版本/日期等宽字。二者有真实信息用途，用户要求优先。

真实浏览器 `inspect.mjs --app --widths 1440,768,390` 已运行并复核截图。最终生产检查为 **0 FAIL、5 WARN**。保留的通用警告有明确原因：色板由用户指定；分隔线组织档案层级；首页是编辑式概览，标题和真实版本号不是仪表盘 KPI；检查器把空影像框识别为图表，本站没有图表数据可着色。不能把这些豁免解释为未经修改通过全部通用模板规则。

Lighthouse 12.8.2 对本机生产构建的单次检查：Performance 99、Accessibility 100、Best Practices 100、SEO 100，CLS 0.079。这是本地实验室结果，不等同于真实用户性能统计。因本机 Node 版本，使用兼容的 Lighthouse 12；报告在 `output/lighthouse.json`。

## 部署核验

已核实 GitHub 身份为 `Grenz1inie`，核对已有仓库后创建独立新站仓库，没有覆盖已有项目。

- 网址：[COD:OL 修复档案](https://grenz1inie.github.io/codol-restoration-archive/)
- 首次发布的源码提交：`bbe64f7dcfdf419b625519bdab7fe5b1af4380fb`，已用远程 refs 和 GitHub commits API 双重核实。
- [首次 Actions 部署](https://github.com/Grenz1inie/codol-restoration-archive/actions/runs/40172032114)：build、deploy 成功，Pages 使用 `workflow` 发布。
- 真实线上 Chromium 检查：首页、`status/`、`logs/`、`about/` 均 HTTP 200，分别直接访问和刷新通过。
- 线上 1440 / 768 / 390px 均无横向溢出；关键词无结果、清除、查询条件刷新、手机导航、键盘跳过导航通过；无失败资源请求和页面脚本错误。
- 线上截图：本地 `output/playwright/live-1440.png`、`live-768.png`、`live-390.png`。

当前真实内容为空，因此线上没有虚构的功能详情 URL。功能详情的实际静态 HTML 生成及刷新在隔离夹具中验证，后续加入获准公开条目时会生成对应地址。每次后续内容更新仍需通过相同工作流。
