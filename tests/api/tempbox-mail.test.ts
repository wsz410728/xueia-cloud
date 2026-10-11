import { beforeEach, describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"
import { loginAsMockUser } from "../helpers/session"

describe("temp mailbox & forward verify", () => {
  beforeEach(() => loginAsMockUser())

  it("getTemp is null before creation", async () => {
    expect(await mailboxApi.getTemp()).toBeNull()
  })

  it("creates then refreshes to a different address", async () => {
    const a = await mailboxApi.createTemp()
    expect(a.address).toMatch(/@temp\.xueia\.com$/)
    expect(a.expiresAt).toBeTruthy()
    const b = await mailboxApi.refreshTemp(a.id)
    expect(b.address).not.toBe(a.address)
  })

  it("verifies forward code and marks the address", async () => {
    await mailboxApi.sendForwardVerify("mb-1", "me@example.com")
    await expect(mailboxApi.verifyForward("mb-1", "000000")).rejects.toMatchObject({ code: "MAILBOX_CODE_INVALID" })
    await expect(mailboxApi.verifyForward("mb-1", "123456")).resolves.toBeNull()
    const { addresses } = await mailboxApi.listAddresses()
    const target = addresses.find((a) => a.id === "mb-1")
    expect(target?.forwardVerified).toBe(true)
    expect(target?.forwardTo).toBe("me@example.com")
  })
})
