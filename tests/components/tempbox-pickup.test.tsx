import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { I18nProvider } from "@/i18n"
import { PickupPage } from "@/features/tempbox/PickupPage"

function renderPickup(initial = "/tempbox") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <MemoryRouter initialEntries={[initial]}>
          <PickupPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe("PickupPage（游客免登录）", () => {
  it("renders the unlock form with visitor hint", () => {
    renderPickup()
    expect(screen.getByRole("heading", { name: "输入接收码解锁" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "解锁" })).toBeInTheDocument()
  })

  it("shows a friendly expired state for an unknown code", async () => {
    renderPickup()
    await userEvent.type(screen.getByRole("textbox"), "ZZZZZZ")
    await userEvent.click(screen.getByRole("button", { name: "解锁" }))
    expect(await screen.findByText(/已过期或不存在/)).toBeInTheDocument()
    // 不抛未捕获错误，仍可重新输入
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("auto-unlocks from ?code= and renders shared text", async () => {
    renderPickup("/tempbox?code=ABC123")
    expect(await screen.findByText("hello from mock")).toBeInTheDocument()
  })
})
