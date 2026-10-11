import { ApiError, get, post } from "@/lib/api-client"

/**
 * AI 中转站（契约见 docs/api.md §5.2 ai/dev 组；本项目统一 /api/v1 前缀）。
 * 状态门：configured（管理员是否配好凭据）→ enabled（功能是否开放）→ unlocked（当前用户是否有权限）。
 */

export interface AiStatus {
  /** 管理员是否已配置 NewAPI 凭据 */
  configured: boolean
  /** 功能是否开放（管理员可整体关闭） */
  enabled: boolean
  /** 当前用户是否已解锁（贡献审核通过或兑换权限） */
  unlocked: boolean
  /** 可用模型数 */
  modelCount: number
  /** 今日剩余额度（未解锁为 null） */
  remainingQuota: string | null
  /** 中转站 Base URL（OpenAI 兼容接入点，未解锁为 null） */
  baseUrl: string | null
}

export interface AiKey {
  id: string
  name: string
  group: string
  createdAt: string
  /** 脱敏前缀（明文只在创建响应里出现一次） */
  skPrefix: string
}

export interface AiModel {
  name: string
  tag: string | null
}

export interface AiSubscription {
  title: string
  remaining: string
  total: string
  nextResetAt: string
}

export interface AiModelsResult {
  models: AiModel[]
  /** 推荐模型名（按综合能力分档，从上到下递减） */
  recommended: string[]
}

export const aiApi = {
  /** GET /ai/status */
  getStatus: () => get<AiStatus>("/ai/status"),

  /** GET /ai/account —— 中转站账号是否已建（用本站账号登录中转站后即存在） */
  checkAccount: () => get<{ accountExists: boolean }>("/ai/account"),

  /** GET /dev/keys —— API Key 列表（脱敏） */
  listKeys: () => get<{ keys: AiKey[] }>("/dev/keys"),

  /** POST /dev/key —— 创建（明文 key 仅此次响应可见） */
  createKey: async (name: string) => {
    if (!name.trim()) throw new ApiError("SYS_BAD_REQUEST", "请填写 Key 名称", 0)
    return post<{ key: string }>("/dev/key", { name: name.trim() })
  },

  /** POST /dev/key/delete */
  deleteKey: (id: string) => post<null>("/dev/key/delete", { id }),

  /** GET /ai/models —— 全部模型 + 推荐档位 */
  listModels: () => get<AiModelsResult>("/ai/models"),

  /** GET /ai/subscriptions —— 免费订阅 + 其他订阅 */
  listSubscriptions: () =>
    get<{ free: AiSubscription | null; rewards: AiSubscription[] }>("/ai/subscriptions"),

  /**
   * POST /ai/bind —— 用本站登录密码绑定中转站账号并解锁。
   * 密码即登录密码（原站语义：两边共用同一密码），不匹配 → AI_PASSWORD_MISMATCH。
   */
  bind: async (password: string) => {
    if (!password) throw new ApiError("SYS_BAD_REQUEST", "请输入登录密码", 0)
    return post<{ unlocked: true }>("/ai/bind", { password })
  },
}
