import { ApiError, post } from "@/lib/api-client"

/**
 * 设置域（路径见 docs/api.md §3.3）。
 * 带前置校验的方法一律 async：校验失败统一产出 rejected promise（ApiError）。
 */

const NICKNAME_RE = /^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const AVATAR_MAX = 2 * 1024 * 1024

/** 头像前置校验（与后端同规则；超限直接拒绝，不发请求） */
function assertAvatar(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new ApiError("SETTINGS_AVATAR_TYPE", "头像仅支持 JPG/PNG/WebP/GIF", 0)
  }
  if (file.size > AVATAR_MAX) {
    throw new ApiError("SETTINGS_AVATAR_TOO_LARGE", "头像不能超过 2 MB", 0)
  }
}

export const settingsApi = {
  updateNickname: async (nickname: string) => {    if (!NICKNAME_RE.test(nickname)) {
      throw new ApiError("SETTINGS_NICKNAME_INVALID", "昵称 2-16 位中文/英文/数字/下划线", 0)
    }
    return post<{ nickname: string }>("/settings/nickname", { nickname })
  },

  updateUsername: async (username: string) => {
    if (!USERNAME_RE.test(username)) {
      throw new ApiError("SETTINGS_USERNAME_INVALID", "用户名 3-24 位字母/数字/下划线", 0)
    }
    return post<{ username: string }>("/settings/username", { username })
  },

  uploadAvatar: async (file: File) => {
    assertAvatar(file)
    const fd = new FormData()
    fd.append("file", file)
    return post<{ avatarUrl: string }>("/settings/avatar", fd)
  },

  deleteAvatar: () => post<null>("/settings/avatar/delete"),

  // ===== 2FA（契约见 docs/api.md §3.3）=====

  /** POST /settings/2fa/totp/start —— 返回密钥与 otpauth:// 链接（二维码内容） */
  startTotp: () => post<{ secret: string; otpauthUrl: string }>("/settings/2fa/totp/start"),

  /** POST /settings/2fa/totp/confirm —— 校验 6 位码，通过后返回恢复码（只显示一次） */
  confirmTotp: async (code: string) => {
    if (!/^\d{6}$/.test(code)) {
      throw new ApiError("S2FA_CODE_INVALID", "请输入 6 位动态码", 0)
    }
    return post<{ recoveryCodes: string[] }>("/settings/2fa/totp/confirm", { code })
  },

  /** POST /settings/2fa/totp/disable —— 关闭动态码验证（需登录密码） */
  disableTotp: async (password: string) => {
    if (!password) throw new ApiError("SYS_BAD_REQUEST", "请输入登录密码", 0)
    return post<null>("/settings/2fa/totp/disable", { password })
  },

  /** POST /settings/2fa/email —— 开启邮箱二次验证 */
  enableEmail2fa: () => post<null>("/settings/2fa/email"),

  /** POST /settings/2fa/email/disable —— 关闭邮箱二次验证 */
  disableEmail2fa: () => post<null>("/settings/2fa/email/disable"),

  /** POST /settings/2fa/recovery/regenerate —— 重新生成恢复码（旧的立即作废） */
  regenerateRecovery: () => post<{ recoveryCodes: string[] }>("/settings/2fa/recovery/regenerate"),
}
