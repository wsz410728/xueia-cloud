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
| **任何代码更新** | **git commit + push origin main（强制，见 §7 工作流）** |
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
  - 2026-10-11 修复两个实测暴露的 bug：**PWA SW 与 MSW 抢 scope**（dev 不注册 PWA SW + 启动清理遗留，教训入 §7.2）；**占位页 i18n key 双前缀**（`nav.nav.gallery`）。首次打开创想造物占位页并验收。
  - 2026-10-11 用户拍板：侧栏改参考站同款**平铺布局 + 底部用户块**（已重构并实测同构）；**新增「创想造物」模块**（造物集，批次④，替代未纳入的 AI实验室生态位）；顶栏加积分 chip。三份文档同步。原站「AI实验室」确认不纳入。
  - 2026-10-11 对比验收轮：登录参考站实测（账号 jooyang），同口径提取结构+计算样式。**发现并修复重大 bug：main.tsx 漏 import index.css，全站此前为无样式渲染**。深色令牌对齐参考站（底 #1a1a1a、卡片同底色+白 15% 边框、圆角 6px）、概览标题逐字动画。另发现参考站新增模块「AI实验室(/dashboard/lab)」「创想造物(/dashboard/gallery)」未入范围，待用户决策。
  - 2026-10-11 **批次①完成并推送**：脚手架（Vite7+React19+TS strict+Tailwind v4+RR v7+Query v5+RHF/zod+MSW+Vitest）、设计系统（15 组件+令牌+云朵背景+玻璃拟态+角色环）、品牌配置（emailDomain 可配）、i18n zh/en、落地页九卡、认证三页（登录含 2FA 三方式+环境自检）、控制台外壳（守卫+玻璃侧栏+双铃铛）、概览页、邮箱收件箱 mock 页（加料演示）、全量占位路由、PWA（manifest+SW+favicon）、chunk 自愈。构建通过（首屏 gzip≈190KB）；WSL vitest 10/10 通过；浏览器实测登录→2FA→概览→邮箱全链路。修复两处契约 bug：/me 401 误触发登录跳转；AUTH_2FA_REQUIRED 被改写为 AUTH_REQUIRED 导致票据丢失（ApiError 现携带 data，契约见 docs/api.md）。
  - 2026-10-07 环境就绪：Windows 装 Node v24 + git 2.55 + gh 2.102（已登录 wsz410728）；WSL Ubuntu 26.04 装 Node v22。工作流定版：开发在本机、测试在 WSL、每次代码更新推送 GitHub（§7）。npm 定版；视觉定版黑白极简；Logo/社交占位、`emailDomain` 可配（已同步设计文档）。仓库公开：wsz410728/xueia-cloud。
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
| 社区广场、聊天室、私信、站内消息、排行榜、成就、**称号**、个人名片/空间、**反馈**、**活动页（游客可看）**、**创想造物（原站「造物集」：用户网页作品托管展示，含搜索/排序/点赞/我的作品，2026-10-11 对比后加入）** | ✅ 保留 | ④ |
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

Vite 7 + React 19 + TypeScript strict；Tailwind CSS v4（CSS-first `@theme`）；shadcn/ui（源码入库可改）+ Radix UI + lucide-react；React Router v7 library 模式（BrowserRouter）；TanStack Query v5（服务端状态）；react-hook-form + zod（表单）；自研轻量 i18n provider；MSW v2（mock）；Vitest + Testing Library + Playwright（测试）；marked + DOMPurify（Markdown，预留）。**包管理器定版 npm（2026-10-07 用户拍板）。**目录按 `src/features/<模块>` 组织。

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
- 全量子路由先建「建设中」占位页：email、tempbox、settings、ai、frp、proxy、profile、space、community、gallery、chat、dm、messages、points、leaderboard、achievements、donations、toolbox、feedback、events/:id、apiset、oauth、admin。
- **侧栏布局对齐参考站实测结构**：平铺主导航（概览/邮箱/临时分享箱/AI 中转站/内网穿透/代理节点/个人名片/社区广场/创想造物/工具箱）+ 底部独立项（反馈/捐献与邀请/积分与商城/账户设置）+ **底部用户块**（头像角色环 + 昵称 + 邮箱 + 账户菜单）；顶栏含积分 chip + 两个未读铃铛 + 语言 + 主题 + 账户菜单。**不做分组标题式侧栏**（2026-10-11 用户拍板）。原站「AI实验室（实验 中）」未纳入范围。
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

## 7. 环境与工作流（本机实际状态 + 强制工作流）

### 7.1 强制工作流（用户拍板，2026-10-07 生效）

- **开发代码在本机（Windows）环境**：写代码、跑 `npm run dev` / `npm run build` 都在 Windows 侧。
- **测试在 WSL 环境**：Vitest / Playwright 一律在 WSL Ubuntu 里跑（见 §8 命令），不在 Windows 侧跑测试。
- **每次更新代码后必须同步到 GitHub**：`git commit` + `git push origin main`（仓库 `wsz410728/xueia-cloud`，gh 已设备码登录、凭据走 keyring）。不允许攒批——一个功能点一推。

### 7.2 环境状态（2026-10-11 更新）

- **Windows 本机**：git 2.55 + gh 2.102（已登录 wsz410728）+ Node.js v24 已装（winget）。**系统 shell 是 cmd**：`grep`/`sed`/`head`/`wc`/`find` 等 Unix 工具**不存在**，管道 `|`、`&&` 后半段可能被静默截断。复杂文本处理用 PowerShell（`Select-String`、正则 Matches），或写成 `.ps1` 脚本文件再 `powershell -ExecutionPolicy Bypass -File` 执行（注意：路径用正斜杠 `D:/...`，反斜杠会被 shell 吃掉）。
- **WSL Ubuntu 26.04**：git + Node v22（NodeSource）。
- **mock 会话特性（预期行为，勿当 bug）**：MSW 会话存在 worker 内存里，**SPA 内部导航（Link 点击）会话保持；整页跳转/刷新（goto/reload）会重置回未登录**。验收或 E2E 走全链路时用 SPA 导航。
- **PWA SW 与 MSW 冲突（已修，2026-10-11）**：`/sw.js` 与 `/mockServiceWorker.js` 同 scope `/`，两个 SW 只能一个生效——**PWA SW 仅生产环境注册**（main.tsx `registerServiceWorker`），dev 启动时主动清掉遗留注册，否则 MSW 被挤掉、API 全 404。
- `doulor-analysis/` 是分析产物不是项目代码：不要在其中开发，已被 `.gitignore` 排除出公开仓库。
- 变更前必读：`docs/superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md`（设计文档，一切实现以它为准）、`docs/api.md`（接口登记册，写接口代码前先查）。

## 8. 验证命令与双平台依赖策略

- **Windows（开发）**：`npm run dev`（5173 端口）/ `npm run build`（tsc --noEmit + vite build）/ `npm run preview`。
- **WSL（测试）**：注意必须用**非登录 shell**（`bash -lc` 会因 Windows PATH 污染报 export 错误）：
  `wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npm install --no-fund --no-audit >/dev/null 2>&1; npm test"`
- **双平台 node_modules**：esbuild/rollup/lightningcss/tailwind-oxide 的原生二进制按「当前执行 npm install 的平台」安装。WSL 跑测试前先在 WSL 里 `npm install`（增量、很快，只换平台二进制）；回到 Windows 开发前再在 Windows 侧 `npm install` 换回。**不要试图把两平台二进制写成显式依赖**（已实测：npm 对平台不匹配的直接依赖硬报 ENOTSUP）。dev server 运行中不要在另一侧换二进制（文件锁）。
