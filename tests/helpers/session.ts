import { authApi } from "@/api/auth"
import { ApiError } from "@/lib/api-client"

/**
 * 测试辅助：走完整 mock 登录（密码 → 2FA 动态码）。
 * 邮箱/设置等接口的 mock handlers 都要求 session.user 存在；
 * api-client 在登录页之外的 401 会尝试跳转，测试里必须先登录。
 */
export async function loginAsMockUser(account = "yanxi") {
  try {
    await authApi.login(account, "password123")
  } catch (e) {
    if (e instanceof ApiError && e.code === "AUTH_2FA_REQUIRED") {
      const d = e.data as { twoFactorTicket?: string } | undefined
      await authApi.login2fa(d?.twoFactorTicket ?? "mock-ticket-123", "totp", "123456")
      return
    }
    throw e
  }
}
