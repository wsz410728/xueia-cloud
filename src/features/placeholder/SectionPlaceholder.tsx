import { Construction } from "lucide-react"
import { useT } from "@/i18n"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 模块占位骨架（对齐参考站内容页：
 * 逐字标题 + 副标题 + 示例数据徽章 + 内容区占位）。
 * 各批次实现时用真实页面替换；接口契约见 docs/api.md。
 */
export function SectionPlaceholder({
  titleKey,
  subtitleKey,
  batch,
}: {
  titleKey: string
  subtitleKey: string
  /** 计划实现的批次号，显示在占位卡上，便于对照批次地图 */
  batch: string
}) {
  const { t } = useT()
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t(titleKey)}
        subtitle={t(subtitleKey)}
        toolbar={<Badge variant="secondary">{t("ph.demo")}</Badge>}
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Construction className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("ph.desc")}</p>
          <Badge variant="outline">
            {t("ph.batch")} {batch}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
