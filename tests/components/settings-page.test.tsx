import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { I18nProvider } from "@/i18n"
import { SettingsPage } from "@/features/settings/SettingsPage"

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe("SettingsPage skeleton", () => {
  it("renders title and all seven category filters", () => {
    renderPage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("设置")
    for (const label of ["全部", "账户", "通用", "安全", "通知", "API", "危险区"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
  })

  it("filters cards by category", async () => {
    renderPage()
    // 默认「全部」：个人资料与注销账号同时可见
    expect(screen.getByText("个人资料")).toBeInTheDocument()
    expect(screen.getByText("注销账号")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "危险区" }))
    expect(screen.getByText("注销账号")).toBeInTheDocument()
    expect(screen.queryByText("个人资料")).not.toBeInTheDocument()
  })
})
