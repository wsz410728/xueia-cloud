import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@/index.css"
import { I18nProvider } from "@/i18n"
import { AppRoutes } from "@/routes"
import { ErrorBoundary } from "@/features/placeholder/ErrorBoundary"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { watchSystemTheme } from "@/lib/theme"

async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import("@/mocks/browser")
  // 开发态：先清掉可能已注册的 PWA SW（历史遗留注册会挤占 MSW 的 scope）
  const regs = await navigator.serviceWorker?.getRegistrations?.() ?? []
  for (const r of regs) await r.unregister()
  await worker.start({ onUnhandledRequest: "bypass" })
}

/** 生产环境注册 PWA SW（dev 态由 MSW worker 独占 scope，见 enableMocking） */
function registerServiceWorker() {
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    })
  }
}

async function bootstrap() {
  watchSystemTheme()
  registerServiceWorker()
  await enableMocking()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false },
    },
  })

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
