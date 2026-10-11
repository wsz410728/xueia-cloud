import { ApiError, get, post } from "@/lib/api-client"

/**
 * 临时分享箱（契约见 docs/api.md）。
 * 分享端与取件端共用此模块；配额/上限来自 /tempbox/config（不硬编码）。
 */

export interface TempboxConfig {
  /** 默认保存时长（分钟） */
  retentionMinutes: number
  /** 单文件上限（MB） */
  maxFileSizeMB: number
  /** 单箱最多文件数 */
  maxFiles: number
  /** 同时保留箱数 */
  maxLive: number
}

export interface TempboxCreated {
  code: string
  /** 分享链接（取件页用，形如 https://xueia.com/tempbox?code=XXXXXX） */
  link: string
  expiresAt: string
}

export type TempboxPickup =
  | { kind: "text"; text: string; expiresAt: string }
  | { kind: "files"; files: Array<{ name: string; size: number; url: string }>; expiresAt: string }

/** 单例缓存配置，供前置校验使用（首次调用时拉取） */
let cachedConfig: TempboxConfig | null = null

async function ensureConfig(): Promise<TempboxConfig> {
  if (!cachedConfig) cachedConfig = await get<TempboxConfig>("/tempbox/config")
  return cachedConfig
}

export const tempboxApi = {
  getConfig: () => get<TempboxConfig>("/tempbox/config"),

  /** 重置本地配置缓存（测试/切换环境用） */
  _resetConfigCache: () => {
    cachedConfig = null
  },

  /** 分享纯文本（存数据库，不占存储） */
  createText: async (text: string): Promise<TempboxCreated> => {
    if (!text.trim()) throw new ApiError("TB_TEXT_EMPTY", "请先输入要分享的文字", 0)
    return post<TempboxCreated>("/tempbox/create", { kind: "text", text })
  },

  /** 分享文件/图片（前置校验大小与数量，超限不发请求） */
  createFiles: async (files: File[]): Promise<TempboxCreated> => {
    const cfg = await ensureConfig()
    if (files.length > cfg.maxFiles) {
      throw new ApiError("TB_TOO_MANY_FILES", `单箱最多 ${cfg.maxFiles} 个文件`, 0)
    }
    const maxBytes = cfg.maxFileSizeMB * 1024 * 1024
    const oversized = files.find((f) => f.size > maxBytes)
    if (oversized) {
      throw new ApiError("TB_FILE_TOO_LARGE", `单文件不超过 ${cfg.maxFileSizeMB} MB`, 0)
    }
    const fd = new FormData()
    fd.append("kind", "files")
    files.forEach((f) => fd.append("files", f))
    return post<TempboxCreated>("/tempbox/create", fd)
  },

  /** 追加文件到已有接收码 */
  uploadToCode: async (code: string, files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append("files", f))
    return post<TempboxCreated>(`/tempbox/${encodeURIComponent(code)}/append`, fd)
  },

  /** 取件（游客可调用；未知/过期码抛 TB_CODE_EXPIRED） */
  pickup: (code: string) => get<TempboxPickup>(`/tempbox/pickup?code=${encodeURIComponent(code)}`),
}
