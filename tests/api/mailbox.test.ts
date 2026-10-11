import { beforeEach, describe, expect, it } from "vitest"
import { mailboxApi } from "@/api/mailbox"
import { loginAsMockUser } from "../helpers/session"

describe("mailboxApi address CRUD", () => {
  beforeEach(() => loginAsMockUser())

  it("lists addresses with message counts", async () => {
    const res = await mailboxApi.listAddresses()
    expect(Array.isArray(res.addresses)).toBe(true)
    expect(res.addresses[0]).toHaveProperty("messageCount")
  })

  it("adds an address under brand email domain", async () => {
    const created = await mailboxApi.addAddress("hello")
    expect(created.address).toBe("hello@xueia.com")
  })

  it("rejects duplicate/invalid local part", async () => {
    await expect(mailboxApi.addAddress("yanxi")).rejects.toMatchObject({ code: "MAILBOX_ADDR_TAKEN" })
    await expect(mailboxApi.addAddress("坏地址!")).rejects.toMatchObject({ code: "SYS_BAD_REQUEST" })
  })

  it("updates forward target and resets verification", async () => {
    const { addresses } = await mailboxApi.listAddresses()
    const target = addresses[0]
    const updated = await mailboxApi.updateAddress(target.id, { forwardTo: "me@example.com" })
    expect(updated.forwardTo).toBe("me@example.com")
    expect(updated.forwardVerified).toBe(false)
  })

  it("deletes an address", async () => {
    const created = await mailboxApi.addAddress("bye")
    await mailboxApi.deleteAddress(created.id)
    const { addresses } = await mailboxApi.listAddresses()
    expect(addresses.some((a) => a.id === created.id)).toBe(false)
  })
})
