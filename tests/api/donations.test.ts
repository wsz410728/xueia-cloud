import { beforeEach, describe, expect, it } from "vitest"
import { donationsApi } from "@/api/donations"
import { loginAsMockUser } from "../helpers/session"

describe("donationsApi", () => {
  beforeEach(() => loginAsMockUser())

  it("lists three resource types, all locked by default", async () => {
    const r = await donationsApi.list()
    expect(r.types.map((t) => t.key)).toEqual(["ai", "frp", "proxy"])
    expect(r.types.every((t) => !t.unlocked)).toBe(true)
    expect(r.records).toEqual([])
  })

  it("rejects a malformed proxy subscription link before submit", async () => {
    await expect(donationsApi.submit("proxy", { link: "not-a-url" })).rejects.toMatchObject({
      code: "DON_FORMAT_INVALID",
    })
  })

  it("rejects an empty AI channel payload before submit", async () => {
    await expect(donationsApi.submit("ai", { baseUrl: "", key: "" })).rejects.toMatchObject({
      code: "DON_FORMAT_INVALID",
    })
  })

  it("submits a valid proxy link and records it as pending", async () => {
    await donationsApi.submit("proxy", { link: "https://sub.example.com/clash" })
    const r = await donationsApi.list()
    expect(r.records[0]?.status).toBe("pending")
    expect(r.records[0]?.type).toBe("proxy")
  })

  it("rejects a duplicate submission of the same link", async () => {
    const link = "https://dup.example.com/clash"
    await donationsApi.submit("proxy", { link })
    await expect(donationsApi.submit("proxy", { link })).rejects.toMatchObject({
      code: "DON_DUPLICATE",
    })
  })
})

describe("donationsApi 邀请", () => {
  beforeEach(() => loginAsMockUser())

  it("lists invites and rewards (empty by default)", async () => {
    const r = await donationsApi.listInvites()
    expect(Array.isArray(r.codes)).toBe(true)
    expect(Array.isArray(r.rewards)).toBe(true)
  })

  it("creates an invite code in VX-XXXX-XXXX shape", async () => {
    const c = await donationsApi.createInvite()
    expect(c.code).toMatch(/^VX-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    const r = await donationsApi.listInvites()
    expect(r.codes.some((x) => x.code === c.code)).toBe(true)
  })

  it("claims a valid invite code once", async () => {
    const c = await donationsApi.createInvite()
    await expect(donationsApi.claimCode(c.code)).resolves.toMatchObject({ ok: true })
    // 第二次补填同一码 → 已用
    await expect(donationsApi.claimCode(c.code)).rejects.toMatchObject({ code: "DON_CLAIM_USED" })
  })

  it("rejects an unknown code", async () => {
    await expect(donationsApi.claimCode("VX-XXXX-YYYY")).rejects.toMatchObject({ code: "DON_CODE_INVALID" })
  })
})

describe("donationsApi 兑换码", () => {
  beforeEach(() => loginAsMockUser())

  it("a normal voucher auto-grants the missing module", async () => {
    const r = await donationsApi.redeem("VX-AA01-BB01")
    expect(r.unlocked).toContain("frp")
    expect(r.skipped.length).toBe(0)
  })

  it("a pick-permission voucher requires a module selection", async () => {
    await expect(donationsApi.redeem("VX-SELF-0001")).rejects.toMatchObject({ code: "DON_PICK_MODULE" })
    const r = await donationsApi.redeem("VX-SELF-0001", "proxy")
    expect(r.unlocked).toContain("proxy")
  })

  it("an invalid voucher is rejected", async () => {
    await expect(donationsApi.redeem("VX-XXXX-YYYY")).rejects.toMatchObject({ code: "DON_CODE_INVALID" })
  })
})
