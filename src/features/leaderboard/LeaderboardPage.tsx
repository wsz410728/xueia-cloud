import { useState } from "react"
import { Award, RefreshCw, Trophy } from "lucide-react"
import { useT } from "@/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 排行榜 —— 对齐参考站结构：榜单切换 + 指标切换 + 时段切换 + 榜单条目。
 * 数据占位（批次④接接口）。
 */

type BoardKey = "newapi" | "points" | "community" | "feedback" | "achievement"
type RangeKey = "all" | "today" | "week" | "month"

interface Row {
  rank: number
  name: string
  value: number
  unit: string
}

const PLACEHOLDER_ROWS: Row[] = [
  { rank: 1, name: "moss", value: 1284, unit: "" },
  { rank: 2, name: "xunlua", value: 962, unit: "" },
  { rank: 3, name: "shun", value: 731, unit: "" },
  { rank: 4, name: "deity", value: 508, unit: "" },
  { rank: 5, name: "yanxi", value: 412, unit: "" },
  { rank: 6, name: "linlin", value: 266, unit: "" },
  { rank: 7, name: "zhouyu", value: 189, unit: "" },
  { rank: 8, name: "kite", value: 103, unit: "" },
]

export function LeaderboardPage() {
  const { t } = useT()
  const [board, setBoard] = useState<BoardKey>("newapi")
  const [range, setRange] = useState<RangeKey>("all")

  const boards: Array<{ key: BoardKey; label: string }> = [
    { key: "newapi", label: t("lb.board.newapi") },
    { key: "points", label: t("lb.board.points") },
    { key: "community", label: t("lb.board.community") },
    { key: "feedback", label: t("lb.board.feedback") },
    { key: "achievement", label: t("lb.board.achievement") },
  ]

  const ranges: RangeKey[] = ["all", "today", "week", "month"]

  const unit: Record<BoardKey, string> = {
    newapi: t("lb.unit.times"),
    points: t("lb.unit.points"),
    community: t("lb.unit.times"),
    feedback: t("lb.unit.items"),
    achievement: t("lb.unit.points"),
  }

  /** 指标二级切换（参考站同款：积分榜=余额/累计，社区榜=发帖/点赞/回复） */
  const metrics: Partial<Record<BoardKey, Array<{ key: string; label: string }>>> = {
    points: [
      { key: "balance", label: t("lb.metric.balance") },
      { key: "earned", label: t("lb.metric.earned") },
    ],
    community: [
      { key: "posts", label: t("lb.metric.posts") },
      { key: "likes", label: t("lb.metric.likes") },
      { key: "comments", label: t("lb.metric.comments") },
    ],
  }
  const [metric, setMetric] = useState<string | null>(null)
  const boardMetrics = metrics[board]
  const activeMetric = boardMetrics ? (boardMetrics.some((m) => m.key === metric) ? metric : boardMetrics[0].key) : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("lb.title")}
        subtitle={t("lb.subtitle")}
        toolbar={
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4" />
            {t("common.refresh")}
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {boards.map((b) => (
            <Button key={b.key} size="sm" variant={board === b.key ? "default" : "outline"} onClick={() => setBoard(b.key)}>
              {b.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((r) => (
            <Button key={r} size="sm" variant={range === r ? "secondary" : "ghost"} onClick={() => setRange(r)}>
              {t(`lb.range.${r}`)}
            </Button>
          ))}
          <Badge variant="secondary" className="ml-auto">{t("ph.demo")}</Badge>
        </div>
        {boardMetrics && activeMetric && (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground">{t("lb.metric.label")}</span>
            {boardMetrics.map((m) => (
              <Button key={m.key} size="sm" variant={activeMetric === m.key ? "secondary" : "ghost"} onClick={() => setMetric(m.key)}>
                {m.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {PLACEHOLDER_ROWS.map((row) => (
            <div key={row.rank} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                  row.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {row.rank}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">{row.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{row.name}</span>
              </span>
              <span className="ml-auto text-sm font-medium tabular-nums">
                {row.value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit[board]}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Trophy className="size-3.5" />
        {t("lb.note")}
      </p>
    </div>
  )
}

/** 成就页 —— 对齐参考站：成就卡三态（已解锁 / 进度 / 未解锁） */
interface Ach {
  name: string
  cond: string
  state: "unlocked" | "progress" | "locked"
  progress?: string
}

const PLACEHOLDER_ACH: Ach[] = [
  { name: "初来乍到", cond: "完成注册", state: "unlocked" },
  { name: "名分已定", cond: "设置昵称与头像", state: "unlocked" },
  { name: "数字名片", cond: "开通个人名片", state: "unlocked" },
  { name: "常客", cond: "连续签到 10 天", state: "progress", progress: "7 / 10" },
  { name: "智核接入", cond: "开通 AI 中转站", state: "locked" },
  { name: "内外通达", cond: "开通内网穿透", state: "locked" },
  { name: "一路畅通", cond: "开通代理节点", state: "locked" },
  { name: "开放接口", cond: "开通公开 API", state: "locked" },
]

export function AchievementsPage() {
  const { t } = useT()
  const unlocked = PLACEHOLDER_ACH.filter((a) => a.state === "unlocked").length

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("ach.title")}
        subtitle={t("ach.subtitle")}
        toolbar={<Badge variant="success">{t("ach.unlockedCount", { n: unlocked })}</Badge>}
      />

      {/* 当前称号 + 升级进度（参考站同款信息行） */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground">{t("ach.joinedAt", { date: "2026/10/05" })}</span>
        <span className="text-muted-foreground">·</span>
        <span className="flex items-center gap-2">
          {t("ach.currentTitle")}
          <Badge>{t("ach.defaultTitle")}</Badge>
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{t("ach.nextTitle", { n: 6, name: "常驻居民" })}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_ACH.map((a) => (
          <Card
            key={a.name}
            className={cn("data-fade", a.state === "locked" && "opacity-60")}
          >
            <CardContent className="flex items-start gap-3 py-0">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  a.state === "unlocked" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                )}
              >
                <Award className="size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {a.name}
                  {a.state === "unlocked" && <Badge variant="success">{t("ach.unlocked")}</Badge>}
                  {a.state === "locked" && <Badge variant="secondary">{t("ach.locked")}</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">{a.cond}</p>
                {a.state === "progress" && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[70%] rounded-full bg-primary" />
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">{a.progress}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
