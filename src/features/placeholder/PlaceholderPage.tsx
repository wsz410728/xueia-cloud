import { cn } from "@/lib/utils"
import { useT } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Cloud } from "lucide-react"
import { Link } from "react-router"

/** 「建设中」占位页（全量路由先立起来，后续批次逐个替换） */
export function PlaceholderPage({ moduleKey }: { moduleKey?: string }) {
  const { t } = useT()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Cloud className="size-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold">
          {moduleKey ? t(`nav.${moduleKey}`) : t("ph.title")} · {t("ph.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ph.desc")}</p>
      </div>
      <Button asChild variant="outline" size="sm" className={cn()}>
        <Link to="/dashboard">{t("ph.back")}</Link>
      </Button>
    </div>
  )
}
