import { beforeEach, describe, expect, it } from "vitest"
import { aiApi } from "@/api/ai"
import { loginAsMockUser } from "../helpers/session"

describe("aiApi status", () => {
  beforeEach(() => loginAsMockUser())

  it("reports locked state for a user without permission", async () => {
    const s = await aiApi.getStatus()
    expect(s.unlocked).toBe(false)
    expect(s.enabled).toBe(true)
    expect(s.configured).toBe(true)
    expect(s.modelCount).toBeGreaterThan(0)
  })
})

describe("aiApi 解锁绑定", () => {
  beforeEach(() => loginAsMockUser())

  it("bind with a wrong password is rejected", async () => {
    await expect(aiApi.bind("wrong-pass")).rejects.toMatchObject({ code: "AI_PASSWORD_MISMATCH" })
  })

  it("bind with the login password unlocks and flips status", async () => {
    await expect(aiApi.bind("password123")).resolves.toMatchObject({ unlocked: true })
    const s = await aiApi.getStatus()
    expect(s.unlocked).toBe(true)
    expect(s.baseUrl).toContain("ai.xueia.com")
    expect(s.remainingQuota).toBeTruthy()
  })

  it("checkAccount reports the gateway account exists", async () => {
    await expect(aiApi.checkAccount()).resolves.toEqual({ accountExists: true })
  })
})
