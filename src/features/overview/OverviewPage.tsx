import { Link } from "react-router"
import { ArrowRight, Bot, Coins, Inbox, Mail, Newspaper, Package, Zap } from "lucide-react"
import { useT } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/features/dashboard-shell/use-me"
import { timeAgo } from "@/lib/utils"

/** 欢迎标题逐字渐入（对齐参考站的字符级动画） */
function WelcomeTitle({ text }: { text: string }) {
  return (
    <h1 className="text-2xl font-bold" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="data-fade inline-block"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          {ch}
        </span>
      ))}
    </h1>
  )
}

/** 概览页（静态 mock 数据；拖拽布局属批次 ②） */
export function OverviewPage() {
  const { t } = useT()
  const { data: user, isLoading } = useMe()

  const stats = [
    { icon: Mail, label: t("dash.stat.email"), value: "2" },
    { icon: Inbox, label: t("dash.stat.unread"), value: "3" },
    { icon: Coins, label: t("dash.stat.points"), value: "128" },
    { icon: Bot, label: t("dash.stat.ai"), value: "¥1000" },
  ]

  const quickActions = [
    { icon: Mail, label: t("dash.quick.mail"), to: "/dashboard/email" },
    { icon: Package, label: t("dash.quick.share"), to: "/dashboard/tempbox" },
    { icon: Zap, label: t("dash.quick.topup"), to: "/dashboard/ai" },
  ]

  const news = [
    { id: "n1", title: t("landing.upd1"), date: "2026-10-07T10:00:00Z", pinned: true },
    { id: "n2", title: t("landing.upd2"), date: "2026-10-06T10:00:00Z", pinned: false },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <WelcomeTitle text={t("dash.welcome", { name: user?.nickname ?? user?.username ?? "" })} />
        )}
        <p className="mt-1 text-sm text-muted-foreground">{t("dash.subtitle")}</p>
      </header>

      {/* 统计卡 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }, i) => (
          <Card key={label} className="data-fade" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="flex items-center gap-3 py-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold tabular-nums">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 最近邮件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.mail.card")}</CardTitle>
            <CardDescription>{t("dash.mail.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <Badge variant="success">{t("dash.mail.unread", { n: 3 })}</Badge>
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dashboard/email">
                {t("dash.mail.viewAll")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.quick.title")}</CardTitle>
            <CardDescription>{t("dash.quick.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map(({ icon: Icon, label, to }) => (
              <Button key={to} asChild variant="outline" size="sm" className="justify-start">
                <Link to={to}>
                  <Icon className="size-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* 网站动态 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.news.card")}</CardTitle>
            <CardDescription>{t("dash.news.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.map((n) => (
              <div key={n.id} className="flex items-start gap-2 text-sm">
                <Newspaper className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5">
                    {n.pinned && <Badge variant="secondary">置顶</Badge>}
                    <span className="truncate">{n.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(n.date, t)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
