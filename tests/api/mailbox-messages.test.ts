import { beforeEach, describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"
import { loginAsMockUser } from "../helpers/session"

describe("mailboxApi message ops", () => {
  beforeEach(() => loginAsMockUser())

  it("marks a message read", async () => {
    await mailboxApi.markRead("mb-1", "m-1")
    const { messages } = await mailboxApi.listMessages("mb-1")
    expect(messages.find((m) => m.id === "m-1")?.read).toBe(true)
  })

  it("marks all read", async () => {
    await mailboxApi.readAll("mb-1")
    const { messages } = await mailboxApi.listMessages("mb-1")
    expect(messages.every((m) => m.read)).toBe(true)
  })

  it("batch deletes by ids", async () => {
    await mailboxApi.batchDelete("mb-1", ["m-2"])
    const { messages } = await mailboxApi.listMessages("mb-1")
    expect(messages.some((m) => m.id === "m-2")).toBe(false)
  })

  it("returns full body for a message", async () => {
    const msg = await mailboxApi.getMessage("mb-1", "m-1")
    expect(typeof msg.body).toBe("string")
    expect(msg.body.length).toBeGreaterThan(0)
  })

  it("replies to a message", async () => {
    await expect(mailboxApi.reply("mb-1", "m-1", "收到，谢谢")).resolves.toBe(null)
    await expect(mailboxApi.reply("mb-1", "m-1", "   ")).rejects.toMatchObject({ code: "SYS_BAD_REQUEST" })
  })
})
