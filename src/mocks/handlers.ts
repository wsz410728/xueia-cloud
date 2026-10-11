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

export const handlers = [...authHandlers, ...mailboxHandlers]
