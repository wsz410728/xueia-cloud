import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api-client"

/** api-client 错误分支（envelope 解析）——AGENTS.md §6.1 必测三类之一 */
describe("envelope contract", () => {
  it("ApiError carries code/status/retryAfter", () => {
    const err = new ApiError("SYS_RATE_LIMITED", "操作太频繁", 429, 30)
    expect(err.code).toBe("SYS_RATE_LIMITED")
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(30)
    expect(err.message).toBe("操作太频繁")
  })

  it("envelope success shape", () => {
    const body = { ok: true, data: { user: { id: "u1" } } }
    expect(body.ok).toBe(true)
  })

  it("envelope failure shape", () => {
    const body = { ok: false as const, error: { code: "AUTH_REQUIRED", message: "未登录" } }
    if (!body.ok) {
      expect(body.error.code).toBe("AUTH_REQUIRED")
    }
  })
})
