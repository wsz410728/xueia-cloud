import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Eye, Globe, Heart, Search } from "lucide-react"
import { useT } from "@/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 创想造物（造物集）——对齐参考站页面结构，作品数据为占位（批次④接 /gallery 接口）。
 * 卡片：缩略图(16:9 占位) + 标题(🌐=网页类) + 简介 + 作者 + 浏览/点赞。
 */

interface Work {
  id: string
  title: string
  desc: string | null
  author: string
  views: number
  likes: number
  web: boolean
  at: string
}

/** 占位作品数据（不进 i18n：属内容而非界面文案） */
const PLACEHOLDER_WORKS: Work[] = [
  { id: "w1", title: "网页版 macOS", desc: "在浏览器里还原一个可交互的 macOS 桌面", author: "deity", views: 19, likes: 1, web: true, at: "2026-10-09" },
  { id: "w2", title: "气死多萝 v2", desc: null, author: "xunlua", views: 11, likes: 1, web: true, at: "2026-10-08" },
  { id: "w3", title: "实时渲染的 3D 地球", desc: "包含精确的 UTC 时间、大陆、经纬度坐标与太阳高度的 3D 地球交互网页", author: "xueia", views: 14, likes: 0, web: true, at: "2026-10-07" },
  { id: "w4", title: "星碎", desc: "一个接入了 AI 的平面躲避弹幕小游戏", author: "xueia", views: 14, likes: 0, web: false, at: "2026-10-06" },
  { id: "w5", title: "AI 谁是卧底", desc: null, author: "moss", views: 17, likes: 1, web: true, at: "2026-10-05" },
  { id: "w6", title: "扫雷", desc: null, author: "moss", views: 8, likes: 1, web: true, at: "2026-10-04" },
  { id: "w7", title: "摸鱼大师", desc: null, author: "shun", views: 12, likes: 1, web: true, at: "2026-10-03" },
  { id: "w8", title: "超级马里奥", desc: "一个很可爱的马里奥小游戏", author: "xueia", views: 19, likes: 1, web: false, at: "2026-10-02" },
]

type SortKey = "latest" | "views" | "likes"

function WorkCard({ work }: { work: Work }) {
  const { t } = useT()
  return (
    <button
      type="button"
      className="group flex flex-col gap-3 rounded-md border bg-card p-3 text-left transition-colors hover:border-ring"
    >
      {/* 缩略图占位（16:9） */}
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
        <Globe className="size-8 opacity-40" />
      </div>
      <div className="space-y-1">
        <p className="flex items-center gap-1 text-sm font-medium">
          {work.web && <span aria-hidden="true">🌐</span>}
          <span className="truncate">{work.title}</span>
        </p>
        <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">
          {work.desc ?? t("gal.noDesc")}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="size-5">
            <AvatarFallback className="text-[10px]">{work.author.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate">{work.author}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="size-3.5" />{work.views}</span>
          <span className="flex items-center gap-1"><Heart className="size-3.5" />{work.likes}</span>
        </span>
      </div>
    </button>
  )
}

export function GalleryPage() {
  const { t } = useT()
  const [params] = useSearchParams()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("latest")

  const view = params.get("view") === "mine" ? "mine" : params.get("view") === "collection" ? "collection" : "all"

  const works = useMemo(() => {
    let list = PLACEHOLDER_WORKS
    if (view === "mine") list = list.filter((w) => w.author === "xueia")
    if (view === "collection") list = list.filter((w) => w.likes > 0)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((w) => w.title.toLowerCase().includes(q) || w.author.toLowerCase().includes(q))
    }
    const sorted = [...list]
    if (sort === "views") sorted.sort((a, b) => b.views - a.views)
    else if (sort === "likes") sorted.sort((a, b) => b.likes - a.likes)
    else sorted.sort((a, b) => b.at.localeCompare(a.at))
    return sorted
  }, [view, query, sort])

  const subnavs: Array<{ key: "all" | "mine" | "collection"; label: string; href: string }> = [
    { key: "all", label: t("gal.sub.all"), href: "/dashboard/gallery" },
    { key: "mine", label: t("gal.sub.mine"), href: "/dashboard/gallery?view=mine" },
    { key: "collection", label: t("gal.sub.collection"), href: "/dashboard/gallery?view=collection" },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("gal.title")}
        subtitle={t("gal.subtitle")}
        toolbar={
          <div className="flex gap-2">
            <Input
              aria-label={t("gal.searchPh")}
              placeholder={t("gal.searchPh")}
              className="w-56"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button size="icon" variant="outline" aria-label={t("gal.search")} onClick={() => setQuery(query)}>
              <Search className="size-4" />
            </Button>
          </div>
        }
        subnav={
          <nav className="flex items-center gap-1 rounded-md bg-muted p-1 text-sm w-fit">
            {subnavs.map((s) => (
              <Link
                key={s.key}
                to={s.href}
                className={cn(
                  "rounded-sm px-3 py-1.5 transition-colors",
                  view === s.key ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        }
      />

      {/* 排序 */}
      <div className="flex items-center gap-2">
        {(["latest", "views", "likes"] as SortKey[]).map((k) => (
          <Button key={k} size="sm" variant={sort === k ? "default" : "outline"} onClick={() => setSort(k)}>
            {t(`gal.sort.${k}`)}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto">{t("ph.demo")}</Badge>
      </div>

      {/* 作品网格 */}
      {works.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t("gal.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">{t("gal.count", { n: works.length })}</p>
    </div>
  )
}
