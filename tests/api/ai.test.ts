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
