import { useState, type ReactNode } from "react"
import { useT } from "@/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileCard } from "./ProfileCard"
import { TwoFactorCard } from "./TwoFactorCard"
import { GeneralCard } from "./GeneralCard"
import { NotifyCard, SecurityCard } from "./NotifyCard"
import { DangerCard } from "./DangerCard"
import { ApiAccessCard } from "./ApiAccessCard"

/**
 * 账户设置页 —— 对齐参考站结构：
 * 逐字标题 + 副标题 + 七个分类筛选（全部/账户/通用/安全/通知/API/危险区）+ 卡片列表。
 * 各卡片内容由后续任务填充（Task 5 资料、Task 6 2FA、Task 7 偏好/安全/危险区/API）。
 */

export type SettingsCategory = "account" | "general" | "security" | "notify" | "api" | "danger"

/** 设置卡容器：统一标题/描述/分类归属 */
export function SettingCard({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

/** 卡片声明：category 决定分类筛选归属 */
export interface SettingsCardDef {
  id: string
  category: SettingsCategory
  node: ReactNode
}

export function SettingsPage() {
  const { t } = useT()
  const [cat, setCat] = useState<"all" | SettingsCategory>("all")

  const categories: Array<{ key: "all" | SettingsCategory; labelKey: string }> = [
    { key: "all", labelKey: "settings.cat.all" },
    { key: "account", labelKey: "settings.cat.account" },
    { key: "general", labelKey: "settings.cat.general" },
    { key: "security", labelKey: "settings.cat.security" },
    { key: "notify", labelKey: "settings.cat.notify" },
    { key: "api", labelKey: "settings.cat.api" },
    { key: "danger", labelKey: "settings.cat.danger" },
  ]

  // Task 5/6/7 会把各自的卡片挂进来（此数组是唯一挂载点）
  const cards: SettingsCardDef[] = [
    {
      id: "profile",
      category: "account",
      node: <ProfileCard />,
    },
    {
      id: "twofa",
      category: "account",
      node: <TwoFactorCard />,
    },
    {
      id: "motion",
      category: "general",
      node: <GeneralCard />,
    },
    {
      id: "notify",
      category: "notify",
      node: <NotifyCard />,
    },
    {
      id: "security",
      category: "security",
      node: <SecurityCard />,
    },
    {
      id: "api",
      category: "api",
      node: <ApiAccessCard />,
    },
    {
      id: "danger-delete",
      category: "danger",
      node: <DangerCard />,
    },
  ]

  const visible = cat === "all" ? cards : cards.filter((c) => c.category === cat)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* 分类筛选（参考站同款按钮行） */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.key}
            size="sm"
            variant={cat === c.key ? "default" : "outline"}
            onClick={() => setCat(c.key)}
          >
            {t(c.labelKey)}
          </Button>
        ))}
      </div>

      <div className={cn("space-y-4")}>
        {visible.map((c) => (
          <div key={c.id} data-card={c.id}>
            {c.node}
          </div>
        ))}
      </div>
    </div>
  )
}
