import { Component, type ErrorInfo, type ReactNode } from "react"
import { Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getT } from "@/i18n"

interface State {
  error: Error | null
}

/** 路由分段错误边界：渲染兜底 UI（出错了 / 重新加载 / 返回首页） */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const t = getT()
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Cloud className="size-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("error.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("error.desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>{t("error.reload")}</Button>
          <Button variant="outline" onClick={() => window.location.assign("/")}>
            {t("error.backHome")}
          </Button>
        </div>
      </div>
    )
  }
}
