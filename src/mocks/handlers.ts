import { HttpResponse, http } from "msw"
import { brand } from "@/config/brand"
import type { MailMessage, MailboxAddress } from "@/api/mailbox"
import type { UserSummary } from "@/api/types"

const API = "/api/v1"

/** mock 会话：登录后种下的「会话」，内存态即可 */
const session: { user: UserSummary | null } = { user: null }

export const mockUser: UserSummary = {
  id: "u-1001",
  username: "yanxi",
  nickname: "颜汐",
  email: "yanxi@xueia.com",
  realEmailVerified: true,
  avatarUrl: null,
  role: "super",
  emailVerified: false,
  twoFactorEnabled: true,
}

const ok = <T,>(data: T, init?: ResponseInit) => HttpResponse.json({ ok: true, data }, init)
const fail = (status: number, code: string, message: string, data?: unknown) =>
  HttpResponse.json(
    data === undefined ? { ok: false, error: { code, message } } : { ok: false, error: { code, message }, data },
    { status }
  )

const delay = () => new Promise((r) => setTimeout(r, 350))

export const authHandlers = [
  http.post(`${API}/login`, async ({ request }) => {
    await delay()
    const { account, password } = (await request.json()) as { account: string; password: string }
    if (!account || !password) return fail(400, "SYS_BAD_REQUEST", "请填写账号与密码")
    // mock：任意账号密码可登录，但带「2fa」的账号强制走 2FA
    const user = { ...mockUser, username: account.split("@")[0] }
    if (account.includes("2fa") || user.twoFactorEnabled) {
      return fail(401, "AUTH_2FA_REQUIRED", "需要二次验证", {
        twoFactorTicket: "mock-ticket-123",
        methods: ["totp", "email", "recovery"],
      })
    }
    session.user = user
    return ok({ user })
  }),

  http.post(`${API}/login/2fa`, async ({ request }) => {
    await delay()
    const { ticket, method, code } = (await request.json()) as {
      ticket: string
      method: string
      code: string
    }
    if (ticket !== "mock-ticket-123") return fail(401, "AUTH_2FA_EXPIRED", "验证会话已过期，请重新登录")
    // mock：动态码 123456 / 恢复码 8888-8888 通过，其余拒绝
    const passed =
      (method === "totp" && code === "123456") ||
      (method === "email" && code === "123456") ||
      (method === "recovery" && code.replace(/-/g, "") === "88888888")
    if (!passed) return fail(401, "AUTH_2FA_INVALID", "验证码错误，请重试")
    session.user = { ...mockUser }
    return ok({ user: session.user })
  }),

  http.post(`${API}/login/2fa/send-email`, async () => {
    await delay()
    return ok({ sentTo: "y***@163.com" })
  }),

  http.post(`${API}/register`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as {
      username: string
      realEmail: string
      password: string
      passwordConfirm: string
      inviteCode: string
      agreeTerms: boolean
    }
    if (body.username.toLowerCase() === "admin") return fail(409, "AUTH_USERNAME_TAKEN", "用户名已被占用")
    if (body.inviteCode.toUpperCase() === "USED000") return fail(400, "AUTH_INVITE_INVALID", "邀请码无效或已用尽")
    session.user = { ...mockUser, username: body.username, email: `${body.username}@xueia.com` }
    return ok({ user: session.user })
  }),

  http.get(`${API}/register-status`, ({ request }) => {
    const username = new URL(request.url).searchParams.get("username")
    return ok({
      open: true,
      openUntil: "2026-12-31T23:59:59Z",
      usernameAvailable: username ? username.toLowerCase() !== "admin" : null,
    })
  }),

  http.post(`${API}/logout`, async () => {
    await delay()
    session.user = null
    return ok(null)
  }),

  http.get(`${API}/me`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok(session.user)
  }),

  http.post(`${API}/password/forgot`, async () => {
    await delay()
    return ok(null)
  }),

  http.post(`${API}/password/reset`, async () => {
    await delay()
    return ok(null)
  }),
]

// ===== 邮箱域 =====

export const mockAddresses: MailboxAddress[] = [
  { id: "mb-1", address: "yanxi@xueia.com", forwardTo: "wsz853890575@163.com", forwardVerified: true, messageCount: 4, createdAt: "2026-10-01T08:00:00Z" },
  { id: "mb-2", address: "noreply@xueia.com", forwardTo: null, forwardVerified: false, messageCount: 1, createdAt: "2026-10-05T12:30:00Z" },
]

export const mockMessages: MailMessage[] = [
  { id: "m-1", mailboxId: "mb-1", from: "noreply@github.com", subject: "[GitHub] 你的验证码是 246810", excerpt: "有人在 GitHub 上用它注册了账号，验证码 10 分钟内有效……", body: "有人在 GitHub 上用它注册了账号。\n\n验证码：246810\n\n验证码 10 分钟内有效，请勿泄露给他人。\n\n—— GitHub 团队", read: false, receivedAt: new Date(Date.now() - 6 * 60000).toISOString() },
  { id: "m-2", mailboxId: "mb-1", from: "team@vercel.com", subject: "Welcome to Vercel", excerpt: "感谢注册！这是你的入门指南……", body: "感谢注册！\n\n这是你的入门指南：\n1. 绑定自定义域名\n2. 部署第一个项目\n3. 邀请团队成员\n\n—— Vercel 团队", read: false, receivedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: "m-3", mailboxId: "mb-1", from: "no-reply@telegram.org", subject: "Telegram login code", excerpt: "Login code: 55213. Do not give this code to anyone!", body: "Login code: 55213\n\nDo not give this code to anyone, even if they say they are from Telegram!", read: true, receivedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString() },
  { id: "m-4", mailboxId: "mb-1", from: "hello@xueia.com", subject: "欢迎来到 Xueia Cloud", excerpt: "你的域名邮箱已开通：yanxi@xueia.com……", body: "欢迎来到 Xueia Cloud！\n\n你的域名邮箱已开通：yanxi@xueia.com\n\n- 收到的邮件会出现在收件箱\n- 可在「设置」里配置转发到常用邮箱\n\n—— Xueia Cloud 团队", read: true, receivedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: "m-5", mailboxId: "mb-2", from: "news@example.dev", subject: "Weekly digest #42", excerpt: "本周开发者周刊……", body: "本周开发者周刊 #42\n\n1. 生态动态\n2. 精选文章\n3. 工具推荐", read: false, receivedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString() },
]

const LOCAL_RE = /^[a-z0-9._-]{1,20}$/i

/** 临时邮箱（内存态：同一会话只保留一个，换一个即作废旧地址） */
let mockTemp: { id: string; address: string; expiresAt: string } | null = null
/** 待验证的转发目标（send → verify 两步） */
let pendingForward: { mailboxId: string; email: string } | null = null

function newTemp() {
  const id = Math.random().toString(36).slice(2, 8)
  return {
    id,
    address: `temp-${id}@temp.${brand.emailDomain}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  return `${name.slice(0, 1)}***@${domain}`
}

export const mailboxHandlers = [
  http.get(`${API}/mailbox`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok({
      addresses: mockAddresses.map((a) => ({
        ...a,
        messageCount: mockMessages.filter((m) => m.mailboxId === a.id).length,
      })),
    })
  }),

  http.post(`${API}/mailbox`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { local } = (await request.json()) as { local: string }
    if (!LOCAL_RE.test(local ?? "")) return fail(400, "SYS_BAD_REQUEST", "地址格式不正确")
    const address = `${local}@${brand.emailDomain}`
    if (mockAddresses.some((a) => a.address === address)) {
      return fail(409, "MAILBOX_ADDR_TAKEN", "该地址已存在")
    }
    const created: MailboxAddress = {
      id: `mb-${Date.now()}`,
      address,
      forwardTo: null,
      forwardVerified: false,
      messageCount: 0,
      createdAt: new Date().toISOString(),
    }
    mockAddresses.push(created)
    return ok(created)
  }),

  // ===== 临时邮箱 =====
  http.get(`${API}/mailbox/temp`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok(mockTemp)
  }),

  http.post(`${API}/mailbox/temp`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    mockTemp = newTemp()
    return ok(mockTemp)
  }),

  http.post(`${API}/mailbox/temp/:id/refresh`, ({ params }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    if (!mockTemp || mockTemp.id !== params.id) return fail(404, "SYS_NOT_FOUND", "临时邮箱不存在或已作废")
    mockTemp = newTemp()
    return ok(mockTemp)
  }),

  // ===== 转发验证（send → verify 两步，同一路径） =====
  http.post(`${API}/mailbox/forward-verify`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { mailboxId, email, code } = (await request.json()) as {
      mailboxId: string
      email?: string
      code?: string
    }
    const target = mockAddresses.find((a) => a.id === mailboxId)
    if (!target) return fail(404, "SYS_NOT_FOUND", "地址不存在")
    if (email) {
      pendingForward = { mailboxId, email }
      return ok({ sentTo: maskEmail(email) })
    }
    if (code) {
      if (!pendingForward || pendingForward.mailboxId !== mailboxId || code !== "123456") {
        return fail(400, "MAILBOX_CODE_INVALID", "验证码错误或已过期")
      }
      target.forwardTo = pendingForward.email
      target.forwardVerified = true
      pendingForward = null
      return ok(null)
    }
    return fail(400, "SYS_BAD_REQUEST", "参数不完整")
  }),
  http.post(`${API}/mailbox/:id/update`, async ({ params, request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const target = mockAddresses.find((a) => a.id === params.id)
    if (!target) return fail(404, "SYS_NOT_FOUND", "地址不存在")
    const patch = (await request.json()) as { forwardTo?: string | null }
    if (patch.forwardTo !== undefined) {
      target.forwardTo = patch.forwardTo
      // 转发目标变更后，之前的验证作废（验证只能走 forward-verify）
      target.forwardVerified = false
    }
    return ok(target)
  }),

  http.post(`${API}/mailbox/:id/delete`, ({ params }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const i = mockAddresses.findIndex((a) => a.id === params.id)
    if (i >= 0) mockAddresses.splice(i, 1)
    return ok(null)
  }),

  http.get(`${API}/mailbox/:id`, ({ params }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const id = params.id as string
    return ok({ messages: mockMessages.filter((m) => m.mailboxId === id) })
  }),

  http.get(`${API}/mailbox/:id/messages/:mid`, ({ params }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const m = mockMessages.find(
      (x) => x.mailboxId === params.id && x.id === params.mid
    )
    if (!m) return fail(404, "SYS_NOT_FOUND", "邮件不存在")
    return ok(m)
  }),

  http.post(`${API}/mailbox/:id/messages/:mid/reply`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { body } = (await request.json()) as { body: string }
    if (!body?.trim()) return fail(400, "SYS_BAD_REQUEST", "回复内容不能为空")
    return ok(null)
  }),

  http.post(`${API}/mailbox/messages/batch-delete`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { mailboxId, ids } = (await request.json()) as { mailboxId: string; ids: string[] }
    for (let i = mockMessages.length - 1; i >= 0; i--) {
      const m = mockMessages[i]
      if (m.mailboxId === mailboxId && ids.includes(m.id)) mockMessages.splice(i, 1)
    }
    return ok(null)
  }),

  http.post(`${API}/mailbox/:id/messages/:mid/read`, ({ params }) => { // eslint-disable-line
    const m = mockMessages.find((x) => x.id === params.mid)
    if (m) m.read = true
    return ok(null)
  }),

  http.post(`${API}/mailbox/read-all`, async ({ request }) => {
    const { mailboxId } = (await request.json()) as { mailboxId: string }
    mockMessages.forEach((m) => {
      if (m.mailboxId === mailboxId) m.read = true
    })
    return ok(null)
  }),
]

// ===== 设置域 =====

export const settingsHandlers = [
  http.post(`${API}/settings/nickname`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { nickname } = (await request.json()) as { nickname: string }
    if (!nickname) return fail(400, "SYS_BAD_REQUEST", "昵称不能为空")
    session.user.nickname = nickname
    return ok({ nickname })
  }),

  http.post(`${API}/settings/username`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { username } = (await request.json()) as { username: string }
    if (!username) return fail(400, "SYS_BAD_REQUEST", "用户名不能为空")
    session.user.username = username
    session.user.email = `${username}@${brand.emailDomain}`
    return ok({ username })
  }),

  http.post(`${API}/settings/avatar`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return fail(400, "SYS_BAD_REQUEST", "缺少文件")
    // mock：不落盘，返回一个占位 SVG data URL
    const avatarUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjx0ZXh0IHg9IjUwIiB5PSI2MCIgZm9udC1zaXplPSI0MCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WDwvdGV4dD48L3N2Zz4="
    session.user.avatarUrl = avatarUrl
    return ok({ avatarUrl })
  }),

  http.post(`${API}/settings/avatar/delete`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    session.user.avatarUrl = null
    return ok(null)
  }),
]

// ===== 2FA 域 =====

const TOTP_SECRET = "JBSWY3DPEHPK3PXP"

function makeRecoveryCodes() {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => {
    const raw = Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * 32)]).join("")
    return raw.slice(0, 4) + "-" + raw.slice(4)
  })
}

export const twoFaHandlers = [
  http.post(`${API}/settings/2fa/totp/start`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const label = encodeURIComponent(`${brand.fullName}:${session.user.username}`)
    const issuer = encodeURIComponent(brand.fullName)
    return ok({
      secret: TOTP_SECRET,
      otpauthUrl: `otpauth://totp/${label}?secret=${TOTP_SECRET}&issuer=${issuer}`,
    })
  }),

  http.post(`${API}/settings/2fa/totp/confirm`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { code } = (await request.json()) as { code: string }
    if (code !== "123456") return fail(400, "S2FA_CODE_INVALID", "动态码错误，请重试")
    return ok({ recoveryCodes: makeRecoveryCodes() })
  }),

  http.post(`${API}/settings/2fa/totp/disable`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { password } = (await request.json()) as { password: string }
    if (!password) return fail(400, "SYS_BAD_REQUEST", "请输入登录密码")
    return ok(null)
  }),

  http.post(`${API}/settings/2fa/email`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok(null)
  }),

  http.post(`${API}/settings/2fa/email/disable`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok(null)
  }),

  http.post(`${API}/settings/2fa/recovery/regenerate`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok({ recoveryCodes: makeRecoveryCodes() })
  }),
]

// ===== 通知 / 安全 / 危险区 / 公开 API =====

let mockHasApiKey = false

export const settingsExtraHandlers = [
  http.post(`${API}/settings/notify`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const prefs = (await request.json()) as { announcements: boolean; personal: boolean }
    return ok(prefs)
  }),

  http.post(`${API}/password`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { oldPassword, newPassword } = (await request.json()) as { oldPassword: string; newPassword: string }
    if (!oldPassword || (newPassword ?? "").length < 8) return fail(400, "SYS_BAD_REQUEST", "参数不合法")
    return ok(null)
  }),

  http.post(`${API}/settings/account/delete-code`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok({ sentTo: "w***@163.com" })
  }),

  http.post(`${API}/settings/account/delete`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { code } = (await request.json()) as { code: string }
    if (code !== "123456") return fail(400, "SYS_BAD_REQUEST", "确认码错误")
    session.user = null
    return ok(null)
  }),

  http.get(`${API}/api-key/status`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    return ok({
      hasKey: mockHasApiKey,
      tier: 0,
      achievementPoints: 6,
      features: [
        { name: "收件箱", open: true, limitPerDay: 10 },
        { name: "临时邮箱", open: true, limitPerDay: 10 },
        { name: "临时分享箱", open: true, limitPerDay: 10 },
        { name: "AI 中转站", open: false, limitPerDay: 0 },
      ],
    })
  }),

  http.post(`${API}/api-key/generate`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    mockHasApiKey = true
    return ok({ key: `sk-xueia-${Math.random().toString(36).slice(2, 18)}` })
  }),

  http.post(`${API}/api-key/reset`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    mockHasApiKey = true
    return ok({ key: `sk-xueia-${Math.random().toString(36).slice(2, 18)}` })
  }),

  http.post(`${API}/api-key/delete`, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    mockHasApiKey = false
    return ok(null)
  }),
]

// ===== 临时分享箱（config/get/create；pickup 为公开接口，无需会话） =====

const TB_CODE_RE = /^[A-Z0-9]{6}$/
const mockTempboxes = new Map<
  string,
  { kind: "text" | "files"; text?: string; files: Array<{ name: string; size: number; content: string }>; expiresAt: string }
>()

function newBoxCode() {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  do {
    code = Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * 32)]).join("")
  } while (mockTempboxes.has(code))
  return code
}

export const tempboxHandlers = [
  http.get(`${API}/tempbox/config`, () =>
    // 公开接口（取件页也要展示规则）
    ok({ retentionMinutes: 30, maxFileSizeMB: 100, maxFiles: 100, maxLive: 10 })
  ),

  http.post(`${API}/tempbox/create`, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "分享需要登录")
    const ct = request.headers.get("Content-Type") ?? ""
    let kind: "text" | "files"
    let text: string | undefined
    let files: Array<{ name: string; size: number; content: string }> = []
    if (ct.includes("multipart/form-data")) {
      const form = await request.formData()
      kind = "files"
      for (const f of form.getAll("files")) {
        if (f instanceof File) {
          files.push({ name: f.name, size: f.size, content: `mock-content-of-${f.name}` })
        }
      }
    } else {
      const body = (await request.json()) as { kind: "text"; text: string }
      kind = "text"
      text = body.text
    }
    const code = newBoxCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    mockTempboxes.set(code, { kind, text, files, expiresAt })
    const origin = new URL(request.url).origin
    return ok({ code, link: `${origin}/tempbox?code=${code}`, expiresAt })
  }),

  http.get(`${API}/tempbox/pickup`, ({ request }) => {
    const code = (new URL(request.url).searchParams.get("code") ?? "").toUpperCase()
    if (!TB_CODE_RE.test(code) || !mockTempboxes.has(code)) {
      return fail(404, "TB_CODE_EXPIRED", "接收码已过期或不存在")
    }
    const box = mockTempboxes.get(code)!
    if (box.kind === "text") return ok({ kind: "text", text: box.text ?? "", expiresAt: box.expiresAt })
    return ok({
      kind: "files",
      expiresAt: box.expiresAt,
      files: box.files.map((f) => ({ name: f.name, size: f.size, url: `data:text/plain;base64,${btoa(f.content)}` })),
    })
  }),

  // 固定测试码：E2E/单测用（有效，包含文本）
  http.post(`${API}/tempbox/_seed`, async ({ request }) => {
    const { code, text } = (await request.json()) as { code: string; text: string }
    mockTempboxes.set(code, { kind: "text", text, files: [], expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
    return ok(null)
  }),
]

export const handlers = [
  ...authHandlers,
  ...mailboxHandlers,
  ...settingsHandlers,
  ...twoFaHandlers,
  ...settingsExtraHandlers,
  ...tempboxHandlers,
]
