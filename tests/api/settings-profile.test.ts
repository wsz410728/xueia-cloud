import { beforeEach, describe, expect, it } from "vitest"
import { settingsApi } from "@/api/settings"
import { loginAsMockUser } from "../helpers/session"

describe("settings profile", () => {
  beforeEach(() => loginAsMockUser())

  it("rejects nickname shorter than 2 or longer than 16", async () => {
    await expect(settingsApi.updateNickname("a")).rejects.toMatchObject({ code: "SETTINGS_NICKNAME_INVALID" })
    await expect(settingsApi.updateNickname("x".repeat(17))).rejects.toMatchObject({ code: "SETTINGS_NICKNAME_INVALID" })
  })

  it("accepts valid nickname", async () => {
    await expect(settingsApi.updateNickname("颜汐_01")).resolves.toBeTruthy()
  })

  it("rejects overlong or invalid username", async () => {
    await expect(settingsApi.updateUsername("ab")).rejects.toMatchObject({ code: "SETTINGS_USERNAME_INVALID" })
    await expect(settingsApi.updateUsername("has space")).rejects.toMatchObject({ code: "SETTINGS_USERNAME_INVALID" })
  })

  it("rejects oversized avatar before upload", async () => {
    const big = new File([new Uint8Array(3 * 1024 * 1024)], "a.png", { type: "image/png" })
    await expect(settingsApi.uploadAvatar(big)).rejects.toMatchObject({ code: "SETTINGS_AVATAR_TOO_LARGE" })
  })

  it("rejects unsupported avatar type", async () => {
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" })
    await expect(settingsApi.uploadAvatar(svg)).rejects.toMatchObject({ code: "SETTINGS_AVATAR_TYPE" })
  })
})
