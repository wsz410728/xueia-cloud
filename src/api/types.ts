/** 共享 API 类型（契约见 docs/api.md；envelope 在 api-client.ts） */

export interface UserSummary {
  id: string
  username: string
  nickname: string | null
  email: string
  realEmailVerified: boolean
  avatarUrl: string | null
  role: "member" | "admin" | "super"
  emailVerified: boolean
  twoFactorEnabled: boolean
  /** AI 中转站权限（批次③：默认未解锁，贡献审核通过后解锁） */
  aiUnlocked: boolean
}

/** POST /login —— 成功返回用户；需要 2FA 时抛 AUTH_2FA_REQUIRED（ApiError.data 携带票据） */
export type LoginData = { user: UserSummary }

/** POST /login/2fa */
export interface Login2faData {
  user: UserSummary
}

/** POST /login/2fa/send-email */
export interface Send2faEmailData {
  sentTo: string
}

/** POST /register */
export interface RegisterData {
  user: UserSummary
}

/** GET /register-status */
export interface RegisterStatusData {
  open: boolean
  openUntil: string | null
  usernameAvailable: boolean | null
}

/** GET /me */
export type MeData = UserSummary

/** POST /password/forgot */
export type ForgotData = null

/** POST /password/reset */
export type ResetData = null
