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
  await worker.start({ onUnhandledRequest: "bypass" })
}

async function bootstrap() {
  watchSystemTheme()
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
