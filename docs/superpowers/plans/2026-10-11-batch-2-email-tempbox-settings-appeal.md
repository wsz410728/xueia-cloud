# 批次②实施计划：邮箱完整版 + 临时分享箱 + 账户设置 + 申诉

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把批次②的四个模块从「占位/半 mock」做成可用功能：邮箱完整版（地址管理/收件箱操作/临时邮箱/邮件转发验证）、临时分享箱（生成取件码 + 游客免登录取件）、账户设置（资料/2FA 管理/动效与通知偏好/危险区/公开 API 卡）、封禁申诉。

**Architecture:** 全部走既定三层：页面组件 → TanStack Query hook → `src/api/<域>.ts` → `api-client.ts`（envelope + 401 处理）→ 开发态 MSW 拦截。批次②不引入新架构，只按既有模式补 api 模块、mock handlers、页面与测试。参考站三页的真实结构已实测（见每任务开头的「参考站实测」），按实测结构实现，禁止凭空推导布局。

**Tech Stack:** React 19 + TypeScript strict + Tailwind v4 + shadcn 风格组件（`data-slot` 约定）+ Radix + TanStack Query v5 + react-hook-form + zod + MSW v2 + Vitest；新增依赖仅 `qrcode.react`（2FA 二维码）。

**Spec:** `docs/superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md`（批次②范围见 §2.1 表与 §9 批次地图；契约见 `docs/api.md`）

## Global Constraints

- **品牌单一来源**：站名/域名/邮箱后缀只从 `src/config/brand.ts` 取（`brand.emailDomain` 默认 `xueia.com`）；禁止硬编码站名文案。
- **文案自写**：不照抄参考站文案；界面文案一律走 i18n flat key（`src/i18n/zh.ts` / `en.ts` 同 key 对称，命名空间：`mb.` `tb.` `settings.` `s2fa.` `appeal.`）。
- **API 契约**：路径统一 `/api/v1/*`（`api-client.ts` 拼前缀）；响应 envelope `{ok:true,data}` / `{ok:false,error:{code,message}}`；新接口/错误码**先登记进 `docs/api.md`** 再写代码。
- **会话与守卫**：HttpOnly Cookie（mock 用内存会话，整页刷新会重置，属预期）；`/tempbox` 取件页与 `/appeal` 为公开路由；`/dashboard/tempbox` 需登录（分享端），`/tempbox` 游客可访问。
- **组件约定**：基础组件带 `data-slot`；页面标题用 `<PageHeader>`（`TitleChars` 逐字动画）；卡片圆角 `rounded-md`（6px）；深色令牌沿用 `src/index.css` 现值，不得改。
- **测试与提交**：测试**只在 WSL 跑**（`wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npm test"`）；构建在本机 Windows（`npm run build`）；**每个任务结束必须 commit + push origin main**（AGENTS.md §0.2 强制）。
- **TDD**：先写失败测试 → 跑失败 → 最小实现 → 跑通过 → 提交。

## Review Focus

以下五类「规格没写但一定会遇到」的输入/状态，各任务必须用测试钉住（本计划已在对应任务中加入）：

1. **失效/过期/不存在的接收码**（分享箱取件）：应显示友好过期态，不得白屏或抛未捕获错误。
2. **边界长度输入**（昵称 2-16、用户名 3-24、申诉说明 ≥10 字）：实时计数与前后端一致的校验，超限禁止提交且给出可读提示。
3. **超限/不支持类型的上传**（头像 2MB、分享箱单文件 100MB、头像仅 JPG/PNG/WebP/GIF）：前端前置拦截并提示，不发起请求。
4. **游客 vs 登录态**（分享箱）：游客可解锁取件与下载，但**上传入口提示需登录**；未登录直接访问 `/dashboard/tempbox` 被守卫弹回登录页。
5. **2FA 中断与一次性信息**（恢复码只显示一次、未 confirm 就离开）：状态可恢复；恢复码展示后明确提示「只显示一次，请立即保存」。
6. **剪贴板失败**（非 https/localhost 打开）：复制分享链接失败时回退到「手动选中复制」提示，不静默失败。

---

## Task 1: 邮箱地址管理（列表 / 添加 / 设置 / 删除）

**Files:**
- Modify: `src/api/mailbox.ts`（扩展地址 CRUD）
- Modify: `src/api/types.ts`（若需共享类型）
- Modify: `src/mocks/handlers.ts`（地址 CRUD mock）
- Modify: `src/features/mailbox/MailboxPage.tsx`（地址卡接真实接口 + 添加/设置对话框）
- Create: `tests/api/mailbox.test.ts`

**Interfaces:**
- Consumes: `request/get/post`（`src/lib/api-client.ts`）、`MailboxAddress`（既有）。
- Produces: `mailboxApi.listAddresses(): Promise<{addresses: MailboxAddress[]}>`、`mailboxApi.addAddress(local: string): Promise<MailboxAddress>`、`mailboxApi.updateAddress(id, patch): Promise<MailboxAddress>`、`mailboxApi.deleteAddress(id): Promise<null>`；`MailboxAddress` 增补 `messageCount: number`。

**参考站实测结构**：页头副标题位置显示「N / M 个地址」；工具栏「写邮件」「添加邮箱」；每个地址一张卡显示 `地址` / `N 封邮件` / `已转发 → 目标`；卡右侧齿轮（设置）。

- [ ] **Step 1: 写失败测试**

```ts
// tests/api/mailbox.test.ts
import { describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"

describe("mailboxApi address CRUD", () => {
  it("lists addresses with message counts", async () => {
    const res = await mailboxApi.listAddresses()
    expect(Array.isArray(res.addresses)).toBe(true)
    expect(res.addresses[0]).toHaveProperty("messageCount")
  })

  it("adds an address under brand email domain", async () => {
    const created = await mailboxApi.addAddress("hello")
    expect(created.address).toBe("hello@xueia.com")
  })

  it("rejects duplicate/invalid local part", async () => {
    await expect(mailboxApi.addAddress("yanxi")).rejects.toMatchObject({ code: "MAILBOX_ADDR_TAKEN" })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npx vitest run tests/api/mailbox.test.ts"`
Expected: FAIL（`addAddress is not a function`）

- [ ] **Step 3: 扩展 api 模块**

```ts
// src/api/mailbox.ts（在既有 mailboxApi 内追加；MailboxAddress 加 messageCount: number）
addAddress: (local: string) => post<MailboxAddress>("/mailbox", { local }),
updateAddress: (id: string, patch: { forwardTo?: string | null; forwardVerified?: boolean }) =>
  post<MailboxAddress>(`/mailbox/${encodeURIComponent(id)}/update`, patch),
deleteAddress: (id: string) => post<null>(`/mailbox/${encodeURIComponent(id)}/delete`),
```

- [ ] **Step 4: 补 mock handlers**（`src/mocks/handlers.ts` 的 `mailboxHandlers` 内）

```ts
http.post(`${API}/mailbox`, async ({ request }) => {
  if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
  const { local } = (await request.json()) as { local: string }
  if (!/^[a-z0-9._-]{1,20}$/i.test(local)) return fail(400, "SYS_BAD_REQUEST", "地址格式不正确")
  const addr = `${local}@${brand.emailDomain}`
  if (mockAddresses.some((a) => a.address === addr)) return fail(409, "MAILBOX_ADDR_TAKEN", "该地址已存在")
  const created: MailboxAddress = { id: `mb-${Date.now()}`, address: addr, forwardTo: null, forwardVerified: false, messageCount: 0, createdAt: new Date().toISOString() }
  mockAddresses.push(created)
  return ok(created)
}),
http.post(`${API}/mailbox/:id/update`, async ({ params, request }) => {
  const a = mockAddresses.find((x) => x.id === params.id)
  if (!a) return fail(404, "SYS_NOT_FOUND", "地址不存在")
  Object.assign(a, await request.json())
  return ok(a)
}),
http.post(`${API}/mailbox/:id/delete`, ({ params }) => {
  const i = mockAddresses.findIndex((x) => x.id === params.id)
  if (i >= 0) mockAddresses.splice(i, 1)
  return ok(null)
}),
```

同时给 `mockAddresses` 样本补 `messageCount`（yanxi 地址 4、noreply 0），并把 `listAddresses` handler 的返回改为计算出的真实计数：

```ts
http.get(`${API}/mailbox`, () => {
  if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
  return ok({ addresses: mockAddresses.map((a) => ({ ...a, messageCount: mockMessages.filter((m) => m.mailboxId === a.id).length })) })
}),
```

- [ ] **Step 5: 页面接真实数据 + 添加/设置对话框**（`MailboxPage.tsx`）

地址卡改为渲染 `a.messageCount`；「添加邮箱」打开 Dialog（输入 local part，实时预览 `local@xueia.com`，提交调 `addAddress` 后 `invalidateQueries(["mailbox","addresses"])`）；齿轮打开 Dialog（显示地址/创建时间、转发目标编辑、解绑转发、删除地址带二次确认）。删除与解绑用 `common.delete` / `common.confirm` 文案。

- [ ] **Step 6: 跑测试与构建**

Run: `wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npm test"` → 通过；再 `npm run build` → 通过。
手动验收（浏览器）：添加 `hello@xueia.com` 成功；重复添加报错；删除后列表消失。

- [ ] **Step 7: 登记接口 + 提交**

更新 `docs/api.md` §3.2 登记 `POST /mailbox`、`/mailbox/{id}/update`、`/mailbox/{id}/delete` 与 `MAILBOX_ADDR_TAKEN` 错误码。

```bash
git add -A && git commit -m "feat(mailbox): 地址管理（列表计数/添加/设置/删除）+ 契约登记" && git push origin main
```

---

## Task 2: 收件箱操作（已读 / 全部已读 / 批量删除 / 回复）

**Files:**
- Modify: `src/api/mailbox.ts`、`src/mocks/handlers.ts`
- Modify: `src/features/mailbox/MailboxPage.tsx`（列表交互 + 邮件详情抽屉）
- Create: `tests/api/mailbox-messages.test.ts`

**Interfaces:**
- Produces: `mailboxApi.markAllRead(mailboxId)`、`mailboxApi.batchDelete(mailboxId, ids: string[])`、`mailboxApi.reply(mailboxId, messageId, body: string)`、`mailboxApi.getMessage(mailboxId, messageId): Promise<MailMessage>`；`MailMessage` 增补 `body: string`（正文纯文本）。

**参考站实测结构**：收件箱为列表（subject + 摘要 + 发件人 + 相对时间）；空态两行文案（「收件箱是空的」/「发往 X 的邮件会出现在这里」）。

- [ ] **Step 1: 写失败测试**

```ts
// tests/api/mailbox-messages.test.ts
import { describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"

describe("mailboxApi message ops", () => {
  it("marks a message read", async () => {
    await mailboxApi.markRead("mb-1", "m-1")
    const { messages } = await mailboxApi.listMessages("mb-1")
    expect(messages.find((m) => m.id === "m-1")?.read).toBe(true)
  })

  it("batch deletes by ids", async () => {
    await mailboxApi.batchDelete("mb-1", ["m-2"])
    const { messages } = await mailboxApi.listMessages("mb-1")
    expect(messages.some((m) => m.id === "m-2")).toBe(false)
  })

  it("returns full body for a message", async () => {
    const msg = await mailboxApi.getMessage("mb-1", "m-1")
    expect(typeof msg.body).toBe("string")
  })
})
```

- [ ] **Step 2: 跑测试确认失败** → Expected: FAIL（方法不存在）
- [ ] **Step 3: 扩展 api**

```ts
batchDelete: (mailboxId: string, ids: string[]) => post<null>("/mailbox/messages/batch-delete", { mailboxId, ids }),
reply: (mailboxId: string, messageId: string, body: string) =>
  post<null>(`/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/reply`, { body }),
getMessage: (mailboxId: string, messageId: string) =>
  get<MailMessage>(`/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}`),
```

- [ ] **Step 4: mock**：`batch-delete` 按 ids 从 `mockMessages` 删除；`reply` 校验 body 非空后 `ok(null)`；`GET .../messages/:mid` 返回该消息（`body` 用 `excerpt` 重复两段拼成，保证有内容）。
- [ ] **Step 5: 页面交互**：列表项点击 → 右滑/抽屉显示详情（`getMessage`），带「回复」文本框（提交调 `reply`）；列表项勾选框 + 顶部「批量删除」（`common.delete`）；「全部已读」接 `markAllRead` 并 invalidate。
- [ ] **Step 6: 跑测试 + 构建 + 手动验收**（任一方法同 Task 1 Step 6）
- [ ] **Step 7: 登记接口 + 提交**

```bash
git add -A && git commit -m "feat(mailbox): 收件箱操作（已读/全部已读/批量删除/回复/详情）" && git push origin main
```

---

## Task 3: 临时邮箱（生成 / 换一个 / 刷新）+ 转发目标验证

**Files:**
- Modify: `src/api/mailbox.ts`、`src/mocks/handlers.ts`
- Modify: `src/features/mailbox/MailboxPage.tsx`（TempMailbox 接真实接口，去掉随机数假实现）
- Create: `tests/api/tempbox-mail.test.ts`

**Interfaces:**
- Produces: `mailboxApi.getTemp(): Promise<{ address: string | null; expiresAt: string | null }>`、`mailboxApi.createTemp()`、`mailboxApi.refreshTemp()`、`mailboxApi.sendForwardVerify(mailboxId, email)`、`mailboxApi.verifyForward(mailboxId, code)`。

**参考站实测结构**：临时邮箱区 = 「临时邮箱」标题 + `0 / 1` 配额 + 「生成」按钮；生成后显示当前地址 + 「换一个」+ 说明文案「注册不想留真实地址的网站时用。生成后点『换一个』立刻得到新地址，旧地址随即作废。」

- [ ] **Step 1: 写失败测试**

```ts
// tests/api/tempbox-mail.test.ts
import { describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"

describe("temp mailbox", () => {
  it("creates then refreshes to a different address", async () => {
    const a = await mailboxApi.createTemp()
    expect(a.address).toMatch(/@temp\./)
    const b = await mailboxApi.refreshTemp()
    expect(b.address).not.toBe(a.address)
  })

  it("verifies forward code", async () => {
    await mailboxApi.sendForwardVerify("mb-1", "me@example.com")
    await expect(mailboxApi.verifyForward("mb-1", "000000")).rejects.toMatchObject({ code: "MAILBOX_CODE_INVALID" })
    await expect(mailboxApi.verifyForward("mb-1", "123456")).resolves.toBeTruthy()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: api 实现**（按上面 Interfaces 签名，路径 `/mailbox/temp`、`/mailbox/temp/{id}/refresh`、`/mailbox/forward-verify`）
- [ ] **Step 4: mock**：临时地址形如 `temp-xxxxxx@temp.xueia.com`，`refresh` 生成新值并作废旧值；`forward-verify` 固定校验码 `123456`，错误抛 `MAILBOX_CODE_INVALID`。
- [ ] **Step 5: 页面接线**：`TempMailbox` 用 Query（key `["mailbox","temp"]`）替换本地 `useState` 随机串；生成/换一个/刷新按钮接三个方法；显示过期时间。
- [ ] **Step 6: 跑测试 + 构建 + 手动验收**
- [ ] **Step 7: 登记接口 + 提交**

```bash
git add -A && git commit -m "feat(mailbox): 临时邮箱与转发验证接真实契约" && git push origin main
```

---

## Task 4: 账户设置页骨架（七分类筛选 + 卡片容器）

**Files:**
- Create: `src/features/settings/SettingsPage.tsx`
- Modify: `src/i18n/zh.ts`、`src/i18n/en.ts`（`settings.*` 命名空间）
- Modify: `src/routes.tsx`（`settings` 路由由 SectionPlaceholder 换成 SettingsPage）
- Create: `tests/components/settings-page.test.tsx`

**Interfaces:**
- Produces: `<SettingsPage />`；内部 `SETTINGS_CATEGORIES: Array<{key:"all"|"account"|"general"|"security"|"notify"|"api"|"danger"; labelKey:string}>`；卡片组件契约 `<SettingCard title category>` 供后续任务复用。

**参考站实测结构**：h1「设置」+ 副标题「管理你的账户信息。」+ **七个筛选按钮**（全部/账户/通用/安全/通知/API/危险区）+ 卡片列表（每张卡 = 标题 + 描述 + 表单/控件）。

- [ ] **Step 1: 写失败测试**

```tsx
// tests/components/settings-page.test.tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { I18nProvider } from "@/i18n"
import { SettingsPage } from "@/features/settings/SettingsPage"

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><I18nProvider><MemoryRouter><SettingsPage /></MemoryRouter></I18nProvider></QueryClientProvider>
  )
}

describe("SettingsPage", () => {
  it("renders title and all seven category filters", () => {
    renderPage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("设置")
    for (const label of ["全部", "账户", "通用", "安全", "通知", "API", "危险区"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
  })

  it("filters cards by category", async () => {
    renderPage()
    await userEvent.click(screen.getByRole("button", { name: "危险区" }))
    expect(screen.getByText("注销账号")).toBeInTheDocument()
    expect(screen.queryByText("个人资料")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 跑测试确认失败** → Expected: FAIL（模块不存在）
- [ ] **Step 3: 实现骨架**

```tsx
// src/features/settings/SettingsPage.tsx
export type SettingsCategory = "account" | "general" | "security" | "notify" | "api" | "danger"

/** 卡片容器：后续任务填充 children（表单/控件） */
export function SettingCard({ title, desc, category, children }: {
  title: string; desc?: string; category: SettingsCategory; children: React.ReactNode
}) {
  return (
    <Card data-category={category}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const { t } = useT()
  const [cat, setCat] = useState<"all" | SettingsCategory>("all")
  // 七个按钮 + 卡片列表（children 由后续任务补：Task 5-7 各卡）
  // 过滤逻辑：cat==="all" 显示全部；否则按 data-category 过滤（实现时用 state 数组而非 DOM 查询）
  ...
}
```

实现要点：卡片以数组 `{category, node}` 组织，按 `cat` filter 渲染，**不要**用 DOM 查询过滤（测试要能稳定断言）。

- [ ] **Step 4: 跑测试通过** + 在 `routes.tsx` 接线
- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat(settings): 设置页骨架（七分类筛选 + 卡片容器）" && git push origin main
```

---

## Task 5: 个人资料卡（头像上传 / 昵称 / 用户名 / 真实邮箱 / 只读信息）

**Files:**
- Create: `src/features/settings/ProfileCard.tsx`
- Modify: `src/api/settings.ts`（**新建**：`src/api/settings.ts`）、`src/mocks/handlers.ts`
- Modify: `src/features/settings/SettingsPage.tsx`（挂载卡片）
- Create: `tests/api/settings-profile.test.ts`

**Interfaces:**
- Produces: `settingsApi.updateNickname(nickname)`、`settingsApi.updateUsername(username)`、`settingsApi.uploadAvatar(file: File)`、`settingsApi.deleteAvatar()`；约束：昵称 2-16 位中文/英文/数字/下划线；用户名 3-24 位 `[a-zA-Z0-9_]`；头像 JPG/PNG/WebP/GIF ≤ 2MB。

**参考站实测结构**：卡「个人资料 / 头像、昵称与账户基本信息」= 头像 + 「上传头像」+ 说明「支持 JPG/PNG/WebP/GIF，上限 2 MB」；昵称输入 + 「保存」；用户名（值 + 「编辑」）；真实邮箱（值 + 「编辑」）；我的域名；注册时间。

- [ ] **Step 1: 写失败测试（含 Review Focus #2 边界与 #3 上传类型）**

```ts
// tests/api/settings-profile.test.ts
import { describe, expect, it } from "vitest"
import { settingsApi } from "@/api/settings"

describe("settings profile", () => {
  it("rejects nickname shorter than 2 or longer than 16", async () => {
    await expect(settingsApi.updateNickname("a")).rejects.toMatchObject({ code: "SETTINGS_NICKNAME_INVALID" })
    await expect(settingsApi.updateNickname("x".repeat(17))).rejects.toMatchObject({ code: "SETTINGS_NICKNAME_INVALID" })
  })

  it("accepts valid nickname", async () => {
    await expect(settingsApi.updateNickname("颜汐_01")).resolves.toBeTruthy()
  })

  it("rejects oversized avatar before upload", async () => {
    const big = new File([new Uint8Array(3 * 1024 * 1024)], "a.png", { type: "image/png" })
    await expect(settingsApi.uploadAvatar(big)).rejects.toMatchObject({ code: "SETTINGS_AVATAR_TOO_LARGE" })
  })

  it("rejects unsupported avatar type", async () => {
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" })
    await expect(settingsApi.uploadAvatar(svg)).rejects.toMatchObject({ code: "SETTINGS_AVATAR_TYPE" })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现 `src/api/settings.ts`**

```ts
import { get, post } from "@/lib/api-client"
import { ApiError } from "@/lib/api-client"

const NICKNAME_RE = /^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const AVATAR_MAX = 2 * 1024 * 1024

/** 前端前置校验（与后端同规则；超限直接拒绝，不发请求） */
function assertAvatar(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) throw new ApiError("SETTINGS_AVATAR_TYPE", "仅支持 JPG/PNG/WebP/GIF", 0)
  if (file.size > AVATAR_MAX) throw new ApiError("SETTINGS_AVATAR_TOO_LARGE", "头像不能超过 2 MB", 0)
}

export const settingsApi = {
  updateNickname: (nickname: string) => {
    if (!NICKNAME_RE.test(nickname)) throw new ApiError("SETTINGS_NICKNAME_INVALID", "昵称 2-16 位中文/英文/数字/下划线", 0)
    return post<{ nickname: string }>("/settings/nickname", { nickname })
  },
  updateUsername: (username: string) => {
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new ApiError("SETTINGS_USERNAME_INVALID", "用户名 3-24 位字母/数字/下划线", 0)
    return post<{ username: string }>("/settings/username", { username })
  },
  uploadAvatar: (file: File) => {
    assertAvatar(file)
    const fd = new FormData()
    fd.append("file", file)
    return post<{ avatarUrl: string }>("/settings/avatar", fd)
  },
  deleteAvatar: () => post<null>("/settings/avatar/delete"),
}
```

> 注意：`post` 目前固定 `Content-Type: application/json`；本任务需给 `api-client.request` 增加分支——当 `init.body instanceof FormData` 时不设置 `Content-Type`（交给浏览器带 boundary）。这是一处**必须**的小改动，写进本任务实现步骤。

- [ ] **Step 4: mock**：`/settings/nickname`、`/settings/username`、`/settings/avatar`（返回 `data:image/svg+xml;base64,...` 占位 URL 即可）、`/settings/avatar/delete`。
- [ ] **Step 5: ProfileCard 实现**：头像（`Avatar` 组件 + 上传按钮，`<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>`）；昵称输入 + 保存（成功 toast + `invalidateQueries(["me"])`）；用户名/真实邮箱行内「编辑」打开 Dialog。**上传失败（类型/大小）由 `settingsApi` 抛 `ApiError`，组件 catch 后 toast 提示，不发请求**（Review Focus #3）。
- [ ] **Step 6: 跑测试 + 构建 + 手动验收**（上传 3MB 文件应看到提示且无网络请求）
- [ ] **Step 7: 登记 + 提交**

```bash
git add -A && git commit -m "feat(settings): 个人资料卡（头像上传校验/昵称/用户名/邮箱）" && git push origin main
```

---

## Task 6: 二次认证管理（TOTP 开启 / 邮箱 2FA / 恢复码）

**Files:**
- Create: `src/features/settings/TwoFactorCard.tsx`
- Modify: `src/api/settings.ts`（2FA 方法）、`src/mocks/handlers.ts`
- Modify: `src/features/settings/SettingsPage.tsx`（挂「账户」类）
- Create: `tests/api/settings-2fa.test.ts`
- 新增依赖：`qrcode.react`

**Interfaces:**
- Produces: `settingsApi.startTotp(): Promise<{secret:string; otpauthUrl:string}>`、`settingsApi.confirmTotp(code:string): Promise<{recoveryCodes:string[]}>`、`settingsApi.disableTotp(password:string)`、`settingsApi.enableEmail2fa()`、`settingsApi.disableEmail2fa()`、`settingsApi.regenerateRecovery(): Promise<{recoveryCodes:string[]}>`。

**参考站实测结构**：卡「二次认证 / 开启后，登录时除密码外还要再验证一次，账号更安全。」= 「认证器 App（动态码）」+ 开启按钮；「邮箱验证码」+ 掩码邮箱 + 开启按钮。

- [ ] **Step 1: 写失败测试（含 Review Focus #5）**

```ts
// tests/api/settings-2fa.test.ts
import { describe, expect, it } from "vitest"
import { settingsApi } from "@/api/settings"

describe("2FA management", () => {
  it("start returns secret and otpauth url", async () => {
    const r = await settingsApi.startTotp()
    expect(r.secret).toMatch(/^[A-Z2-7]{16,}$/)
    expect(r.otpauthUrl).toContain("otpauth://totp/")
  })

  it("confirm returns recovery codes shown once", async () => {
    const r = await settingsApi.confirmTotp("123456")
    expect(r.recoveryCodes.length).toBeGreaterThanOrEqual(6)
  })

  it("confirm rejects wrong code", async () => {
    await expect(settingsApi.confirmTotp("000000")).rejects.toMatchObject({ code: "S2FA_CODE_INVALID" })
  })

  it("disable requires password", async () => {
    await expect(settingsApi.disableTotp("")).rejects.toMatchObject({ code: "SYS_BAD_REQUEST" })
    await expect(settingsApi.disableTotp("password123")).resolves.toBeNull()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: api 实现**（路径 `/settings/2fa/totp/{start,confirm,disable}`、`/settings/2fa/email`、`/settings/2fa/recovery/regenerate`，与 `docs/api.md` §3.3 一致）
- [ ] **Step 4: mock**：`start` 返回固定 secret `JBSWY3DPEHPK3PXP` + 对应 otpauth URL；`confirm` 校验 `123456`；`recovery` 返回 8 组随机码；`disable` 校验密码非空。
- [ ] **Step 5: 安装依赖并实现卡片**

```bash
npm install qrcode.react --no-fund --no-audit
```

`TwoFactorCard`：未开启时两行（认证器 App + 开启 / 邮箱验证码 + 掩码邮箱 + 开启）；点「开启」进入两步 Dialog：① 用 `<QRCodeSVG value={otpauthUrl} />` 展示二维码 + secret 文本（可复制）+ 6 位码输入；② confirm 成功后展示恢复码列表 + **醒目提示「恢复码只显示一次，请立即保存」+ 复制全部按钮**（Review Focus #5）。已开启时显示关闭按钮（需输入密码）。
- [ ] **Step 6: 跑测试 + 构建 + 手动验收**（完整走一遍开启→恢复码→关闭）
- [ ] **Step 7: 登记 + 提交**

```bash
git add -A && git commit -m "feat(settings): 2FA 管理（TOTP 二维码/恢复码一次性展示/邮箱验证码开关）" && git push origin main
```

---

## Task 7: 通用偏好 / 通知偏好 / 安全 / 危险区 / 公开 API 卡

**Files:**
- Create: `src/features/settings/GeneralCard.tsx`、`NotifyCard.tsx`、`SecurityCard.tsx`、`DangerCard.tsx`、`ApiAccessCard.tsx`
- Modify: `src/api/settings.ts`、`src/mocks/handlers.ts`、`src/features/settings/SettingsPage.tsx`
- Create: `tests/components/settings-prefs.test.tsx`

**Interfaces:**
- Produces: `settingsApi.updateNotify({ announcements:boolean; personal:boolean })`、`settingsApi.changePassword(oldPw,newPw)`、`settingsApi.requestDeleteCode()`、`settingsApi.deleteAccount(code)`、`apiAccessApi.generateKey()/resetKey()/deleteKey()/status()`。
- 通用偏好（界面动效 3 开关：启用动效 / 点击粒子 / AI 实验室动效）**存 localStorage（key `xueia-ui-prefs`），不调接口**（参考站明确「偏好保存在本浏览器，不随账号同步」）。

**参考站实测结构**：界面动效卡 3 个 switch；通知偏好卡 2 个 switch；安全卡（修改密码按钮 + 消息通知已开启说明）；注销账号卡（警告文案 + 注销按钮）；公开 API 卡（生成 Key + 我的层级 + 功能×状态×每日额度 表格 + 额度说明 + 接口文档链接）。

- [ ] **Step 1: 写失败测试**

```tsx
// tests/components/settings-prefs.test.tsx
import { describe, expect, it, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nProvider } from "@/i18n"
import { GeneralCard } from "@/features/settings/GeneralCard"

describe("GeneralCard ui prefs", () => {
  beforeEach(() => localStorage.clear())

  it("persists motion preference to localStorage", async () => {
    render(<I18nProvider><GeneralCard /></I18nProvider>)
    const sw = screen.getByRole("switch", { name: /启用动效/ })
    await userEvent.click(sw)
    expect(localStorage.getItem("xueia-ui-prefs")).toContain("motion")
  })

  it("disables click-particle switch when motion is off", async () => {
    render(<I18nProvider><GeneralCard /></I18nProvider>)
    await userEvent.click(screen.getByRole("switch", { name: /启用动效/ }))
    expect(screen.getByRole("switch", { name: /点击粒子/ })).toBeDisabled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现 GeneralCard**（`src/lib/ui-prefs.ts` 新增：`getUiPrefs()/setUiPref(key,val)` 读写 localStorage；点击粒子开关在动效关闭时 disabled——与参考站实测一致）
- [ ] **Step 4: NotifyCard / SecurityCard / DangerCard / ApiAccessCard**
  - NotifyCard：两个 switch 接 `updateNotify`，成功后 toast。
  - SecurityCard：修改密码 Dialog（旧/新/确认，zod 校验，成功后提示其他设备登录失效）。
  - DangerCard：注销账号 Dialog 三段——警告文案 → 请求验证码（`requestDeleteCode`，发送到真实邮箱）→ 输入 6 位码 + 输入用户名确认 → `deleteAccount(code)` 成功后清会话跳首页。
  - ApiAccessCard：未生成时「生成 Key」；生成后展示 Key（**仅本次可见，提示立即保存**）+ 重置/删除；下方「我的层级」+ 功能额度表（`Table` 组件，`功能/状态/每日额度` 三列）+ 说明 + 接口文档链接。
- [ ] **Step 5: 跑测试 + 构建 + 手动验收**
- [ ] **Step 6: 登记接口 + 提交**

```bash
git add -A && git commit -m "feat(settings): 动效/通知/安全/注销/公开API 卡" && git push origin main
```

---

## Task 8: 临时分享箱 —— 分享端（文字 / 文件双 Tab）

**Files:**
- Create: `src/api/tempbox.ts`、`src/features/tempbox/ShareBoxPage.tsx`
- Modify: `src/mocks/handlers.ts`、`src/routes.tsx`（`/dashboard/tempbox` 换成 ShareBoxPage）
- Modify: `src/i18n/zh.ts`、`en.ts`（`tb.*`）
- Create: `tests/api/tempbox.test.ts`

**Interfaces:**
- Produces: `tempboxApi.getConfig(): Promise<{retentionMinutes:number;maxFileSizeMB:number;maxFiles:number;maxLive:number}>`、`tempboxApi.createText(text:string): Promise<{code:string;link:string;expiresAt:string}>`、`tempboxApi.createFiles(files:File[]): Promise<{code:string;link:string;expiresAt:string}>`、`tempboxApi.uploadToCode(code, files:File[])`。

**参考站实测结构**：h1「临时分享箱」+ 副标题「生成 6 位接收码分享文件或文字；把分享链接发给对方，点开即看；到点自动清除。」→ 解锁区（见 Task 9）→ 分享区标题「分享临时内容」+ 说明「需登录后上传；文字 / 图片 / 文件均可。」+ 四个参数（默认保存 30 分钟 / 文件上限 100 MB / 单箱最多文件数 100 / 同时保留箱数 10）+ Tab【文字 | 文件 / 图片】+ 文字面板（"粘贴文字（存数据库，不占存储空间）" 文本域 + 「生成接收码」按钮，空则 disabled）+ 底部说明。

- [ ] **Step 1: 写失败测试（含 Review Focus #3 超限文件）**

```ts
// tests/api/tempbox.test.ts
import { describe, expect, it } from "vitest"
import { tempboxApi } from "@/api/tempbox"

describe("tempbox", () => {
  it("returns 6-char code for text", async () => {
    const r = await tempboxApi.createText("hello")
    expect(r.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(r.link).toContain("/tempbox?code=")
  })

  it("rejects empty text", async () => {
    await expect(tempboxApi.createText("   ")).rejects.toMatchObject({ code: "TB_TEXT_EMPTY" })
  })

  it("rejects oversized file before upload", async () => {
    const big = new File([new Uint8Array(101 * 1024 * 1024)], "a.bin", { type: "application/octet-stream" })
    await expect(tempboxApi.createFiles([big])).rejects.toMatchObject({ code: "TB_FILE_TOO_LARGE" })
  })

  it("rejects more files than max", async () => {
    const files = Array.from({ length: 101 }, (_, i) => new File(["x"], `f${i}.txt`, { type: "text/plain" }))
    await expect(tempboxApi.createFiles(files)).rejects.toMatchObject({ code: "TB_TOO_MANY_FILES" })
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现 `src/api/tempbox.ts`**（前置校验：空文本抛 `TB_TEXT_EMPTY`；单文件 > `maxFileSizeMB` 抛 `TB_FILE_TOO_LARGE`；文件数 > `maxFiles` 抛 `TB_TOO_MANY_FILES`。校验常量从 `/tempbox/config` 取，测试中 mock 配置为 100MB/100 个。）
- [ ] **Step 4: mock**：`/tempbox/config` 返回实测同款参数；`/tempbox/create` 返回 6 位码（`A-Z0-9`）+ 链接 `https://xueia.com/tempbox?code=XXXXXX`。
- [ ] **Step 5: 页面实现**：按参考站结构；文字 Tab 提交后显示成功卡（大号接收码 + 分享链接 + 复制按钮 + 剩余时间倒计时）；文件 Tab 拖拽/选择区（显示已选文件与总大小）+ 上传进度条 + 成功同款卡。**复制失败回退提示**（Review Focus #6）：

```ts
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false // 组件内：toast 提示「请手动选中复制」并展示可选中文本框
  }
}
```

- [ ] **Step 6: 跑测试 + 构建 + 手动验收**
- [ ] **Step 7: 登记 + 提交**

```bash
git add -A && git commit -m "feat(tempbox): 分享端（配置参数/文字与文件双 Tab/取件码与链接）" && git push origin main
```

---

## Task 9: 临时分享箱 —— 游客取件页（公开路由 + 免登录解锁）

**Files:**
- Create: `src/features/tempbox/PickupPage.tsx`
- Modify: `src/api/tempbox.ts`（`pickup(code)`）、`src/mocks/handlers.ts`、`src/routes.tsx`（新增公开路由 `/tempbox`）
- Create: `tests/components/tempbox-pickup.test.tsx`

**Interfaces:**
- Produces: `tempboxApi.pickup(code: string): Promise<{kind:"text"; text:string} | {kind:"files"; files:Array<{name:string;size:number;url:string}>; expiresAt:string}>`；公开路由 `/tempbox`（可带 `?code=` 自动解锁）。

**参考站实测结构**：解锁区 = 「输入接收码解锁」+「访客无需登录即可查看与下载。」+ 输入框 + 「解锁」按钮。

- [ ] **Step 1: 写失败测试（含 Review Focus #1 过期码）**

```tsx
// tests/components/tempbox-pickup.test.tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { I18nProvider } from "@/i18n"
import { PickupPage } from "@/features/tempbox/PickupPage"

function renderPickup(initial = "/tempbox") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}><I18nProvider><MemoryRouter initialEntries={[initial]}><PickupPage /></MemoryRouter></I18nProvider></QueryClientProvider>
  )
}

describe("PickupPage", () => {
  it("shows friendly expired state for unknown or expired code", async () => {
    renderPickup()
    await userEvent.type(screen.getByRole("textbox"), "ZZZZZZ")
    await userEvent.click(screen.getByRole("button", { name: "解锁" }))
    expect(await screen.findByText(/已过期或不存在/)).toBeInTheDocument()
  })

  it("renders shared text for a valid code", async () => {
    renderPickup("/tempbox?code=ABC123")
    expect(await screen.findByText("hello from mock")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: api + mock**：`pickup` 对未知/过期码抛 `TB_CODE_EXPIRED`（前端捕获后显示友好过期态，不抛未捕获错误）；mock 固定 `ABC123` → 文本 `hello from mock`。
- [ ] **Step 4: PickupPage 实现**：公开页面（不套 dashboard 外壳，顶部品牌 Logo）；输入 6 位码（大写自动转换）→ 解锁 → 文本显示（可复制）或文件列表（预览/下载按钮）；过期态显示「接收码已过期或不存在」+ 重新输入；`?code=` 参数自动解锁。
- [ ] **Step 5: 路由**：`/tempbox` 注册为公开路由（`routes.tsx` 公共区）；`/dashboard/tempbox` 保持登录态分享端。
- [ ] **Step 6: 跑测试 + 构建 + 手动验收**（登出状态下访问 `/tempbox?code=ABC123` 能直接看到内容——**不经过登录守卫**）
- [ ] **Step 7: 登记 + 提交**

```bash
git add -A && git commit -m "feat(tempbox): 游客取件页（公开路由/免登录解锁/过期态）" && git push origin main
```

---

## Task 10: 封禁申诉页（公开表单 + 字数校验）

**Files:**
- Create: `src/api/appeal.ts`、`src/features/appeal/AppealPage.tsx`
- Modify: `src/mocks/handlers.ts`、`src/routes.tsx`（`/appeal` 换成 AppealPage）
- Create: `tests/components/appeal.test.tsx`

**Interfaces:**
- Produces: `appealApi.submit({account:string; contact?:string; content:string})`、`appealApi.pendingReply()`。

**参考站实测结构**：独立页（品牌 Logo + 「账号申诉」+「如果你的账号被封禁，可以在这里提交申诉。」+ 说明「只有当前处于封禁状态的账号可以申诉…」）；字段：账号（用户名或邮箱）/ 联系方式（选填）/ 申诉说明（**实时字数计数「还需 10 个字（至少 10 字）」**）；提交按钮在不足 10 字时 disabled；底部「返回登录」+ 页脚。

- [ ] **Step 1: 写失败测试**

```tsx
// tests/components/appeal.test.tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nProvider } from "@/i18n"
import { MemoryRouter } from "react-router"
import { AppealPage } from "@/features/appeal/AppealPage"

function renderAppeal() {
  return render(<I18nProvider><MemoryRouter><AppealPage /></MemoryRouter></I18nProvider>)
}

describe("AppealPage", () => {
  it("disables submit until content reaches 10 chars and shows remaining count", async () => {
    renderAppeal()
    const submit = screen.getByRole("button", { name: "提交申诉" })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText("申诉说明"), "12345")
    expect(screen.getByText(/还需 5 个字/)).toBeInTheDocument()
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText("申诉说明"), "67890")
    expect(submit).toBeEnabled()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现页面**（`account` 用 `LoginPage` 同风格 Input；`content` 用 textarea，`useWatch` 计算剩余字数；提交成功后切换到「已提交」状态卡，展示提交时间与状态说明；`pendingReply` 若有回复则显示回复内容与「已阅」确认按钮）
- [ ] **Step 4: mock**：`/appeal` 校验 `content.trim().length >= 10`，否则 `SYS_BAD_REQUEST`；成功后 `ok(null)`。`/appeal/pending-reply` 默认返回 `null`。
- [ ] **Step 5: 跑测试 + 构建 + 手动验收**（未登录也能访问 `/appeal`）
- [ ] **Step 6: 登记 + 提交**

```bash
git add -A && git commit -m "feat(appeal): 申诉页（字数校验/提交态/回复确认）" && git push origin main
```

---

## Task 11: 守卫白名单接线 + E2E 扩展 + 批次②收尾

**Files:**
- Modify: `src/routes.tsx`（`/tempbox` 公开、`DASHBOARD_GUEST_WHITELIST` 生效校验）
- Modify: `tests/e2e/landing.spec.ts` → 新增 `tests/e2e/batch2.spec.ts`
- Modify: `docs/api.md`、`AGENTS.md`（进度日志 + 验证命令）

**Interfaces:**
- Consumes: 前 10 个任务的全部产出。
- Produces: 批次②可演示闭环；`AGENTS.md` 进度日志新条目。

- [ ] **Step 1: 写 E2E 主链路**

```ts
// tests/e2e/batch2.spec.ts
import { expect, test } from "@playwright/test"

test("guest can pick up a shared text without login", async ({ page }) => {
  await page.goto("/tempbox?code=ABC123")
  await expect(page.getByText("hello from mock")).toBeVisible()
})

test("settings page opens with category filters", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel(/用户名或邮箱/).fill("yanxi")
  await page.getByLabel(/密码/).fill("password123")
  await page.getByRole("button", { name: "登录", exact: true }).click()
  await page.getByRole("textbox", { name: "6 位动态码" }).fill("123456")
  await page.getByRole("button", { name: "验证", exact: true }).click()
  await page.getByRole("link", { name: "账户设置" }).click()
  await expect(page.getByRole("button", { name: "危险区" })).toBeVisible()
})

test("appeal page is public", async ({ page }) => {
  await page.goto("/appeal")
  await expect(page.getByRole("button", { name: "提交申诉" })).toBeVisible()
})
```

- [ ] **Step 2: 在 WSL 跑 E2E**

Run: `wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npx playwright install --with-deps chromium && npm run e2e"`
Expected: 4 passed（含既有 landing.spec 中的主链路）。（Playwright 浏览器首次需下载；若 WSL 下载失败，改为在 Windows 跑 `npm run e2e` 并在进度日志注明。）

- [ ] **Step 3: 文档同步（§0.2 强制）**
  - `docs/api.md`：核对 §3.2 邮箱域全量条目状态 ⬜→🟡，补 tempbox/appeal/settings-2fa 条目与所有新错误码。
  - `AGENTS.md`：§1 进度日志追加批次②完成条目；§8 验证命令补 `npm run e2e`。

- [ ] **Step 4: 全量验证**

Run: `npm run build`（Windows）+ `wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npm test"` → 全绿。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat(batch2): 守卫白名单接线 + E2E + 文档收尾" && git push origin main
```

---

## 自检记录（写计划后按 skill 要求复核）

- **Spec 覆盖**：批次②四项（邮箱/tempbox/settings/appeal）均有任务；参考站实测结构已逐项写入各任务「参考站实测结构」。
- **类型一致性**：`mailboxApi`/`settingsApi`/`tempboxApi`/`appealApi` 方法名与签名在各任务间一致；错误码统一 `域前缀_*`（`MAILBOX_*`/`SETTINGS_*`/`S2FA_*`/`TB_*`）。
- **Review Focus 落点**：#1→Task 9 过期态测试；#2→Task 5 昵称边界、Task 10 字数；#3→Task 5 头像类型/大小、Task 8 文件超限；#4→Task 11 E2E 游客取件 + 守卫；#5→Task 6 恢复码；#6→Task 8 复制回退。
- **已知前置改动**：`api-client.request` 需支持 `FormData`（Task 5 内实现）。
