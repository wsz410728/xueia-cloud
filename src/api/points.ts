import { ApiError, get, post } from "@/lib/api-client"

/**
 * 积分与商城（契约见 docs/api.md §3.9；/api/v1 前缀）。
 * 签到幂等 / 不可透支等约束：前端同规则前置校验 + mock 后端二次校验。
 */

export interface PointsStatus {
  balance: number
  todayCheckedIn: boolean
  /** 补签卡数量（0 时不可补签） */
  makeupCards: number
}

export interface CheckinResult {
  reward: number
  streak: number
}

export interface PointsHistoryItem {
  reason: string
  /** 正为收入，负为支出 */
  amount: number
  at: string
}

export const pointsApi = {
  /** GET /points */
  status: () => get<PointsStatus>("/points"),

  /** POST /checkin —— 每日一次；重复 → POINTS_ALREADY_CHECKED_IN */
  checkin: () => post<CheckinResult>("/checkin"),

  /** POST /checkin/makeup —— 消耗补签卡；无卡 → POINTS_NO_MAKEUP_CARD */
  makeup: () => post<CheckinResult>("/checkin/makeup"),

  /** POST /points/redeem —— 积分兑换中转站余额；余额不足 → POINTS_INSUFFICIENT */
  redeem: async (amount: number) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ApiError("SYS_BAD_REQUEST", "兑换金额必须是正整数", 0)
    }
    return post<{ balance: number }>("/points/redeem", { amount })
  },

  /** POST /points/transfer —— 转账给其他用户 */
  transfer: async (to: string, amount: number) => {
    if (!to.trim()) throw new ApiError("SYS_BAD_REQUEST", "请填写收款用户", 0)
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ApiError("SYS_BAD_REQUEST", "转账金额必须是正整数", 0)
    }
    return post<{ balance: number }>("/points/transfer", { to: to.trim(), amount })
  },

  /** GET /points/history —— 积分明细（最近优先） */
  history: () => get<{ items: PointsHistoryItem[] }>("/points/history"),

  /** GET /points/products —— 商城商品 */
  listProducts: () => get<{ products: Array<{ id: string; name: string; desc: string; price: number; stock: number; delivery: string }> }>("/points/products"),

  /** POST /points/shop/buy —— 购买（扣积分、减库存）；余额不足 → POINTS_INSUFFICIENT */
  buy: (productId: string) => post<{ orderId: string }>("/points/shop/buy", { productId }),

  /** GET /points/my-orders —— 我的订单 */
  myOrders: () =>
    get<{
      orders: Array<{
        id: string
        productId: string
        product: string
        status: "await_seller" | "await_receipt" | "done" | "cancelled"
        deliveryContent?: string
        createdAt: string
      }>
    }>("/points/my-orders"),
}
