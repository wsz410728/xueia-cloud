import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** 逐字渐入标题（参考站所有内容页的 h1 都是字符级动画） */
export function TitleChars({ text, className }: { text: string; className?: string }) {
  return (
    <h1 className={cn("text-2xl font-bold", className)} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden="true" className="data-fade inline-block" style={{ animationDelay: `${i * 40}ms` }}>
          {ch}
        </span>
      ))}
    </h1>
  )
}

/**
 * 内容页页头脚手架（对齐参考站结构）：
 * 逐字标题 + 副标题 + 可选工具栏/子导航，下方为内容区。
 */
export function PageHeader({
  title,
  subtitle,
  toolbar,
  subnav,
  className,
}: {
  title: string
  subtitle?: string
  toolbar?: ReactNode
  subnav?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TitleChars text={title} />
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>
      {subnav}
    </div>
  )
}
