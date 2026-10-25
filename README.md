# COD:OL 修复档案

Astro + TypeScript 静态站，记录 COD:OL **3.19.26.22** 的公开恢复状态、证据与开发日志，部署在 GitHub Pages。

站点：https://grenz1inie.github.io/codol-restoration-archive/

## 本地运行

使用 Node.js 22 的最新维护版本。

```sh
npm ci
npm run dev
```

开发地址为 `http://localhost:4321/codol-restoration-archive/`。在受限环境中可设置 `ASTRO_TELEMETRY_DISABLED=1`，避免 Astro 遥测配置写入用户目录。

```sh
npm run check
npm test
npm run build
npm run preview
```

## 内容更新

功能数据：`src/data/records.json`。开发日志：`src/content/logs/*.md`。目前均为空，因为没有获准公开的恢复记录。空记录不代表工程进度为零。

阅读 [内容维护说明](docs/CONTENT.md)。只把已获准公开的资料加入本公开仓库，`approvedPublic: true` 是必要准入条件，不是隐私保护开关。未获准内容应留在本仓库之外。构建会拒绝未批准记录、错误日期、重复 ID、悬空引用和危险证据地址。

每条功能生成 `/records/<稳定ID>/`，每篇日志生成 `/logs/<稳定ID>/`。修改标题时保留 ID，避免破坏链接。修改后运行上面的校验命令并推送到 `main`，Actions 重新构建部署，不实时读取其他仓库或 Issue。

## GitHub Pages

独立仓库 `Grenz1inie/codol-restoration-archive`，不使用个人主页仓库。仓库 Settings → Pages → Source 选择 **GitHub Actions**。首次启用可由仓库管理员执行：

```sh
gh api --method POST repos/Grenz1inie/codol-restoration-archive/pages -f build_type=workflow
```

`.github/workflows/deploy.yml` 依次执行类型检查、测试、公开内容校验、构建和部署。仅部署 `dist/`，凭据不进入源码。

`astro.config.mjs` 明确设置 `site: https://grenz1inie.github.io` 和 `base: /codol-restoration-archive`。页面和资源均使用带 base 的路径，详情为静态目录 `index.html`，支持深层链接刷新。没有 SPA 重写。

如更改仓库名，必须同步 `base` 和本文中的站点地址。回退内容通过 Git 回退提交并重新构建，不改动其他项目。

## 设计与验证

- [DESIGN.md](DESIGN.md)：设计原则、参考与技能应用边界。
- [docs/VERIFICATION.md](docs/VERIFICATION.md)：本次构建、浏览器与部署检查记录。
- `output/`：本地截图与检查输出，已排除在仓库和部署之外。

本站源码不包含游戏客户端资源或内部恢复代码，也不提供未经确认的下载入口。
