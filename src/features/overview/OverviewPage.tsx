import { Link } from "react-router"
import { Activity, ArrowRight, Bot, Coins, IdCard, Inbox, Mail, Newspaper, Package, SlidersHorizontal, Zap } from "lucide-react"
import { useT } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/ui/page-header"
import { useMe } from "@/features/dashboard-shell/use-me"
import { timeAgo } from "@/lib/utils"

/**
 * 概览页 —— 对齐参考站结构：
 * 逐字欢迎标题 + 编辑布局按钮 → 4 张统计卡（可点进对应模块）→ 卡片区
 * （最近邮件 / 最近活动 / AI 中转站 / 个人名片 / 网站动态 / 快捷操作）。
 * 拖拽布局与真实统计属批次②，当前为占位数据。
 */
export function OverviewPage() {
  const { t } = useT()
  const { data: user, isLoading } = useMe()

  const stats = [
    { icon: Mail, label: t("dash.stat.email"), value: "2", to: "/dashboard/email" },
    { icon: Inbox, label: t("dash.stat.unread"), value: "3", to: "/dashboard/email" },
    { icon: Coins, label: t("dash.stat.points"), value: "128", to: "/dashboard/points" },
    { icon: Bot, label: t("dash.stat.ai"), value: "¥1000", to: "/dashboard/ai" },
  ]

  const quickActions = [
    { icon: Mail, label: t("dash.quick.mail"), to: "/dashboard/email" },
    { icon: Package, label: t("dash.quick.share"), to: "/dashboard/tempbox" },
    { icon: Zap, label: t("dash.quick.topup"), to: "/dashboard/ai" },
  ]

  /** 最近活动（操作审计流；参考站同款卡片） */
  const activities = [
    { icon: Inbox, label: t("dash.act.emailVerify"), detail: "yanxi@xueia.com", at: "2026-10-05T09:12:00Z" },
    { icon: Mail, label: t("dash.act.emailReceive"), detail: "noreply@github.com", at: "2026-10-05T08:40:00Z" },
    { icon: IdCard, label: t("dash.act.register"), detail: "jooyang", at: "2026-10-05T08:00:00Z" },
  ]

  const news = [
    { id: "n1", cat: t("dash.cat.general"), title: t("landing.upd1"), date: "2026-10-07T10:00:00Z", pinned: true },
    { id: "n2", cat: t("dash.cat.ai"), title: t("landing.upd2"), date: "2026-10-06T10:00:00Z", pinned: false },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={isLoading ? "…" : t("dash.welcome", { name: user?.nickname ?? user?.username ?? "" })}
        subtitle={user?.email}
        toolbar={
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="size-4" />
            {t("dash.layout.edit")}
          </Button>
        }
      />
      {isLoading && <Skeleton className="h-8 w-64" />}

      {/* 统计卡（可点击进入对应模块） */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, to }, i) => (
          <Link key={label} to={to} className="data-fade" style={{ animationDelay: `${i * 40}ms` }}>
            <Card className="transition-colors hover:border-ring">
              <CardContent className="flex items-center gap-3 py-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
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
            <p><Badge variant="success">{t("dash.mail.unread", { n: 3 })}</Badge></p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dashboard/email">
                {t("dash.mail.viewAll")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 最近活动（审计流） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              {t("dash.activity.card")}
            </CardTitle>
            <CardDescription>{t("dash.activity.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{a.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.at, t)}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* AI 中转站 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.ai.card")}</CardTitle>
            <CardDescription>{t("dash.ai.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("dash.ai.notBound")}</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dashboard/ai">
                {t("common.goToOpen")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 个人名片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.profile.card")}</CardTitle>
            <CardDescription>{t("dash.profile.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar className={user?.role === "super" ? "role-ring role-ring-super" : user?.role === "admin" ? "role-ring role-ring-admin" : ""}>
              <AvatarFallback>{(user?.nickname ?? user?.username ?? "?").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.nickname ?? t("dash.profile.noNickname")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("dash.profile.noBio")}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/u/${user?.username ?? ""}`}>{t("common.view")}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* 网站动态（带分类徽章 + 置顶） */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="size-4" />
              {t("dash.news.card")}
            </CardTitle>
            <CardDescription>{t("dash.news.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {news.map((n) => (
              <div key={n.id} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {n.pinned && <Badge variant="secondary">{t("dash.news.pinned")}</Badge>}
                  <Badge variant="outline">{n.cat}</Badge>
                  <span>{new Date(n.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{n.title}</p>
              </div>
            ))}
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
      </div>

      <p className="text-center text-xs text-muted-foreground">{t("ph.demo")} · {t("dash.subtitle")}</p>
    </div>
  )
}
