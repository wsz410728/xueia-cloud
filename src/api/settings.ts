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
  updateNickname: async (nickname: string) => {
    if (!NICKNAME_RE.test(nickname)) {
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
}
