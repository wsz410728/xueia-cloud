import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Inbox, MailOpen } from "lucide-react"
import { useT } from "@/i18n"
import { mailboxApi } from "@/api/mailbox"
import type { MailMessage, MailboxAddress } from "@/api/mailbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, timeAgo } from "@/lib/utils"

/** 邮箱收件箱（mock 版，加料演示；完整功能属批次 ②） */
export function MailboxPage() {
  const { t } = useT()
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)

  const addresses = useQuery({
    queryKey: ["mailbox", "addresses"],
    queryFn: mailboxApi.listAddresses,
  })

  const active: MailboxAddress | undefined = addresses.data?.addresses[0]
  const mailboxId = activeId ?? active?.id ?? null

  const messages = useQuery({
    queryKey: ["mailbox", "messages", mailboxId],
    queryFn: () => mailboxApi.listMessages(mailboxId as string),
    enabled: !!mailboxId,
  })

  const markRead = useMutation({
    mutationFn: (m: MailMessage) => mailboxApi.markRead(m.mailboxId, m.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mailbox"] }),
  })

  const readAll = useMutation({
    mutationFn: () => mailboxApi.readAll(mailboxId as string),
    onSuccess: () => {
      toast.success(t("common.success"))
      qc.invalidateQueries({ queryKey: ["mailbox"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const unread = messages.data?.messages.filter((m) => !m.read).length ?? 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("mb.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("mb.subtitle")}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
            <MailOpen className="size-4" />
            {t("mb.markAllRead")}
          </Button>
        )}
      </header>

      {/* 地址列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("mb.addr.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {addresses.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            addresses.data?.addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActiveId(a.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  a.id === mailboxId ? "border-primary bg-muted/50" : "hover:bg-muted/50"
                )}
              >
                <span className="font-medium">{a.address}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.forwardTo && <span>→ {a.forwardTo}</span>}
                  {a.forwardVerified ? <Badge variant="success">已验证</Badge> : <Badge variant="secondary">未验证</Badge>}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* 消息列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="size-4" />
            {t("mb.inbox")}
            {unread > 0 && <Badge variant="success">{t("mb.unread", { n: unread })}</Badge>}
          </CardTitle>
          <CardDescription>demo · mock 数据</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (messages.data?.messages.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("mb.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{t("mb.col.subject")}</TableHead>
                  <TableHead>{t("mb.col.from")}</TableHead>
                  <TableHead className="w-28">{t("mb.col.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.data?.messages.map((m) => (
                  <TableRow key={m.id} className={cn(!m.read && "font-medium")} onClick={() => !m.read && markRead.mutate(m)}>
                    <TableCell className="max-w-72">
                      <span className="block truncate">{m.subject ?? t("mb.noSubject")}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">{m.excerpt}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.from}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {timeAgo(m.receivedAt, t)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
