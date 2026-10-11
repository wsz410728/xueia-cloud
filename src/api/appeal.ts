import { ApiError, get, post } from "@/lib/api-client"

/** 封禁申诉（路径见 docs/api.md §3.3） */

export interface AppealSubmitInput {
  /** 用户名或邮箱 */
  account: string
  /** 联系方式（选填） */
  contact?: string
  /** 申诉说明（≥10 字） */
  content: string
}

export interface AppealPendingReply {
  reply: string
  repliedAt: string
  status: "accepted" | "rejected" | "unclear"
}

export const appealApi = {
  /** POST /appeal —— 提交申诉（前端同规则校验：说明 ≥10 字） */
  submit: async (input: AppealSubmitInput) => {
    if (!input.account.trim()) throw new ApiError("SYS_BAD_REQUEST", "请填写账号", 0)
    if (input.content.trim().length < 10) {
      throw new ApiError("SYS_BAD_REQUEST", "申诉说明至少 10 个字", 0)
    }
    return post<{ submittedAt: string }>("/appeal", {
      account: input.account.trim(),
      contact: input.contact?.trim() || undefined,
      content: input.content.trim(),
    })
  },

  /** GET /appeal/pending-reply —— 管理员回复（有则需「已阅」确认） */
  pendingReply: () => get<AppealPendingReply | null>("/appeal/pending-reply"),
}
