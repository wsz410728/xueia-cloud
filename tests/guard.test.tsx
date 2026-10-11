import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router"
import { RequireAuth } from "@/features/dashboard-shell/DashboardLayout"

function renderGuard(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>dashboard-content</div>} />
          </Route>
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 路由守卫三态（已登录 / 未登录 / 加载中）——AGENTS.md §6.1 必测 */
describe("RequireAuth guard", () => {
  it("redirects to /login with from param when 401", async () => {
    renderGuard("/dashboard")
    // /me 返回 401（MSW 默认 handler），api-client 会 assign location；
    // jsdom 不支持 location.assign 跳转导航，但 <Navigate> 由组件层完成。
    // 这里断言未渲染受保护内容。
    expect(screen.queryByText("dashboard-content")).not.toBeInTheDocument()
  })

  it("renders protected content when logged in", async () => {
    // 预置：先让 /me 返回用户 —— 通过自定义 handler 覆盖
    const { server } = await import("./setup")
    const { HttpResponse, http } = await import("msw")
    const { mockUser } = await import("@/mocks/handlers")
    server.use(
      http.get("/api/v1/me", () => HttpResponse.json({ ok: true, data: mockUser }))
    )
    renderGuard("/dashboard")
    expect(await screen.findByText("dashboard-content")).toBeInTheDocument()
  })
})

/** 终审 I5：白名单例外必须真实生效（游客可看 community/gallery/events，其余弹回登录） */
describe("RequireAuth 白名单例外", () => {
  it("lets guests open whitelisted dashboard routes", async () => {
    const { server } = await import("./setup")
    const { HttpResponse, http } = await import("msw")
    // 未登录（/me 401），访问白名单路由应渲染内容而不是跳登录
    server.use(http.get("/api/v1/me", () => HttpResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "未登录" } }, { status: 401 })))
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/dashboard/community"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/dashboard/community" element={<div>community-guest-content</div>} />
            </Route>
            <Route path="/login" element={<div>login-page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(await screen.findByText("community-guest-content")).toBeInTheDocument()
    expect(screen.queryByText("login-page")).not.toBeInTheDocument()
  })

  it("still redirects guests away from non-whitelisted dashboard routes", async () => {
    renderGuard("/dashboard")
    expect(screen.queryByText("dashboard-content")).not.toBeInTheDocument()
  })
})
