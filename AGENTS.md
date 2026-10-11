# AGENTS.md — Xueia Cloud 前端复刻工作区

> 本文件是项目的持久知识库，专为对抗上下文压缩而写：任何阶段恢复工作前，先读完本文件 + 设计文档。

## 0. 文档地图与同步规则

### 0.1 文档导航

| 文档 | 内容 | 何时读 | 何时更新 |
|---|---|---|---|
| `AGENTS.md`（本文件） | 项目知识库：范围/架构/规范/进度 | 每次会话开始、任何改动前 | 每次开发/修改后（进度、新约定） |
| [设计文档](docs/superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md) | 设计权威：范围/架构/批次/验收 | 动手实现任何功能前 | 范围/架构变更**经用户确认后** |
| [接口登记册](docs/api.md) | 契约/错误码/接口参数与状态 | 写任何接口代码前 | 每新增/修改/mock 一个接口 |
| `docs/plans/`（未来） | 各批次实施计划（writing-plans 产物） | 执行对应批次时 | 计划变更时 |

### 0.2 文档同步规则（强制，视同代码审查项）

每次新开发内容或修改完成后，按变更类型同步更新关联文档，**缺一不可**：

| 变更类型 | 必须同步的文档 |
|---|---|
| 新增/修改/删除接口、错误码 | `docs/api.md`（状态标记与参数表） |
| 新增/修改页面、组件、交互 | `AGENTS.md` §2/§3（若影响范围或架构约定） |
| 范围/模块取舍/批次调整 | 设计文档（先经用户确认）+ `AGENTS.md` |
| 完成一个批次/里程碑 | `AGENTS.md` §1 进度日志 + §8 验证命令（如有新增） |
| 新增项目级约定/踩坑 | `AGENTS.md` 对应章节 |

收尾自查：代码改完 → 按上表同步文档 → 最终报告里明确列出「本次改了哪些文档」。

## 1. 工作区目的与状态

- **目标**：从零复刻 cloud.doulor.cn（Doulor Cloud，共建式私域云平台）的**前端**，品牌替换为用户自己的 **Xueia（域名 xueia.com）**，最终目标是**真实运营**（API 层按真实端点定型，后端可后补）。
- **状态**：设计已定稿并经用户确认，**尚未脚手架化**（无 package.json）。
- **进度日志**（每完成一项追加一行，倒序）：
  - 2026-10-07 设计文档补全为落地完整版：账户设置/申诉入批次②、公告强制确认入批次③、称号/反馈/活动入批次④；新增部署与环境变量、工程约定（性能/兼容/无障碍/版本/限流）两节；全站接口定版 `/api/v1`。三份文档互链同步更新。
  - 2026-10-07 设计文档定稿（含域名/网盘裁剪）；建立 AGENTS.md 知识库与 `docs/api.md` 接口登记册；文档互链导航与同步规则生效。
- **流程**：走 superpowers 的 Architectural 路径 —— 设计文档已获批准 → 下一步是 writing-plans 生成第一批实施计划 → 按批次实施。每批次独立可演示。

## 2. 项目内容与范围要求

### 2.1 模块取舍（用户拍板，不可凭感觉推翻）

| 原站模块 | 本项目 | 批次 |
|---|---|---|
| 域名/DNS 管理、直链网盘 | ❌ 明确不要 | — |
| 邮箱（域名邮箱+网页收件箱）、临时分享箱（游客取件）、**账户设置（含 2FA 管理/注销）、封禁申诉** | ✅ 保留 | ② |
| AI 中转站、捐献与邀请、积分与商城（签到/兑换券）、**公告+强制确认弹窗** | ✅ 保留 | ③ |
| 社区广场、聊天室、私信、站内消息、排行榜、成就、**称号**、个人名片/空间、**反馈**、**活动页（游客可看）** | ✅ 保留 | ④ |
| 内网穿透、代理节点、工具箱（约 35 个纯前端小工具） | ✅ 保留 | ⑤ |
| 管理后台、PWA 完善、公开 API、OAuth2 提供方 | ✅ 保留 | ⑥ |

### 2.2 第一批交付物

工程骨架 + 设计系统（14 个基础组件：Button、Input、Label、Card、Dialog、DropdownMenu、Select、Tabs、Badge、Table、Toast、Tooltip、Switch、Avatar）+ 品牌配置 + 落地页（9 张能力卡：域名邮箱、网页收件箱、临时分享箱、个人名片、AI 中转站、内网穿透、代理节点、社区与聊天室、积分与商城）+ 认证三页（登录含 2FA 界面与环境自检、注册含 `username@xueia.com` 实时预览与邀请码、忘记密码）+ 控制台外壳（玻璃拟态侧栏、顶栏双铃铛、概览页静态卡）+ 全量路由占位 + API 客户端与 MSW mock + 工程细节（主题防闪、开屏动画、错误边界、chunk 自愈、404、PWA）。

### 2.3 批次地图

① 骨架+落地页+认证+控制台外壳+API/mock 层 → ② 邮箱+临时分享箱+账户设置（含 2FA 管理/注销）+申诉 → ③ AI 中转站+捐献邀请+积分商城+公告强制确认 → ④ 社区/聊天/私信+排行/成就/称号+名片/空间+反馈+活动页 → ⑤ FRP+代理+工具箱 → ⑥ 管理后台+PWA 完善+公开 API/OAuth 页面。**不要跨批次提前实现。**

### 2.4 红线

- 原站的**品牌名、Logo、文案原文、美术资产（云朵图形等）不得照抄**：文案参考 `doulor-analysis/zh.txt` 的语义重写，云朵背景自绘参数。
- 品牌（站名/域名/社交链接/主题色）一律引用 `src/config/brand.ts` 单一来源，禁止散落硬编码。
- 主题 localStorage key 用 `xueia-theme`（原站是 `doulor-theme`，勿混淆）；跨组件事件总线命名 `xueia:*`。

## 3. 技术架构

### 3.1 技术栈（脚手架按此，之后以 package.json 为准）

Vite 7 + React 19 + TypeScript strict；Tailwind CSS v4（CSS-first `@theme`）；shadcn/ui（源码入库可改）+ Radix UI + lucide-react；React Router v7 library 模式（BrowserRouter）；TanStack Query v5（服务端状态）；react-hook-form + zod（表单）；自研轻量 i18n provider；MSW v2（mock）；Vitest + Testing Library + Playwright（测试）；marked + DOMPurify（Markdown，预留）。

### 3.2 目录结构

```
src/
  config/brand.ts          # 品牌单一来源
  i18n/                    # provider + zh/en 字典（flat key）
  lib/                     # api-client.ts、theme.ts、utils.ts(cn)
  api/                     # 按域端点模块（auth/mailbox/ai/frp/proxy/points/community/chat/dm/donations/admin…）
  mocks/                   # MSW handlers（按域分文件）
  components/ui/           # shadcn 基础组件
  features/
    landing/ auth/ dashboard-shell/ overview/   # 第一批
    <module>/components|pages|api              # 后续批次逐个加入
  routes.tsx               # 全量路由表 + 守卫
```

### 3.3 数据流与会话

组件 → TanStack Query hook → `api/<域>.ts` → `api-client.ts` fetch → 开发态 MSW 拦截 / 未来真实 Worker 后端。纯客户端偏好（侧栏折叠、主题、语言）走 localStorage。会话凭据走 **HttpOnly Cookie**（前端不存 token），前端只暴露 `useMe()`。

### 3.4 路由与守卫

- 公共：`/`、`/login`、`/register`、`/forgot-password`、`/terms`、`/privacy`、`/u/:username`、`/tempbox` 取件入口、`/appeal` 申诉入口。
- `/dashboard/*` 整组 **requiresAuth**，守卫支持**白名单例外**（`/dashboard/tempbox`、`/dashboard/community`、`/dashboard/events/:id` 游客可访问——原站实测确认的设计：内容公开可看，交互才需登录）。
- 全量子路由先建「建设中」占位页：email、tempbox、settings、ai、frp、proxy、profile、space、community、chat、dm、messages、points、leaderboard、achievements、donations、toolbox、feedback、events/:id、apiset、oauth、admin。
- 401 由 api-client 统一跳 `/login?from=<当前路径>`。

## 4. 目标网站（doulor.cn）编码规范观察 —— 复刻时对齐的模式

### 4.1 i18n

- **flat key + 命名空间前缀**（如 `nav.email`、`dash.ai.card`、`common.save`），两个扁平字典（zh/en）同 key 对齐，原站各 5880 条。
- `t(key, params)` 用 `{name}` 占位符插值；未命中回退 zh → 再回退 key 本身。
- Provider 挂 `document.documentElement.lang`；语言存 localStorage；hook 在 Provider 外使用要 throw（原站 `useT` 如此）。
- 命名空间即模块：`landing/` `nav/` `login/` `reg/` `dash/` `ai/` `frp/` `px/` `st/` `tb/` `cm/` `pt/` `don/` `ach/` `lb/` `chat/` `dm/` `oapp/` `apiset/` `settings/` `s2fa/` `appeal/` `admin 类(ap/ao/au/mod)` 等 —— 新页面文案按此风格起 key。

### 4.2 样式与组件模式

- shadcn/ui + Radix 模式：`data-[state=open]`、`animate-in fade-in-0 zoom-in-95`（tw-animate-css）、`radix-select-trigger` CSS 变量。
- 设计令牌 CSS 变量：浅底 `#fafafa`/深底 `#0a0a0a`；**主色 = 前景色**（浅色下主按钮纯黑、深色下纯白）；强调绿 emerald 只用于「注册即用/已解锁/在线」徽章与状态点；`--radius: 0.625rem`；细边框 `#e4e4e7`/`#27272a`；阴影极淡。完整令牌见 `doulor-analysis/index-DA6AHNji.css`。
- 特效工具类：`glass-panel`/`glass-sidebar`/`glass-card`（backdrop-blur 玻璃拟态，用于侧栏）；头像**角色环** conic-gradient 旋转边框（amber=成员/rose=管理/violet=超管）；`page-enter` 页面渐入、`data-fade` 卡片渐入；`cursor-glow` 鼠标光晕；云朵背景用 `body:before` + SVG mask 平铺（低对比度）；`prefers-reduced-motion` 全量降级。
- 字体：Outfit（OFL 开源）+ PingFang SC / Microsoft YaHei / Noto Sans SC 回退；标题 `-0.02em` 字距、黑体大字号。

### 4.3 HTML/加载工程（原站被真实事故验证过的方案，思路照抄、品牌替换）

- **主题防闪**：`<head>` 内联脚本在首帧前读 `localStorage('xueia-theme')` → 无则跟随系统 → 给 `<html>` 打 `dark` 类。
- **开屏动画**：内联在 `<body>`（不等 JS）：Logo 描边动画（stroke-dasharray）+ 品牌名淡入淡出，约 1.5s 后移除 DOM；`prefers-reduced-motion` 时隐藏。
- **chunk 自愈**：入口脚本 404（部署后旧 HTML 引旧哈希）→ window error capture 刷新；12 秒 root 仍未挂载也刷新；**sessionStorage 限 2 次、间隔 ≥15 秒**防循环。
- **PWA SW 策略**：导航 network-first（失败回退缓存壳）；带哈希静态资源 cache-first（**必须校验 Content-Type，text/html 冒充的一律不缓存**——原站真实事故）；`/api/*` 永不缓存；静态资源变更时**必须手动升 SW 的 CACHE 版本号**。
- **构建拆包**：vendor-react / vendor-ui(Radix) / i18n / utils / api 按域 chunk；主包约 1.6MB（我们要控制在更小，别学它的大包）。

### 4.4 数据获取与交互模式

- 原站手写 fetch + useState + `useEffect` 轮询（未读数每 60s，配合 `visibilitychange` 页面可见才查）；我们**统一改用 TanStack Query**（`refetchInterval` + `focusManager` 等价能力）。
- 跨组件同步（如未读数刷新）：原站用 `window.dispatchEvent(new Event('doulor:messages-changed'))` + 监听；我们用 Query invalidation 替代，确需事件总线时命名 `xueia:*`。
- 列表页模式：分页「加载更早」，卡片带状态徽章；表单页模式：字段级校验 + 提交中禁用 + 成功 toast。
- Markdown 内容渲染有独立 `markdown-body` 样式块，渲染前必须 sanitize（DOMPurify）。

## 5. 接口说明（前端先定型，后端落地时对齐）

### 5.1 契约

- **接口登记册：`docs/api.md`（强制维护）** —— 每新增、修改或 mock 一个接口，必须同步更新该文件的条目状态（⬜ 计划 / 🟡 Mock / ✅ 真实后端）与参数表；错误码先登记后使用；未登记的接口视同不存在。
- **路径版本**：前端一律走 `/api/v1/*`（api-client baseURL 拼接，同源相对），破坏性变更升 `/api/v2`。下文「端点分组」列的是**原站真实路径**（无版本段），登记新项目接口时去掉原站前缀、套上 `/api/v1`。
- Envelope：`{ ok: true, data } | { ok: false, error: { code, message } }`，TS 类型入库。
- 401 → 清登录态跳 `/login?from=<path>`；403 → toast「无权限」；网络/5xx → toast + 可重试；所有错误走统一 toast，不得 alert。
- 开发态全站用 MSW mock（handlers 按域分文件与 `api/` 一一对应），接真后端只改 `VITE_API_BASE` 环境变量。

### 5.2 端点分组（从原站 `doulor-analysis/api.js` 提取的真实路径，新项目按需对齐）

- **认证/账号**：`/login`、`/login/2fa`（+`/send-email`）、`/logout`、`/register`、`/register-status`、`/me`、`/password`(`/forgot`/`/reset`)、`/appeal`(`/acknowledge`/`pending-reply`)、`/settings/*`（username、nickname、email+verify、avatar、notify、account/delete+delete-code）
- **2FA**：`/settings/2fa`（disable/email/recovery/regenerate、totp 的 start/confirm/disable）
- **邮箱**：`/mailbox`、`/mailbox/{id}`、`/mailbox/{id}/messages/{mid}`(`/read`/`/reply`)、`/mailbox/messages/batch-delete`、`/mailbox/forward-verify`、`/mailbox/read-all`、`/mailbox/temp`(+`/{id}/refresh`)
- **AI 中转站**：`/proxy`(check/enable/disable/latency)、`/dev/*`（key(s)、subscribe、sync、redeem、preflight、status、bind、password）、newapi 配置类在 `/admin/newapi/*`
- **积分/签到/商城**：`/points`、`/points/redeem`、`/points/transfer`、`/points/products`(+`/image`)、`/points/shop/buy`、`/checkin`(`/auto`/`/makeup`)、`/vouchers/redeem`、订单售后：cancelOrder/deliverOrder/rejectOrder/requestAfterSale 等
- **捐献/邀请**：`/donations`(+`/ai/probe`)、`/my-invites`(+`/claim`)、`/admin/donations/review`、`/admin/invite-quotas`
- **社区/聊天/私信**：`/community/*`（posts、config、stats、seen、new-posts-count）、`/chat/*`（messages、heartbeat、presence、seen、unread、upload-image、stickers）、`/dm`（conversations、requests、seen、unread）
- **通知/公告/反馈**：`/notifications/*`、`/announcements`、`/notice/ack`(+`/pending`)、`/feedback`(+`/read`/`/reply`/`/upload-image`)
- **临时分享箱**：`/tempbox/config`、`/tempbox/create`
- **成就/称号/排行/活动**：`/achievements`、`/titles/mine`(+`/display`)、`/events`(+image)、排行榜数据
- **个人名片/空间**：`/profile`（enable/publish/preview/domain）、`/my-space`、`/profile/asset?kind=`
- **开发者/开放平台**：`/dev/keys` 系列、`/api-doc`、OAuth：`/oauth/authorize/decision`、`/oauth/grants`、`/oauth/my-clients`
- **管理后台**（批次 6）：`/admin/users`、risk-accounts、moderation/*、permission-groups(+tree/members)、invites、reserved-subdomains、r2/*、dns/cf-diff、mail/brevo-quota、announcements、notices(+revoke)、events、feedback/*、donations/*、frp/*、proxy/subscriptions、points/*、titles、settings、oauth/*、cli2api/*、wb2api/*、newapi/*

## 6. 测试与修复规范

### 6.1 测试

- **Vitest + Testing Library** 必测三类：基础组件冒烟；路由守卫三态（已登录/未登录/白名单例外）；api-client 错误分支（401/403/5xx/envelope 解析）。
- **Playwright E2E 主链路**：落地页 → 注册（mock）→ 登录 → 概览 → 退出；每交付一个批次，追加该批次模块的 E2E。
- 不追求覆盖率指标；视觉回归暂缓。改 UI 后用截图对照设计文档/原站截图验收。

### 6.2 修复规范

- **先重现、再定位根因、最小修复**；禁止盲目重试或绕过断言让测试变绿。
- 涉及 SW/静态资源缓存的修复，**必须同步升 Service Worker 的 CACHE 版本号**，否则用户拿不到新版本（原站真实事故，两次）。
- chunk 自愈逻辑（第 4.3 节）是运维保命符，任何重构不得破坏其参数语义（2 次上限、15 秒间隔、12 秒兜底）。
- 修复完成必须验证：构建通过 + 相关测试通过 + 受影响页面手动/Playwright 走一遍，并在回复里如实报告结果。
- 遇到「疑似环境问题」先查本文件第 7 节（cmd 无 Unix 工具、工具链未装）再下结论。

## 7. 环境警告（本机实际踩过的坑）

- **系统 shell 是 Windows cmd**：`grep`/`sed`/`head`/`wc`/`find` 等 Unix 工具**不存在**，管道 `|`、`&&` 后半段可能被静默截断。复杂文本处理用 PowerShell（`Select-String`、正则 Matches），或写成 `.ps1` 脚本文件再 `powershell -ExecutionPolicy Bypass -File` 执行。
- **Node.js / npm / git 均未安装**（已确认标准安装路径为空）。构建、测试、git 提交前需先装工具链；在此之前不要假设 `npm run *`、`git *` 可用。
- `doulor-analysis/` 是分析产物不是项目代码：不要在其中开发，不要打进构建。
- 变更前必读：`docs/superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md`（设计文档，一切实现以它为准）、`docs/api.md`（接口登记册，写接口代码前先查）。

## 8. 验证命令

脚手架完成后在此补充（预期 Vite 默认：`npm run dev` / `npm run build` / `npm run test` / `npx playwright test`）。
