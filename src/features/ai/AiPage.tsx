import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Bot, Lock } from "lucide-react"
import { useT } from "@/i18n"
import { aiApi } from "@/api/ai"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"

/**
 * AI 中转站页 —— 对齐参考站实测结构：
 * 逐字标题 + 副标题位（功能未开放/额度信息）+ 内容区。
 * 锁定态（本任务）：未授权说明 + 「如何解锁」+ 前往捐献 + 功能标识；
 * 解锁态界面（接入信息/Key/模型/订阅）在 Task 3 补入。
 */
export function AiPage() {
  const { t } = useT()
  const status = useQuery({ queryKey: ["ai", "status"], queryFn: aiApi.getStatus })

  const locked = status.data && !status.data.unlocked

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title={t("ai.title")}
        subtitle={status.isLoading ? t("common.loading") : locked ? t("ai.notOpen") : t("ai.tagline")}
      />

      {status.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : locked ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Lock className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="flex items-center justify-center gap-2 text-sm font-medium">
                <Bot className="size-4" />
                {t("ai.lockedTitle")}
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">{t("ai.lockedDesc")}</p>
            </div>

            <div className="mt-2 w-full max-w-md space-y-2 rounded-md border bg-muted/40 p-3 text-left">
              <p className="text-xs font-medium">{t("ai.howToUnlock")}</p>
              <p className="text-xs text-muted-foreground">{t("ai.howToUnlockDesc")}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm">
                <Link to="/dashboard/donations">{t("ai.goDonate")}</Link>
              </Button>
              {status.data?.configured === false && (
                <span className="text-xs text-muted-foreground">{t("ai.notConfiguredDesc")}</span>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("ai.featureId")}：<code className="rounded bg-muted px-1.5 py-0.5">ai</code>
            </p>
            <Badge variant="secondary">{t("ph.demo")}</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {/* Task 3 在此渲染解锁态界面（接入信息/Key/模型/订阅） */}
            {t("common.loading")}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
