import { Link } from "react-router"
import { Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/i18n"

/** 404 页（SPA 回退路由） */
export function NotFoundPage() {
  const { t } = useT()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Cloud className="size-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">404 · {t("nf.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("nf.desc")}</p>
      </div>
      <Button asChild>
        <Link to="/">{t("error.backHome")}</Link>
      </Button>
    </div>
  )
}
