import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { MailPlus, PenLine, RefreshCw, Settings2 } from "lucide-react"
import { useT } from "@/i18n"
import { mailboxApi } from "@/api/mailbox"
import type { MailboxAddress } from "@/api/mailbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { cn, timeAgo } from "@/lib/utils"

/**
 * 邮箱页 —— 对齐参考站结构：
 * 页头（写邮件/添加邮箱 + 「N / M 个地址」配额）→ 地址卡（地址 + N 封邮件 + 已转发 → 目标 + 设置）
 * → 临时邮箱区（0/1 配额 + 生成/换一个/编辑/刷新 + 说明）→ 收件箱（列表 + 空态）。
 * 临时邮箱与配额为占位 mock（批次②接 /mailbox/temp 等接口，契约见 docs/api.md）。
 */

/** 临时邮箱占位状态 */
function TempMailbox() {
  const { t } = useT()
  const [temp, setTemp] = useState<string | null>(null)

  function onGenerate() {
    // 占位：批次②接 POST /mailbox/temp
    setTemp(`temp-${Math.random().toString(36).slice(2, 8)}@temp.xueia.com`)
    toast.success(t("mb.temp.generated"))
  }
  function onRefresh() {
    setTemp(`temp-${Math.random().toString(36).slice(2, 8)}@temp.xueia.com`)
    toast.success(t("mb.temp.refreshed"))
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("mb.temp.title")}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{t("mb.temp.quota", { used: temp ? 1 : 0, total: 1 })}</p>
        </div>
        {!temp ? (
          <Button onClick={onGenerate}>{t("mb.temp.generate")}</Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-3 py-1.5 text-sm">{temp}</code>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="size-4" />
              {t("mb.temp.refresh")}
            </Button>
            <Button variant="ghost" size="sm">
              <PenLine className="size-4" />
              {t("common.edit")}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("mb.temp.desc")}</p>
      </CardContent>
    </Card>
  )
}

export function MailboxPage() {
  const { t } = useT()
  const [activeId, setActiveId] = useState<string | null>(null)

  const addresses = useQuery({
    queryKey: ["mailbox", "addresses"],
    queryFn: mailboxApi.listAddresses,
  })

  const list: MailboxAddress[] = addresses.data?.addresses ?? []
  const active = list.find((a) => a.id === activeId) ?? list[0]
  const mailboxId = active?.id ?? null

  const messages = useQuery({
    queryKey: ["mailbox", "messages", mailboxId],
    queryFn: () => mailboxApi.listMessages(mailboxId as string),
    enabled: !!mailboxId,
  })

  /** 占位：每地址邮件数（真实接口批次②在地址列表里返回 counts） */
  const counts = useMemo(() => {
    const data = messages.data?.messages ?? []
    const map = new Map<string, number>()
    if (active) map.set(active.id, data.length)
    return map
  }, [messages.data, active])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("mb.title")}
        subtitle={t("mb.addr.quota", { used: list.length, total: 3 })}
        toolbar={
          <>
            <Button size="sm">
              <PenLine className="size-4" />
              {t("mb.compose")}
            </Button>
            <Button variant="outline" size="sm">
              <MailPlus className="size-4" />
              {t("mb.addr.add")}
            </Button>
          </>
        }
      />

      {/* 地址卡列表 */}
      {addresses.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-md border bg-card px-4 py-3 transition-colors",
                a.id === mailboxId ? "border-ring" : ""
              )}
            >
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setActiveId(a.id)}>
                <p className="truncate text-sm font-medium">{a.address}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("mb.addr.count", { n: counts.get(a.id) ?? 0 })}</span>
                  {a.forwardTo && (
                    <span className="flex items-center gap-1">
                      <Badge variant="success">{t("mb.addr.forwarded")}</Badge>
                      → {a.forwardTo}
                    </span>
                  )}
                </p>
              </button>
              <Button variant="ghost" size="icon" aria-label={t("mb.addr.settings", { addr: a.address })}>
                <Settings2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 临时邮箱 */}
      <TempMailbox />

      {/* 收件箱 */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{t("mb.inbox")}</p>
            {active && <p className="text-xs text-muted-foreground">{active.address}</p>}
          </div>
          {messages.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (messages.data?.messages.length ?? 0) === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">{t("mb.emptyShort")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("mb.emptyHint", { addr: active?.address ?? "" })}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {messages.data?.messages.map((m) => (
                <li key={m.id} className={cn("flex items-start gap-3 py-3", !m.read && "font-medium")}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{m.subject ?? t("mb.noSubject")}</p>
                    <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{m.excerpt}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{m.from}</span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{timeAgo(m.receivedAt, t)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
