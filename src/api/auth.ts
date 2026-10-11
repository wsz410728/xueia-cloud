import { get, post } from "@/lib/api-client"
import type {
  ForgotData,
  Login2faData,
  LoginData,
  MeData,
  RegisterData,
  RegisterStatusData,
  ResetData,
  Send2faEmailData,
} from "./types"

/** 认证域（路径见 docs/api.md §3.1） */

export const authApi = {
  /** POST /login —— 需要 2FA 时返回票据而非会话（AUTH_2FA_REQUIRED 走 data 分支） */
  login: (account: string, password: string) =>
    post<LoginData>("/login", { account, password }),

  /** POST /login/2fa */
  login2fa: (ticket: string, method: "totp" | "email" | "recovery", code: string) =>
    post<Login2faData>("/login/2fa", { ticket, method, code }),

  /** POST /login/2fa/send-email */
  send2faEmail: (ticket: string) => post<Send2faEmailData>("/login/2fa/send-email", { ticket }),

  /** POST /register */
  register: (input: {
    username: string
    realEmail: string
    password: string
    passwordConfirm: string
    inviteCode: string
    agreeTerms: boolean
  }) => post<RegisterData>("/register", input),

  /** GET /register-status?username= */
  registerStatus: (username?: string) =>
    get<RegisterStatusData>(`/register-status${username ? `?username=${encodeURIComponent(username)}` : ""}`),

  /** POST /logout */
  logout: () => post<null>("/logout"),

  /** GET /me —— 401 即未登录 */
  me: () => get<MeData>("/me"),

  /** POST /password/forgot */
  forgotPassword: (email: string) => post<ForgotData>("/password/forgot", { email }),

  /** POST /password/reset */
  resetPassword: (token: string, password: string, passwordConfirm: string) =>
    post<ResetData>("/password/reset", { token, password, passwordConfirm }),
}
