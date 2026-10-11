import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { I18nProvider } from "@/i18n"
import { AppealPage } from "@/features/appeal/AppealPage"

function renderAppeal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <MemoryRouter>
          <AppealPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe("AppealPage（公开页）", () => {
  it("renders title, three fields and disabled submit", () => {
    renderAppeal()
    expect(screen.getByRole("heading", { name: /账号申诉/ })).toBeInTheDocument()
    expect(screen.getByLabelText("账号（用户名或邮箱）")).toBeInTheDocument()
    expect(screen.getByLabelText("联系方式（选填）")).toBeInTheDocument()
    expect(screen.getByLabelText("申诉说明")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "提交申诉" })).toBeDisabled()
  })

  it("counts remaining characters and enables submit at 10 chars", async () => {
    renderAppeal()
    await userEvent.type(screen.getByLabelText("账号（用户名或邮箱）"), "jooyang")
    const textarea = screen.getByLabelText("申诉说明")
    await userEvent.type(textarea, "12345")
    expect(screen.getByText(/还需 5 个字/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "提交申诉" })).toBeDisabled()

    await userEvent.type(textarea, "67890")
    expect(screen.getByRole("button", { name: "提交申诉" })).toBeEnabled()
  })

  it("submits and switches to the submitted state", async () => {
    renderAppeal()
    await userEvent.type(screen.getByLabelText("账号（用户名或邮箱）"), "jooyang")
    await userEvent.type(screen.getByLabelText("申诉说明"), "我的账号被误封了，请管理员复核，谢谢。")
    await userEvent.click(screen.getByRole("button", { name: "提交申诉" }))
    expect(await screen.findByText(/已提交/)).toBeInTheDocument()
  })
})
