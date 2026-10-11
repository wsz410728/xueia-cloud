import { get, post } from "@/lib/api-client"

/** 邮箱域（路径见 docs/api.md §3.2，批次 ②） */

export interface MailboxAddress {
  id: string
  address: string
  /** 转发目标（真实邮箱） */
  forwardTo: string | null
  forwardVerified: boolean
  createdAt: string
}

export interface MailMessage {
  id: string
  mailboxId: string
  from: string
  subject: string | null
  /** 纯文本摘要（渲染正文属批次②完整版） */
  excerpt: string
  read: boolean
  receivedAt: string
}

export const mailboxApi = {
  /** GET /mailbox —— 邮箱地址列表 */
  listAddresses: () => get<{ addresses: MailboxAddress[] }>("/mailbox"),

  /** GET /mailbox/{id} —— 某邮箱的消息列表 */
  listMessages: (mailboxId: string) =>
    get<{ messages: MailMessage[] }>(`/mailbox/${encodeURIComponent(mailboxId)}`),

  /** POST /mailbox/{id}/messages/{mid}/read */
  markRead: (mailboxId: string, messageId: string) =>
    post<null>(`/mailbox/${encodeURIComponent(mailboxId)}/messages/${encodeURIComponent(messageId)}/read`),

  /** POST /mailbox/read-all */
  readAll: (mailboxId: string) => post<null>(`/mailbox/read-all`, { mailboxId }),
}
