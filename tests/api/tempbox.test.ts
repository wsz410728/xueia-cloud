import { beforeEach, describe, expect, it } from "vitest"
import { tempboxApi } from "@/api/tempbox"
import { loginAsMockUser } from "../helpers/session"

describe("tempbox share", () => {
  beforeEach(() => loginAsMockUser())

  it("returns config with retention and limits", async () => {
    const cfg = await tempboxApi.getConfig()
    expect(cfg.retentionMinutes).toBe(30)
    expect(cfg.maxFileSizeMB).toBe(100)
    expect(cfg.maxFiles).toBe(100)
    expect(cfg.maxLive).toBe(10)
  })

  it("creates a 6-char code and share link for text", async () => {
    const r = await tempboxApi.createText("hello tempbox")
    expect(r.code).toMatch(/^[A-Z0-9]{6}$/)
    expect(r.link).toContain(`/tempbox?code=${r.code}`)
    expect(new Date(r.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it("rejects empty text", async () => {
    await expect(tempboxApi.createText("   ")).rejects.toMatchObject({ code: "TB_TEXT_EMPTY" })
  })

  it("rejects oversized file before upload", async () => {
    const big = new File([new Uint8Array(101 * 1024 * 1024)], "a.bin", { type: "application/octet-stream" })
    await expect(tempboxApi.createFiles([big])).rejects.toMatchObject({ code: "TB_FILE_TOO_LARGE" })
  })

  it("rejects too many files before upload", async () => {
    const files = Array.from({ length: 101 }, (_, i) => new File(["x"], `f${i}.txt`, { type: "text/plain" }))
    await expect(tempboxApi.createFiles(files)).rejects.toMatchObject({ code: "TB_TOO_MANY_FILES" })
  })
})
