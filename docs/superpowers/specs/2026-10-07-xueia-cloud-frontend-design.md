# Xueia Cloud 前端复刻 —— 设计文档

> **文档导航**：[AGENTS.md 项目知识库](../../../AGENTS.md) ｜ [api.md 接口登记册](../../api.md) ｜ 本文件 = 范围与架构的唯一权威
> **同步规则**：本文件只在范围/架构变更**经用户确认后**更新；接口与错误码的日常维护在 `docs/api.md`（规则见 AGENTS.md §0.2）。

日期：2026-10-07
状态：终审通过 · 落地完整版（审查后补入：账户设置/2FA 管理/申诉/公告强制确认/反馈/活动/称号的批次归属；新增第 10 节部署与环境变量、第 11 节工程约定；API 定版 `/api/v1`）
参考材料：`doulor-analysis/`（原站路由表、API 端点清单、zh/en 全量文案、CSS 设计令牌、页面截图）

## 1. 背景与目标

复刻 cloud.doulor.cn（Doulor Cloud，一个共建式私域云平台）的**前端**，品牌替换为用户自己的：**站名 Xueia，域名 xueia.com**。

- **最终目的**：将来真实运营一个类似平台。因此前端不是静态演示，API 客户端层按原站真实端点定型，后端可以后补。
- **成功标准**：第一批交付后，落地页、认证三页、控制台外壳在浏览器中完整可演示（mock 数据），代码结构允许后续模块按批次平稳填入。
- **复刻边界**：结构、交互、技术方案可对齐；品牌名、Logo、文案原文、美术资产（云朵图案等）一律用自己的，不照搬原站。

## 2. 范围

### 2.1 模块取舍（与原站的差异）

| 原站模块 | 本项目 | 批次 |
|---|---|---|
| 域名/DNS 管理、直链网盘 | ❌ 不要 | — |
| 域名邮箱 + 网页收件箱、临时分享箱（游客取件） | ✅ 保留 | ② |
| 账户设置（用户名/昵称/真实邮箱验证/头像/通知偏好/2FA 管理/恢复码/注销）、封禁申诉 | ✅ 保留（补漏） | ② |
| AI 中转站、捐献与邀请、积分与商城（签到/兑换券） | ✅ 保留 | ③ |
| 公告 + 强制确认弹窗（可前置捐献条件）（补漏） | ✅ 保留 | ③ |
| 社区广场、聊天室、私信、站内消息、排行榜、成就、称号（补漏） | ✅ 保留 | ④ |
| 反馈（截图粘贴/处理状态）、活动（参与/抽奖，游客可看）（补漏） | ✅ 保留 | ④ |
| 个人名片、个人空间 | ✅ 保留 | ④ |
| 内网穿透、代理节点、工具箱（约 35 个纯前端小工具） | ✅ 保留 | ⑤ |
| 管理后台、公开 API、OAuth2 提供方、PWA 完善 | ✅ 保留 | ⑥ |

### 2.2 第一批交付物（本设计 + 第一份实施计划的范围）

1. **工程骨架**：Vite + React 19 + TypeScript strict + Tailwind CSS v4 + shadcn/ui + React Router v7 + PWA 基础。
2. **设计系统**：设计令牌（浅/深双主题）+ 14 个基础组件（Button、Input、Label、Card、Dialog、DropdownMenu、Select、Tabs、Badge、Table、Toast、Tooltip、Switch、Avatar）。
3. **品牌配置**：`src/config/brand.ts` 单一来源（站名 Xueia、域名 xueia.com、Logo、社交链接、页脚文案）。
4. **落地页**：顶部毛玻璃 sticky 导航、Hero、九张能力卡（见 2.3）、三步流程、下载区（PWA/安卓/Windows 占位）、更新日志、FAQ 手风琴、社区入口（QQ/TG）、CTA、页脚。文案全部自写。
5. **认证三页**：登录（含 2FA 验证码/恢复码界面、环境自检面板）、注册（用户名实时预览 `username@xueia.com`、邀请码、密码确认、条款勾选）、忘记密码。react-hook-form + zod，mock 提交。
6. **控制台外壳**：玻璃拟态侧栏（分组导航 + 折叠 + 移动端抽屉）、顶栏（消息/私信未读铃铛、语言切换、主题切换、用户菜单）、概览页（欢迎区、统计卡【邮箱未读、AI 额度、积分、社区动态】、快捷操作【发邮件/开分享箱/充额度】、网站动态卡；静态数据）。
7. **路由与守卫**：全量路由表（未实施模块显示「建设中」占位页）；`/dashboard/*` 整组 requiresAuth，白名单例外机制（预留 tempbox/community 游客可访问规则）。
8. **API 层**：`src/lib/api-client.ts`（fetch 封装、统一错误 envelope、401 全局跳登录）+ 按域模块（`api/auth.ts`、`api/mailbox.ts`、`api/ai.ts`…端点路径对齐 `doulor-analysis/api.js` 提取的真实清单）+ MSW v2 mock handlers。
9. **工程细节**：主题防闪内联脚本、开屏动画（自有 Logo）、路由错误边界、chunk 加载失败自愈刷新（限 2 次/会话）、404 页、PWA manifest + Service Worker。

### 2.3 落地页能力卡（9 张，替代原站九宫格）

域名邮箱、网页收件箱、临时分享箱、个人名片、AI 中转站、内网穿透、代理节点、社区与聊天室、积分与商城。
（原站的「个人子域名」「DNS 管理」「直链网盘」三卡删除；徽章体系保留：邮箱/收件箱/名片/社区/积分 =「注册即用」，分享箱/AI/FRP/代理 =「贡献解锁」，具体归属实施时按运营策略可调。）

## 3. 技术栈

| 层 | 选择 |
|---|---|
| 构建 | Vite 7（rolldown 可选）+ React 19 + TypeScript strict |
| 样式 | Tailwind CSS v4（CSS-first `@theme` 配置） |
| 组件 | shadcn/ui（源码入库可改）+ Radix UI + lucide-react |
| 路由 | React Router v7（library 模式，BrowserRouter，与原站一致） |
| 服务端状态 | TanStack Query v5 |
| 表单 | react-hook-form + zod |
| i18n | 自研轻量 provider（flat key 字典，zh 先行、en 留结构，方案对齐原站） |
| Mock | MSW v2 |
| 测试 | Vitest + Testing Library；Playwright 一条主链路 E2E |
| Markdown（预留） | marked + DOMPurify |

## 4. 架构

### 4.1 目录结构

```
src/
  config/brand.ts          # 品牌单一来源
  i18n/                    # provider + zh/en 字典（flat key："nav.email": "邮箱"）
  lib/                     # api-client.ts、theme.ts、utils.ts(cn)
  api/                     # 按域端点模块，路径对齐真实清单
  mocks/                   # MSW handlers（按域分文件）
  components/ui/           # shadcn 基础组件
  features/
    landing/               # 落地页
    auth/                  # 登录/注册/忘记密码
    dashboard-shell/       # 侧栏/顶栏/守卫
    overview/              # 概览页
    <module>/              # 后续批次逐个加入（components/pages/api）
  routes.tsx               # 全量路由表 + 守卫
```

### 4.2 路由表（第一批实施全量占位）

公共：`/`、`/login`、`/register`、`/forgot-password`、`/terms`、`/privacy`、`/u/:username`（占位）、`/tempbox` 取件入口（占位）、`/appeal` 申诉页（占位，批次 ② 实施）。
控制台（requiresAuth，白名单例外机制预留）：`/dashboard`（实施）、`/dashboard/email`、`/dashboard/tempbox`、`/dashboard/settings`、`/dashboard/ai`、`/dashboard/frp`、`/dashboard/proxy`、`/dashboard/profile`、`/dashboard/space`、`/dashboard/community`、`/dashboard/chat`、`/dashboard/dm`、`/dashboard/messages`、`/dashboard/points`、`/dashboard/leaderboard`、`/dashboard/achievements`、`/dashboard/donations`、`/dashboard/toolbox`、`/dashboard/feedback`、`/dashboard/events/:id`（活动，游客可看）、`/dashboard/apiset`、`/dashboard/oauth`、`/dashboard/admin`（除 `/dashboard` 外为「建设中」占位）。
错误：`*` → 404 页。

### 4.3 数据流与状态

- 组件 → TanStack Query hook → `api/<域>.ts` 函数 → `api-client.ts` fetch → （开发态）MSW 拦截返回 mock /（未来）真实 Worker 后端。
- 纯客户端状态（侧栏折叠、主题、语言、布局偏好）→ localStorage + 轻量 store，不进 Query。
- 登录态：HttpOnly Cookie 会话（后端配合），前端只暴露 `useMe()` 查询；401 由 api-client 统一处理。

## 5. 设计系统

> 2026-10-07 用户拍板：视觉照搬原站的黑白极简方向（主色=前景色、emerald 强调），不另设品牌主色。

- **令牌**（CSS 变量，`@theme` 注册）：浅色底 `#fafafa`/深色底 `#0a0a0a`；主色 = 前景色（黑白反转按钮）；强调绿 emerald 仅用于「注册即用/已解锁/在线」徽章与状态点；`--radius: 0.625rem`；细边框、极淡阴影；完整令牌值参考 `doulor-analysis` 提取的 CSS，**数值可微调出自己个性**。
- **特征背景**：全站低对比度云朵 SVG 图案（mask 平铺），云形参数自绘，不复制原站图形。
- **字体**：Outfit（OFL 开源）+ PingFang SC / Microsoft YaHei / Noto Sans SC 回退；标题 `-0.02em` 字距。
- **特效**：玻璃拟态侧栏（backdrop-blur）、头像角色环（conic-gradient：琥珀=成员/玫红=管理/紫=超管）、`page-enter` 页面渐入、`data-fade` 卡片渐入、`prefers-reduced-motion` 全量降级。
- **组件策略**：shadcn/ui CLI 拉源码入库；业务组件归 `features/<模块>/components/`。

## 6. 错误处理

- **API envelope**：`{ ok: true, data } | { ok: false, error: { code, message } }`（前端先定型，写成 TS 类型；后端实现时对齐）。
- 401 → 清登录态、跳 `/login?from=<当前路径>`；403 → toast「无权限」；429 → toast「操作太频繁」并在触发控件上倒计时禁用重试（读 `Retry-After`，无则默认 30s）；网络/5xx → toast + 重试按钮。
- 路由分段错误边界（`/dashboard` 一处、公共区一处），兜底 UI：出错了 / 重新加载 / 返回首页。
- **chunk 自愈**：入口脚本加载失败或 12 秒未挂载 → 自动刷新；sessionStorage 限 2 次、间隔 ≥15 秒（复刻原站被真实事故验证过的方案）。
- 表单：字段级 zod 消息 + 提交失败 toast；登录页含环境自检（HTTPS/Cookie/LocalStorage 诊断）。

## 7. 安全（前端侧）

- 会话凭据走 HttpOnly Cookie，前端不存 token。
- UGC Markdown 渲染前过 DOMPurify；外链统一 `rel="noopener noreferrer"`。
- 用户名等用户可控字符串统一经转义组件展示。
- 品牌/域名常量集中在 `brand.ts`，避免散落硬编码。

## 8. 测试

- **Vitest + Testing Library**：基础组件冒烟；路由守卫三态（已登录/未登录/白名单例外）；api-client 错误分支（401/403/5xx）。
- **Playwright E2E 主链路**：落地页 → 注册（mock）→ 登录 → 概览 → 退出。后续每批次追加对应模块 E2E。
- 不追求覆盖率指标；视觉回归暂缓。

## 9. 后续批次地图（每批独立可演示）

1. **本批**：骨架 + 设计系统 + 落地页 + 认证三页 + 控制台外壳 + API/mock 层。
2. 邮箱（域名邮箱、网页收件箱、转发）+ 临时分享箱（生成取件码、游客解锁取件）+ **账户设置**（用户名/昵称/真实邮箱验证/头像/通知偏好/**2FA 管理与恢复码**/注销）+ **封禁申诉**（登录页 `AUTH_BANNED` 钩子在此批闭环）。
3. AI 中转站（接入信息、Key 管理、额度展示）+ 捐献与邀请 + 积分与商城（签到、兑换券）+ **公告与强制确认弹窗**（含「需先捐献」前置条件）。
4. 社区广场 + 聊天室 + 私信 + 站内消息 + 排行榜 + 成就 + **称号** + 个人名片/空间 + **反馈** + **活动页**（参与/抽奖，游客可看 → 进守卫白名单）。
5. 内网穿透 + 代理节点 + 工具箱（35 个纯前端小工具，可再按优先级内切）。
6. 管理后台 + PWA 完善（安装引导、离线壳）+ 公开 API/OAuth 页面。

## 10. 部署与环境变量

### 10.1 部署目标（本项目的交付物之一）

- **前端**：Vite `npm run build` 产出纯静态目录（`dist/`），部署到**任意静态托管**即可；推荐 **Cloudflare Pages**（与未来后端 Worker/R2 同生态、免 CDN 费用、原生支持 SPA 回退）。回退规则：所有路由 → `index.html`（404.html 仅真 404 页用，SPA 路由必须回 200 + index）。
- **API 基址**：前端所有请求走 `/api/v1/*`（同源相对路径）。部署期由托管层把 `/api/v1/*` 反代到后端 Worker（Workers 路由或 Pages Functions）。这样前端包不含后端域名、无 CORS 预检，未来后端换实现只改路由。
- **Service Worker**：`sw.js` 必须部署在域名根且不被 CDN 长缓存（`Cache-Control: no-cache`）；**改 SW 逻辑或其缓存的静态资源时，必须手动递增 `sw.js` 里的 `CACHE` 版本号**（如 `xueia-shell-v1` → `v2`），否则老用户拿不到新版本——这是原站真实踩过的坑（缓存策略细节见 AGENTS.md §4.3、修复规范见 §6.2）。
- **环境变量**（`.env`，构建期注入，`VITE_` 前缀）：

  | 变量 | 用途 | 示例/默认 |
  |---|---|---|
  | `VITE_API_BASE` | API 前缀，默认 `/api/v1` 同源 | 生产同源反代时留默认 |
  | `VITE_ENABLE_MSW` | 是否启用 mock 层 | 开发 `true`（默认），生产构建 `false` |
  | `VITE_SENTRY_DSN` | 错误上报（可空则不启用） | 选填 |
- **站点级配置**（非密，构建期常量，来自 `brand.ts`）：**域名邮箱后缀做成可配置项 `emailDomain`（默认 `xueia.com`，用户 2026-10-07 拍板不写死）**、支持邮箱、社交链接（QQ 群/TG 暂用占位符）。**Logo 方案**：文字 Logo（Xueia）+ 自绘云朵 SVG 占位，后续可换真实素材。**任何密钥（CF Token、Brevo Key、NewAPI 凭据、R2）都属于后端/部署层，严禁进前端包。**

### 10.2 后端依赖清单（运营前置，非第一批编码，但记录以免遗漏）

| 服务 | 用途 | 需要的账号/密钥（后端侧） |
|---|---|---|
| Cloudflare Pages | 前端托管 | CF 账号 |
| Cloudflare Workers + D1/R2 | 后端 API + 数据 + 分享箱存储 | Worker + D1 + R2 |
| Cloudflare Email Routing + Brevo | 域名邮箱收信 + 转发 | xueia.com MX/SPF/DKIM；Brevo SMTP Key |
| NewAPI | AI 中转站 | NewAPI 实例 + 管理员凭据 |
| frps + 面板 | 内网穿透 | frps 服务器 + 管理令牌 |
| Sentry（可选） | 前端错误/性能监控 | DSN |

## 11. 工程约定（可考核项）

### 11.1 性能预算

- **入口 JS**：首屏（落地页/登录页）下载 gzip 后 ≤ 300KB；vendor-react / vendor-ui(Radix) / i18n / utils / api 按域拆包 + `React.lazy` 路由分包（对齐原站思路，但总量控制在原站 1.6MB 的 1/5）。
- **落地页 Core Web Vitals**（桌面 4G 模拟）：LCP ≤ 2.5s、CLS ≤ 0.1、INP ≤ 200ms。
- 字体：Latin 字体子集化 + `font-display: swap`；图片走 AVIF/WebP；图标用内联 SVG / 按需 lucide。

### 11.2 浏览器兼容目标

- 现代常青浏览器：Chrome/Edge/Firefox/Safari 最近两个大版本 + iOS Safari 15+ / Android WebView（Chrome 92+）。Vite 默认 `es2018` target；不刻意兼容 IE / 旧 Safari。PWA 安装引导对不支持的环境降级为手动步骤（原站已验证）。

### 11.3 无障碍（WCAG 2.1 AA 基线）

- 复用 shadcn/ui + Radix 自带的键盘导航与焦点管理（Tab/Enter/Esc、焦点圈 `aria-modal`）。
- 规则：图标按钮必有 `aria-label`（原站铃铛/主题/语言如此）；表单控件关联 `Label`（已入设计系统）；焦点可见环不删除（`outline-visible`）；颜色对比 ≥ 4.5:1（黑白主色天然满足）；`prefers-reduced-motion` 关闭所有动画（第 5 节）。

### 11.4 API 版本与限流

- 路径版本 `/api/v1`；破坏性变更升 `/api/v2`，旧版本由后端保留一个运营周期。
- 限流：后端返 `429 + Retry-After`；前端第 6 节统一「倒计时禁用重试」处理，各页不自行实现节流。

## 12. 明确不做（YAGNI）

- SSR/SEO 框架（邀请制工具站 + PWA，SPA 足够，与原站同构）。
- 微前端、monorepo（单包即可）。
- 单元测试覆盖率指标、视觉回归（后续需要再加）。
- 后端实现（本设计只定型接口契约与 mock）。

## 13. 风险与开放问题

- **后端契约风险**：envelope 与错误码由前端先定，后端落地时需回头对齐——已在第 6 节定为「前端先定型」，错误码登记在 `docs/api.md`；路径版本已定 `/api/v1`（第 11.4 节）。
- **邮箱基础设施**：原站用 Cloudflare Email Routing + Brevo 转发；域名管理模块去掉后，`xueia.com` 的邮件路由需在 Cloudflare 控制台人工配置（运维事项，不阻塞前端）。
- **开放问题（不阻塞第一批）**：贡献解锁的资源类型（AI 渠道/FRP/代理之外是否增加）；具体套餐与额度数值（mock 数据先用占位，批次 3 前定）。
