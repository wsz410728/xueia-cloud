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
