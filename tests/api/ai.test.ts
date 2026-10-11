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

describe("aiApi 已解锁（Key/模型/订阅）", () => {
  beforeEach(async () => {
    await loginAsMockUser()
    // 解锁后测试 Key/模型/订阅
    await aiApi.bind("password123")
  })

  it("listKeys starts empty and createKey returns a one-time plain key", async () => {
    const before = await aiApi.listKeys()
    expect(before.keys).toEqual([])
    const created = await aiApi.createKey("e2e-key")
    expect(created.key).toMatch(/^sk-/)
    const after = await aiApi.listKeys()
    expect(after.keys.length).toBe(1)
    expect(after.keys[0].name).toBe("e2e-key")
    // 列表只含脱敏前缀，明文不再出现
    expect(after.keys[0].skPrefix).not.toBe(created.key)
  })

  it("deleteKey removes it", async () => {
    await aiApi.createKey("to-delete")
    const { keys } = await aiApi.listKeys()
    const target = keys.find((k) => k.name === "to-delete")
    expect(target).toBeTruthy()
    await aiApi.deleteKey(target!.id)
    const after = await aiApi.listKeys()
    expect(after.keys.some((k) => k.name === "to-delete")).toBe(false)
  })

  it("listModels returns models with recommendations", async () => {
    const r = await aiApi.listModels()
    expect(r.models.length).toBeGreaterThan(0)
    expect(r.recommended.length).toBeGreaterThan(0)
  })

  it("listSubscriptions returns free quota", async () => {
    const r = await aiApi.listSubscriptions()
    expect(r.free).not.toBeNull()
    expect(r.free!.remaining).toBeTruthy()
  })
})
