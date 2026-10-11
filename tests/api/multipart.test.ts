import { describe, expect, it } from "vitest"
import { post } from "@/lib/api-client"

/**
 * 终审 C1 回归：`post` 必须原样透传 FormData。
 * 背景：此前 post 无条件 JSON.stringify，把 FormData 变成 "{}" 字符串，
 * 导致头像上传 / 文件分享的成功路径全坏（文件分享会静默建出空文字箱）。
 *
 * 说明：jsdom 的 FormData 与 undici fetch 跨实现，真实 multipart 传输在单测里
 * 不可靠（会挂起）；因此这里只断言边界契约（body 类型），
 * 真实上传成功路径由 Playwright E2E（真浏览器、原生 FormData）覆盖。
 */
describe("api-client multipart 透传契约", () => {
  it("post 传 FormData 时不做 JSON.stringify，也不手动设 Content-Type", async () => {
    const fd = new FormData()
    fd.append("file", new File(["x"], "a.txt", { type: "text/plain" }))

    let seenBody: unknown
    let seenContentType: string | undefined
    const origFetch = globalThis.fetch
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      seenBody = init?.body
      seenContentType = (init?.headers as Record<string, string> | undefined)?.["Content-Type"]
      return new Response(JSON.stringify({ ok: true, data: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    try {
      await post("/probe", fd)
    } finally {
      globalThis.fetch = origFetch
    }

    expect(seenBody).toBeInstanceOf(FormData)
    expect(typeof seenBody).not.toBe("string")
    expect(seenContentType).toBeUndefined()
  })

  it("post 传普通对象时仍然是 JSON 字符串", async () => {
    let seenBody: unknown
    const origFetch = globalThis.fetch
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      seenBody = init?.body
      return new Response(JSON.stringify({ ok: true, data: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    try {
      await post("/probe", { a: 1 })
    } finally {
      globalThis.fetch = origFetch
    }

    expect(seenBody).toBe(JSON.stringify({ a: 1 }))
  })
})
