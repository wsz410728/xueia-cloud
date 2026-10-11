import { get, post } from "@/lib/api-client"

/** 邮箱域（路径见 docs/api.md §3.2，批次②） */

export interface MailboxAddress {
  id: string
  address: string
  /** 转发目标（真实邮箱） */
  forwardTo: string | null
  forwardVerified: boolean
  /** 该地址下的邮件数（列表接口计算返回） */
  messageCount: number
  createdAt: string
}

export interface MailMessage {
  id: string
  mailboxId: string
  from: string
  subject: string | null
  /** 纯文本摘要（列表用） */
  excerpt: string
  /** 纯文本正文（详情接口返回；列表可省略为空串） */
  body: string
  read: boolean
  receivedAt: string
}

export const mailboxApi = {
  /** GET /mailbox —— 邮箱地址列表（含每地址邮件数） */
  listAddresses: () => get<{ addresses: MailboxAddress[] }>("/mailbox"),

  /** POST /mailbox —— 新增地址（local part，落库时拼品牌邮箱后缀） */
  addAddress: (local: string) => post<MailboxAddress>("/mailbox", { local }),

  /**
   * POST /mailbox/{id}/update —— 修改转发目标。
   * 注意：只接受 forwardTo；改动后 forwardVerified 由服务端重置为 false，
   * 验证只能走 /mailbox/forward-verify（Task 3）。
   */
  updateAddress: (id: string, patch: { forwardTo: string | null }) =>
    post<MailboxAddress>(`/mailbox/${encodeURIComponent(id)}/update`, patch),

  /** POST /mailbox/{id}/delete */
  deleteAddress: (id: string) => post<null>(`/mailbox/${encodeURIComponent(id)}/delete`),

  /** GET /mailbox/{id} —— 某邮箱的消息列表 */
  listMessages: (mailboxId: string) =>
    get<{ messages: MailMessage[] }>(`/mailbox/${encodeURIComponent(mailboxId)}`),

  /** POST /mailbox/{id}/messages/{mid}/read */
  markRead: (mailboxId: string, messageId: string) =>
    post<null>(`/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/read`),

  /** POST /mailbox/read-all */
  readAll: (mailboxId: string) => post<null>("/mailbox/read-all", { mailboxId }),

  /** GET /mailbox/{id}/messages/{mid} —— 单封详情（含正文） */
  getMessage: (mailboxId: string, messageId: string) =>
    get<MailMessage>(
      `/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}`
    ),

  /** POST /mailbox/{id}/messages/{mid}/reply */
  reply: (mailboxId: string, messageId: string, body: string) =>
    post<null>(
      `/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/reply`,
      { body }
    ),

  /** POST /mailbox/messages/batch-delete */
  batchDelete: (mailboxId: string, ids: string[]) =>
    post<null>("/mailbox/messages/batch-delete", { mailboxId, ids }),
}
