# 维护公开档案

本站只记录 COD:OL `3.19.26.22`。当前 `src/data/records.json` 为 `[]`，`src/content/logs/` 没有日志。这表示尚无获准发布的记录，不能解释为功能未完成或进度为零。

## 发布边界

此仓库用于公开站点。只把已经完成公开审核的材料放进仓库；不要提交待审核资料、私有仓库内容、内部 Issue、联系方式、凭据、游戏客户端、客户端资源或恢复项目内部源码。`approvedPublic: true` 是审核结果的声明，不会替代人工审核。将其设为 `false` 会让校验和构建失败，而不是把私密内容藏进页面。

## 更新功能记录

编辑 `src/data/records.json`，在数组中加入经过审核的记录。字段定义及枚举以 `src/lib/archive.ts` 为唯一依据：

| 字段 | 用途 |
| --- | --- |
| `id` | 小写英文字母、数字与连字符组成的稳定 ID；发布后不随标题改名 |
| `title`、`summary` | 真实功能名及简明说明 |
| `category` | `connection`、`frontend`、`gameplay`、`assets`、`services` |
| `gameVersion` | 固定为 `3.19.26.22` |
| `availability` | `verified` 已验证可用；`partial` 部分可用；`unverified` 待验证；`unavailable` 暂不可用 |
| `workStatus` | `notDisclosed` 未披露；`investigating` 调查中；`inProgress` 处理中；`blocked` 受阻；`completed` 已完成 |
| `accessStatus` | `notDisclosed` 未披露；`notPublic` 未开放；`limited` 有限开放；`public` 已公开 |
| `limitations` | 已知限制的字符串数组；部分可用、暂不可用、受阻时必须说明 |
| `verifiedAt`、`updatedAt` | 真实 `YYYY-MM-DD` 日期；未知为 `null`，禁止用构建日期补齐 |
| `evidence` | 证据数组；没有公开证据时为 `[]` |
| `relatedLogIds` | 已发布日志 ID 数组；没有则 `[]` |
| `approvedPublic` | 必须为 `true`；只在人工完成公开审核后填写 |

三种状态相互独立。“工程已完成”不能自动推导出“已验证可用”，也不能推导出“已公开”。已验证可用必须提供真实验证日期及至少一条公开证据。日期与限制不得为了通过校验而捏造。

每条证据包含唯一 `id`、`type`（`image` / `video` / `document`）、`title`、`url`、`description`。图片另需准确 `alt`。只接受经过审核的公开 HTTPS 地址；不接受凭据、本地服务、IP 字面量或危险协议。链接格式校验无法证明链接内容公开或正确，发布者必须核实链接访问权限、内容与授权。

## 更新 Markdown 日志

在 `src/content/logs/` 创建 `<id>.md`，文件名必须与稳定 ID 相同。Frontmatter 必须包含 `id`、`title`、真实且带引号的 `date: 'YYYY-MM-DD'`、`gameVersion: '3.19.26.22'`、`summary`、`relatedRecordIds` 数组和 `approvedPublic: true`。正文写真实说明、验证条件和限制；不允许原始 HTML。Markdown 链接和图片同样只接受公开 HTTPS 地址；图片必须写替代文本。站内关联请使用 `relatedRecordIds`。日志日期不能用构建时间代替。

日志与功能通过稳定 ID 关联。引用不存在的记录或日志、重复 ID、缺少审核声明、无效日期均会阻止构建。不要重命名已发布的 ID，否则原有详情链接会失效。

## 检查与上线

1. 确认内容、证据链接和影像均已获准公开。
2. 运行 `npm run validate`、`npm test`、`npm run check`、`npm run build`。
3. 本地预览，检查文字、证据、限制和深层详情页。
4. 提交本次公开内容更新并推送。GitHub Actions 重新构建后发布。

本站按内容提交更新，不是实时同步。测试中的合成数据只存在于 `tests/`，不属于公开档案，也不会生成条目或示例成果页面。
