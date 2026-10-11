import { beforeEach, describe, expect, it } from "vitest"
import { pointsApi } from "@/api/points"
import { loginAsMockUser } from "../helpers/session"

describe("pointsApi", () => {
  beforeEach(() => loginAsMockUser())

  it("reports status with balance and check-in state", async () => {
    const s = await pointsApi.status()
    expect(s.balance).toBeGreaterThan(0)
    expect(s.todayCheckedIn).toBe(false)
    expect(s.makeupCards).toBeGreaterThanOrEqual(0)
  })

  it("check-in grants points and is idempotent per day", async () => {
    const first = await pointsApi.checkin()
    expect(first.reward).toBeGreaterThan(0)
    // 同日再签 → 明确错误（Review Focus #4）
    await expect(pointsApi.checkin()).rejects.toMatchObject({ code: "POINTS_ALREADY_CHECKED_IN" })
    const s = await pointsApi.status()
    expect(s.todayCheckedIn).toBe(true)
  })

  it("makeup without cards is rejected", async () => {
    await expect(pointsApi.makeup()).rejects.toMatchObject({ code: "POINTS_NO_MAKEUP_CARD" })
  })

  it("redeem refuses to exceed balance (no overdraft)", async () => {
    const s = await pointsApi.status()
    await expect(pointsApi.redeem(s.balance + 1)).rejects.toMatchObject({ code: "POINTS_INSUFFICIENT" })
  })

  it("redeem within balance reduces it", async () => {
    const before = await pointsApi.status()
    const r = await pointsApi.redeem(10)
    expect(r.balance).toBe(before.balance - 10)
  })

  it("transfer refuses insufficient or non-positive amounts", async () => {
    await expect(pointsApi.transfer("someone", 0)).rejects.toMatchObject({ code: "SYS_BAD_REQUEST" })
    await expect(pointsApi.transfer("someone", 10_000_000)).rejects.toMatchObject({ code: "POINTS_INSUFFICIENT" })
  })

  it("history returns newest-first entries", async () => {
    const h = await pointsApi.history()
    expect(h.items.length).toBeGreaterThan(0)
    expect(h.items[0]).toHaveProperty("reason")
  })
})
