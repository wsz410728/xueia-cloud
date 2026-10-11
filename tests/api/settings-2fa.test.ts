import { beforeEach, describe, expect, it } from "vitest"
import { settingsApi } from "@/api/settings"
import { loginAsMockUser } from "../helpers/session"

describe("2FA management", () => {
  beforeEach(() => loginAsMockUser())

  it("start returns secret and otpauth url", async () => {
    const r = await settingsApi.startTotp()
    expect(r.secret).toMatch(/^[A-Z2-7]{16,}$/)
    expect(r.otpauthUrl).toContain("otpauth://totp/")
  })

  it("confirm returns recovery codes (shown once)", async () => {
    const r = await settingsApi.confirmTotp("123456")
    expect(r.recoveryCodes.length).toBeGreaterThanOrEqual(6)
    for (const c of r.recoveryCodes) expect(c).toMatch(/^[A-Z0-9-]{6,}$/)
  })

  it("confirm rejects wrong code", async () => {
    await expect(settingsApi.confirmTotp("000000")).rejects.toMatchObject({ code: "S2FA_CODE_INVALID" })
  })

  it("email 2FA enable/disable", async () => {
    await expect(settingsApi.enableEmail2fa()).resolves.toBeNull()
    await expect(settingsApi.disableEmail2fa()).resolves.toBeNull()
  })

  it("disable requires password", async () => {
    await expect(settingsApi.disableTotp("")).rejects.toMatchObject({ code: "SYS_BAD_REQUEST" })
    await expect(settingsApi.disableTotp("password123")).resolves.toBeNull()
  })

  it("regenerate recovery codes returns a fresh set", async () => {
    const r = await settingsApi.regenerateRecovery()
    expect(r.recoveryCodes.length).toBeGreaterThanOrEqual(6)
  })
})
