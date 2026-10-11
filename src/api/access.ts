import { post, get } from "@/lib/api-client"

/**
 * 公开 API 访问（设置页「公开 API」卡 + 批次⑥ apiset 页共用）。
 * 契约见 docs/api.md §3.3 / §3.4。
 */

export interface ApiFeature {
  /** 功能名（展示用，来自后端） */
  name: string
  /** 是否开放 */
  open: boolean
  /** 每日额度（次/天） */
  limitPerDay: number
}

export interface ApiAccessStatus {
  hasKey: boolean
  /** 层级 = 成就点 / 10 向下取整 */
  tier: number
  achievementPoints: number
  features: ApiFeature[]
}

export const apiAccessApi = {
  status: () => get<ApiAccessStatus>("/api-key/status"),

  /** 生成/重置都返回一次性明文 Key（仅此一次可见） */
  generateKey: () => post<{ key: string }>("/api-key/generate"),
  resetKey: () => post<{ key: string }>("/api-key/reset"),
  deleteKey: () => post<null>("/api-key/delete"),
}
