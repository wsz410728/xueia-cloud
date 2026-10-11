/**
 * Xueia Cloud PWA Service Worker。
 * 策略（对齐原站被事故验证过的方案）：
 *   - 导航（HTML）：网络优先，失败回退缓存壳（不打堵 chunk 自愈的 404→刷新通道）。
 *   - 带哈希静态资源：缓存优先；Content-Type 为 text/html 冒充的一律不缓存。
 *   - /api/*：永不缓存。
 * ⚠️ 改动本文件或其缓存内容时，必须手动递增下方 CACHE 版本号（AGENTS.md §6.2）。
 */
const CACHE = "xueia-shell-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"]))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith("/api/")) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put("/", copy))
          return res
        })
        .catch(() => caches.match("/"))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        const ct = (res.headers.get("Content-Type") || "").toLowerCase()
        const htmlFallback = ct.includes("text/html") && !url.pathname.endsWith(".html")
        if (res.ok && !htmlFallback) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
    })
  )
})
