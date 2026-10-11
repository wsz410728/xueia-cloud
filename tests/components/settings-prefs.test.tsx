import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nProvider } from "@/i18n"
import { GeneralCard } from "@/features/settings/GeneralCard"
import { getUiPrefs } from "@/lib/ui-prefs"

function renderGeneral() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <GeneralCard />
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe("GeneralCard 界面动效偏好（localStorage 持久化，不入库）", () => {
  beforeEach(() => localStorage.clear())

  it("defaults to motion on and particles off", () => {
    renderGeneral()
    expect(screen.getByRole("switch", { name: /启用动效/ })).toBeChecked()
    expect(screen.getByRole("switch", { name: /点击粒子/ })).not.toBeChecked()
  })

  it("persists motion preference to localStorage on toggle", async () => {
    renderGeneral()
    await userEvent.click(screen.getByRole("switch", { name: /启用动效/ }))
    expect(getUiPrefs().motion).toBe(false)
    expect(localStorage.getItem("xueia-ui-prefs")).toContain("motion")
  })

  it("disables the particle switch while motion is off", async () => {
    renderGeneral()
    await userEvent.click(screen.getByRole("switch", { name: /启用动效/ }))
    expect(screen.getByRole("switch", { name: /点击粒子/ })).toBeDisabled()
  })
})
