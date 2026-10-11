# Xueia Cloud — API 接口文档（项目接口登记册）

> **文档导航**：[AGENTS.md 项目知识库](../AGENTS.md) ｜ [设计文档](superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md) ｜ 本文件 = 接口契约的唯一权威
> **维护规则（强制）**：每新增、修改或 mock 一个接口，必须同步更新本文件对应条目的状态与参数表；未登记的接口视同不存在（完整同步规则见 AGENTS.md §0.2）。
> **状态标记**：✅ 已对接真实后端 ｜ 🟡 Mock 已实现（前端完成，MSW 返回） ｜ ⬜ 计划中/未开发
> **路径约定**：所有路径统一挂在版本前缀 **`/api/v1`** 下（由 `src/lib/api-client.ts` 的 baseURL 拼接；下文各条目省略该前缀；MSW handlers 拦截时含前缀）。破坏性变更升 `/api/v2`，旧版本由后端保留一个运营周期。

---

## 1. 全局约定

| 项 | 约定 |
|---|---|
| Base URL | 同源相对 `/api/v1`（部署期由托管层反代到后端 Worker）；开发态由 MSW 拦截，无需真实后端 |
| 认证方式 | HttpOnly Cookie 会话（前端不读不存 token）；登录后浏览器自动携带 |
| 请求格式 | `Content-Type: application/json`（文件上传除外，用 `multipart/form-data`） |
| 响应 envelope | 成功 `{ "ok": true, "data": ... }`；失败 `{ "ok": false, "error": { "code": "AUTH_REQUIRED", "message": "人类可读信息" } }` |
| 时间格式 | ISO 8601 UTC（如 `2026-10-07T12:00:00Z`） |
| ID 格式 | UUID v4 字符串 |
| 分页约定 | 请求 `?page=1&pageSize=20`；响应 `data: { "items": [...], "total": 123, "page": 1 }`（无限流列表用 `nextCursor` 替代 page） |
| 401 处理 | api-client 统一捕获 → 清登录态 → 跳 `/login?from=<当前路径>`，业务代码不重复处理 |
| 429 处理 | 后端返 `Retry-After`；api-client 统一 toast「操作太频繁」并在触发控件倒计时禁用重试（无 `Retry-After` 默认 30s），各页不自行节流 |
| 枚举值 | 一律小写下划线（如 `pending`、`auto_passed`），与后端 DTO 对齐 |

## 2. 错误码规范（指令编码）

- 格式：**大写 + 下划线，域前缀开头**：`AUTH_*`、`MAILBOX_*`、`POINTS_*`、`ADMIN_*`、`SYS_*`。
- 新增错误码必须先在本表登记，再在代码中使用。

### 2.1 全局错误码

| code | HTTP | 说明 |
|---|---|---|
| `SYS_BAD_REQUEST` | 400 | 参数校验失败（message 说明具体字段） |
| `AUTH_REQUIRED` | 401 | 未登录或会话过期 |
| `AUTH_FORBIDDEN` | 403 | 已登录但无权限 |
| `SYS_NOT_FOUND` | 404 | 资源不存在 |
| `SYS_RATE_LIMITED` | 429 | 请求过频 |
| `SYS_INTERNAL` | 500 | 服务器内部错误 |
| `SYS_MAINTENANCE` | 503 | 功能维护中（对应原站「管理员暂时关闭」模式） |

### 2.2 认证域错误码（首批）

| code | HTTP | 说明 |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | 用户名/邮箱或密码错误 |
| `AUTH_2FA_REQUIRED` | 401 | 需要 2FA（响应 data 携带 2FA 会话票据） |
| `AUTH_2FA_INVALID` | 401 | 动态码/邮箱验证码/恢复码错误 |
| `AUTH_2FA_EXPIRED` | 401 | 2FA 会话票据过期，需重新登录 |
| `AUTH_BANNED` | 403 | 账号被封禁（data 携带申诉所需信息） |
| `AUTH_INVITE_INVALID` | 400 | 邀请码无效/已用尽 |
| `AUTH_USERNAME_TAKEN` | 409 | 用户名已被占用 |
| `AUTH_EMAIL_TAKEN` | 409 | 邮箱已被占用 |
| `AUTH_PASSWORD_MISMATCH` | 400 | 两次密码不一致 |
| `AUTH_REG_CLOSED` | 403 | 注册未开放（data 携带开放时间窗） |

### 2.3 邮箱域错误码（批次②）

| code | HTTP | 说明 |
|---|---|---|
| `MAILBOX_ADDR_TAKEN` | 409 | 该邮箱地址已存在（同一域名下不可重复） |
| `MAILBOX_CODE_INVALID` | 400 | 转发验证码错误或已过期 |

## 3. 接口登记表

> 登记模板（复制使用）：
>
> ```markdown
> #### METHOD /path
> - 状态：🟡（mock 已实现）｜🟡｜✅
> - 说明：一句话
> - 请求：字段表（字段/类型/必填/说明）
> - 响应：data 结构
> - 错误码：本接口特有 code（全局码不重复列）
> ```

### 3.1 认证域 auth（第一批范围）

#### POST /login
- 状态：🟡（mock 已实现）
- 说明：用户名或邮箱 + 密码登录；开启 2FA 时抛 `AUTH_2FA_REQUIRED`，票据在 `ApiError.data.twoFactorTicket`（客户端侧）。
- 请求：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| account | string | 是 | 用户名或邮箱 |
| password | string | 是 | 登录密码 |

- 响应 data：未开 2FA → `{ "user": UserSummary }`；需要 2FA → 401 + `{ "code": "AUTH_2FA_REQUIRED", "data": { "twoFactorTicket": string, "methods": ["totp","email","recovery"] } }`
- 错误码：`AUTH_INVALID_CREDENTIALS`、`AUTH_BANNED`（data: `{ "reason": string, "suspendAt": string, "canAppeal": boolean }`）

#### POST /login/2fa
- 状态：🟡（mock 已实现）
- 说明：凭 2FA 会话票据提交第二因子，成功后种下会话 Cookie。
- 请求：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| ticket | string | 是 | /login 返回的 twoFactorTicket |
| method | string | 是 | `totp` \| `email` \| `recovery` |
| code | string | 是 | 6 位动态码 / 邮箱验证码 / 恢复码 |

- 响应 data：`{ "user": UserSummary }`
- 错误码：`AUTH_2FA_INVALID`、`AUTH_2FA_EXPIRED`

#### POST /login/2fa/send-email
- 状态：🟡（mock 已实现）
- 说明：向账号邮箱发送 2FA 验证码（限频，`SYS_RATE_LIMITED`）。
- 请求：`{ "ticket": string }`
- 响应 data：`{ "sentTo": "a***@example.com" }`（脱敏邮箱）

#### POST /register
- 状态：🟡（mock 已实现）
- 说明：邀请码注册；成功即自动登录。
- 请求：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 3-24 位字母数字下划线，决定 `username@xueia.com` 邮箱 |
| realEmail | string | 是 | 真实邮箱，用于验证与找回密码 |
| password | string | 是 | ≥8 位 |
| passwordConfirm | string | 是 | 与 password 一致 |
| inviteCode | string | 是 | 邀请码（注册必需，链接可自动填充） |
| agreeTerms | boolean | 是 | 必须为 true |

- 响应 data：`{ "user": UserSummary }`
- 错误码：`AUTH_INVITE_INVALID`、`AUTH_USERNAME_TAKEN`、`AUTH_EMAIL_TAKEN`、`AUTH_PASSWORD_MISMATCH`、`AUTH_REG_CLOSED`

#### GET /register-status
- 状态：🟡（mock 已实现）
- 说明：注册开放状态与用户名预检。
- 请求 query：`?username=example`（可选，传了做占用预检）
- 响应 data：`{ "open": boolean, "openUntil": string | null, "usernameAvailable": boolean | null }`

#### POST /logout
- 状态：🟡（mock 已实现）
- 说明：销毁会话 Cookie。
- 请求：无 body
- 响应 data：`null`

#### GET /me
- 状态：🟡（mock 已实现）
- 说明：当前登录用户摘要（前端 `useMe()` 唯一数据源；401 = 未登录）。
- 响应 data：

```json
{
  "id": "uuid", "username": "string", "nickname": "string | null",
  "email": "user@xueia.com", "realEmailVerified": true,
  "avatarUrl": "string | null", "role": "member | admin | super",
  "emailVerified": false, "twoFactorEnabled": true
}
```

#### POST /password/forgot
- 状态：🟡（mock 已实现）
- 说明：发起找回密码，向真实邮箱发重置链接（始终返回成功，不泄露邮箱是否存在）。
- 请求：`{ "email": string }`；响应 data：`null`

#### POST /password/reset
- 状态：🟡（mock 已实现）
- 说明：凭邮件里的令牌重置密码。
- 请求：`{ "token": string, "password": string, "passwordConfirm": string }`
- 响应 data：`null`；错误码：`SYS_BAD_REQUEST`（token 无效/过期）

### 3.2 邮箱域 mailbox（批次②）

已实现 mock（🟡）：

| 接口 | 说明 | 参数 |
|---|---|---|
| `GET /mailbox` | 地址列表（含每地址 `messageCount`） | — |
| `POST /mailbox` | 新增地址（落库拼 `brand.emailDomain` 后缀） | `local: string`（1-20 位字母/数字/._-），错误 `MAILBOX_ADDR_TAKEN` / `SYS_BAD_REQUEST` |
| `POST /mailbox/{id}/update` | 修改转发目标 | `forwardTo: string \| null`；**变更后服务端重置 `forwardVerified=false`**（验证只能走 forward-verify） |
| `POST /mailbox/{id}/delete` | 删除地址 | — |
| `GET /mailbox/{id}` | 消息列表 | — |
| `POST /mailbox/{id}/messages/{mid}/read` | 单封已读 | — |
| `POST /mailbox/read-all` | 全部已读 | `mailboxId: string` |

待实现（批次②后续任务登记）：`/mailbox/{id}/messages/{mid}`(`/reply`)、`/mailbox/messages/batch-delete`、`/mailbox/forward-verify`、`/mailbox/temp`(+`/{id}/refresh`)。

### 3.3 账户与安全域 settings（批次 2，占位待登记）

- 资料：`/settings/username`、`/settings/nickname`、`/settings/avatar`、`/settings/notify`
- 真实邮箱绑定：`/settings/email`、`/settings/email/verify`
- 2FA 管理：`/settings/2fa`（disable/email/recovery/regenerate）、`/settings/2fa/totp/{start,confirm,disable}`
- 注销：`/settings/account/delete`、`/settings/account/delete-code`
- 申诉：`/appeal`（提交）、`/appeal/pending-reply`、`/appeal/acknowledge`
- 错误码前缀：`SETTINGS_*`、`APPEAL_*`（登记时补入第 2 节）

### 3.4 其余域（批次 3-6，占位待登记）

- **tempbox**：`/tempbox/config`、`/tempbox/create`（批次 2）
- **公告/强制确认**（批次 3）：`/announcements`、`/notice/pending`、`/notice/ack`
- **ai / dev**（批次 3）：`/proxy/{check,enable,disable,latency}`、`/dev/{keys,subscribe,sync,redeem,preflight,status,bind,password}`
- **points/checkin/vouchers**（批次 3）：`/points`(+`/redeem`/`/transfer`/`/products`/`/shop/buy`)、`/checkin`(+`/auto`/`/makeup`)、`/vouchers/redeem`、订单售后族
- **donations/invites**（批次 3）：`/donations`(+`/ai/probe`)、`/my-invites`(+`/claim`)
- **community/chat/dm/notifications/feedback**（批次 4）：`/community/*`、`/chat/*`、`/dm`(+`/conversations`/`/requests`/`/seen`/`/unread`)、`/notifications/*`、`/feedback`(+`/read`/`/reply`/`/upload-image`)
- **profile/space/titles/achievements/events/leaderboard**（批次 4）：`/profile`(+`/enable`/`/publish`/`/preview`)、`/my-space`、`/titles/{mine,display}`、`/achievements`、`/events`(+`/image`)、`/fun-links`（活动页游客可看，守卫白名单）
- **gallery 创想造物**（批次 4，游客可看）：`/gallery`（作品列表：搜索/排序）、`/gallery/collection`（创想集）、`/gallery/mine`（我的作品）——参考原站「造物集」语义，批次 4 时按模板登记
- **frp**（批次 5）：`/frp`(+`/apply`/`/cancel`/`/enable`/`/disable`)；**toolbox** 纯前端无接口
- **apiset/oauth**（批次 6）：`/dev/keys` 复用、`/api-doc`、`/oauth/{authorize/decision,grants,my-clients}`；**admin**：`/admin/*` 全族（批次 6）

原站端点全量对照表在 `doulor-analysis/api.js`（及 AGENTS.md 第 5.2 节的分组摘要），登记时从那里取路径与语义，参数结构按本项目 envelope 重新定义。
