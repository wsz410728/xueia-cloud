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

  /** POST /donations/cancel —— 撤回待审核申请 */
  cancel: (id: string) => post<null>(`/donations/${encodeURIComponent(id)}/cancel`),
}
