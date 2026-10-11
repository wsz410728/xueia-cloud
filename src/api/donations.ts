import { ApiError, get, post } from "@/lib/api-client"

/**
 * 捐献与邀请（契约见 docs/api.md §3.7；路径本项目 /api/v1）。
 * 贡献提交做格式前置校验（不发无效请求，Review Focus #5）。
 */

export type DonationTypeKey = "ai" | "frp" | "proxy"

export interface DonationType {
  key: DonationTypeKey
  label: string
  desc: string
  /** 该资源对应的功能权限是否已解锁 */
  unlocked: boolean
  /** 通过审核是否授予功能权限 */
  grantsPermission: boolean
}

export interface DonationRecord {
  id: string
  type: DonationTypeKey
  status: "pending" | "approved" | "rejected" | "expired"
  submittedAt: string
  reviewNote?: string
}

export const donationsApi = {
  /** GET /donations —— 资源类型（含解锁态）+ 我的捐献记录 */
  list: () => get<{ types: DonationType[]; records: DonationRecord[] }>("/donations"),

  /** POST /donations —— 提交贡献（按类型 payload 校验） */
  submit: async (type: DonationTypeKey, payload: Record<string, string>) => {
    if (type === "proxy" && !/^https:\/\/\S+$/i.test(payload.link ?? "")) {
      throw new ApiError("DON_FORMAT_INVALID", "订阅链接必须是 http(s) 地址", 0)
    }
    if (type === "ai" && (!payload.baseUrl?.trim() || !payload.key?.trim())) {
      throw new ApiError("DON_FORMAT_INVALID", "请填写 Base URL 与 API Key", 0)
    }
    if (type === "frp") {
      const cfg = payload.config ?? ""
      if (!cfg.includes("serverAddr") || !cfg.includes("serverPort")) {
        throw new ApiError("DON_FORMAT_INVALID", "config 需包含 serverAddr 与 serverPort", 0)
      }
    }
    return post<{ id: string }>("/donations", { type, payload })
  },

  /**
   * POST /vouchers/redeem —— 用别人的码/自选券。
   * 自选券（VX-SELF-*）必须选模块 → 否则 DON_PICK_MODULE；普通码自动补缺，已有跳过。
   */
  redeem: async (code: string, moduleKey?: DonationTypeKey) => {
    const c = code.trim().toUpperCase()
    if (!/^VX-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)) {
      throw new ApiError("DON_CODE_INVALID", "兑换码格式不正确", 0)
    }
    if (c.startsWith("VX-SELF-") && !moduleKey) {
      throw new ApiError("DON_PICK_MODULE", "自选券需要先选择一个模块", 0)
    }
    return post<{ unlocked: string[]; skipped: string[] }>("/vouchers/redeem", { code: c, moduleKey })
  },

  /** GET /my-invites —— 我的邀请码 + 邀请奖励记录 */
  listInvites: () =>
    get<{
      codes: Array<{ code: string; uses: number; max: number; createdAt: string }>
      rewards: Array<{ invited: string; subscription: string; daily: string; at: string }>
    }>("/my-invites"),

  /** POST /my-invites —— 创建邀请码（形如 VX-XXXX-XXXX） */
  createInvite: () => post<{ code: string }>("/my-invites"),

  /**
   * POST /my-invites/claim —— 补填邀请码（注册后 7 天内一次）。
   * 已补填过 → DON_CLAIM_USED；无效码 → DON_CODE_INVALID。
   */
  claimCode: async (code: string) => {
    if (!/^VX-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code.trim())) {
      throw new ApiError("DON_CODE_INVALID", "邀请码格式不正确", 0)
    }
    return post<{ ok: true; rewarded?: number }>("/my-invites/claim", { code: code.trim().toUpperCase() })
  },

  /** POST /donations/cancel —— 撤回待审核申请 */
  cancel: (id: string) => post<null>(`/donations/${encodeURIComponent(id)}/cancel`),
}
