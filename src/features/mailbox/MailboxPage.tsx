import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { MailPlus, PenLine, RefreshCw, Settings2, Trash2 } from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { mailboxApi } from "@/api/mailbox"
import type { MailboxAddress } from "@/api/mailbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { cn, timeAgo } from "@/lib/utils"

const LOCAL_RE = /^[a-z0-9._-]{1,20}$/i

/**
 * 邮箱页 —— 对齐参考站结构：
 * 页头（写邮件/添加邮箱 + 「N / M 个地址」配额）→ 地址卡（地址 + N 封邮件 + 已转发 → 目标 + 设置）
 * → 临时邮箱区（0/1 配额 + 生成/换一个/编辑/刷新 + 说明）→ 收件箱（列表 + 空态）。
 * 临时邮箱与配额上限为占位 mock（批次② Task 3 接 /mailbox/temp，契约见 docs/api.md）。
 */

/** 添加地址对话框（local part 实时预览 + 提交） */
function AddAddressDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useT()
  const qc = useQueryClient()
  const [local, setLocal] = useState("")
  const valid = LOCAL_RE.test(local)

  const add = useMutation({
    mutationFn: () => mailboxApi.addAddress(local),
    onSuccess: () => {
      toast.success(t("mb.addr.added"))
      setLocal("")
      void qc.invalidateQueries({ queryKey: ["mailbox", "addresses"] })
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("mb.addr.add")}</DialogTitle>
          <DialogDescription>{t("mb.addr.addDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="mb-local">{t("mb.addr.local")}</Label>
          <Input
            id="mb-local"
            value={local}
            onChange={(e) => setLocal(e.target.value.trim())}
            placeholder={t("mb.addr.localPh")}
          />
          {local && (
            <p className={cn("text-xs", valid ? "text-success" : "text-destructive")}>
              {valid ? `${local}@${brand.emailDomain}` : t("mb.addr.localInvalid")}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!valid || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 地址设置对话框（转发目标编辑/解绑、删除地址带二次确认） */
function AddressSettingsDialog({
  address,
  onOpenChange,
}: {
  address: MailboxAddress | null
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useT()
  const qc = useQueryClient()
  const [forward, setForward] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (address) {
      setForward(address.forwardTo ?? "")
      setConfirmDelete(false)
    }
  }, [address])

  const saveForward = useMutation({
    mutationFn: (to: string | null) => mailboxApi.updateAddress(address!.id, { forwardTo: to }),
    onSuccess: () => {
      toast.success(t("mb.addr.forwardSaved"))
      void qc.invalidateQueries({ queryKey: ["mailbox", "addresses"] })
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const remove = useMutation({
    mutationFn: () => mailboxApi.deleteAddress(address!.id),
    onSuccess: () => {
      toast.success(t("mb.addr.deleted"))
      void qc.invalidateQueries({ queryKey: ["mailbox", "addresses"] })
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  // 转发验证（send → verify 两步）
  const [verifyCode, setVerifyCode] = useState("")
  const sendVerify = useMutation({
    mutationFn: () => mailboxApi.sendForwardVerify(address!.id, address!.forwardTo as string),
    onSuccess: (d) => toast.success(t("mb.verify.sent", { to: d.sentTo })),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })
  const submitVerify = useMutation({
    mutationFn: () => mailboxApi.verifyForward(address!.id, verifyCode),
    onSuccess: () => {
      toast.success(t("mb.verify.ok"))
      setVerifyCode("")
      void qc.invalidateQueries({ queryKey: ["mailbox", "addresses"] })
      onOpenChange(false)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  return (
    <Dialog open={!!address} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("mb.addr.settings", { addr: address?.address ?? "" })}</DialogTitle>
          <DialogDescription>
            {t("mb.addr.createdAt")}：{address ? new Date(address.createdAt).toLocaleString() : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="mb-forward">{t("mb.addr.forwardLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="mb-forward"
              type="email"
              value={forward}
              onChange={(e) => setForward(e.target.value)}
              placeholder={t("mb.addr.forwardPh")}
            />
            <Button
              size="sm"
              disabled={saveForward.isPending}
              onClick={() => saveForward.mutate(forward.trim() || null)}
            >
              {t("common.save")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("mb.addr.forwardNote")}</p>
        </div>

        {/* 转发验证（真实邮箱验证） */}
        {address?.forwardTo && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            {address.forwardVerified ? (
              <p className="flex items-center gap-2 text-xs">
                <Badge variant="success">{t("mb.verify.verified")}</Badge>
                {t("mb.verify.desc")}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t("mb.addr.forwardUnverified")}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sendVerify.isPending}
                    onClick={() => sendVerify.mutate()}
                  >
                    {t("mb.verify.send")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    aria-label={t("mb.verify.code")}
                    placeholder={t("mb.verify.codePh")}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.trim())}
                  />
                  <Button
                    size="sm"
                    disabled={verifyCode.length !== 6 || submitVerify.isPending}
                    onClick={() => submitVerify.mutate()}
                  >
                    {t("mb.verify.submit")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("mb.verify.note")}</p>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          {!confirmDelete ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
              {t("mb.addr.delete")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">{t("mb.addr.deleteConfirm")}</span>
              <Button variant="destructive" size="sm" disabled={remove.isPending} onClick={() => remove.mutate()}>
                {t("common.confirm")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** 临时邮箱（接 /mailbox/temp：生成/换一个，显示过期时间） */
function TempMailbox() {
  const { t } = useT()
  const qc = useQueryClient()
  const temp = useQuery({ queryKey: ["mailbox", "temp"], queryFn: mailboxApi.getTemp })

  const create = useMutation({
    mutationFn: mailboxApi.createTemp,
    onSuccess: () => {
      toast.success(t("mb.temp.generated"))
      void qc.invalidateQueries({ queryKey: ["mailbox", "temp"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const refresh = useMutation({
    mutationFn: (id: string) => mailboxApi.refreshTemp(id),
    onSuccess: () => {
      toast.success(t("mb.temp.refreshed"))
      void qc.invalidateQueries({ queryKey: ["mailbox", "temp"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{t("mb.temp.title")}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {t("mb.temp.quota", { used: temp.data ? 1 : 0, total: 1 })}
          </p>
        </div>
        {!temp.data ? (
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? t("common.loading") : t("mb.temp.generate")}
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-3 py-1.5 text-sm">{temp.data.address}</code>
            <Button
              variant="outline"
              size="sm"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate(temp.data!.id)}
            >
              <RefreshCw className="size-4" />
              {t("mb.temp.refresh")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("mb.temp.validUntil", {
                time: new Date(temp.data.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              })}
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t("mb.temp.desc")}</p>
      </CardContent>
    </Card>
  )
}

/** 邮件详情 + 回复对话框（getMessage 含正文） */
function MessageDetailDialog({
  mailboxId,
  messageId,
  onOpenChange,
}: {
  mailboxId: string
  messageId: string | null
  onOpenChange: () => void
}) {
  const { t } = useT()
  const [replyText, setReplyText] = useState("")

  const detail = useQuery({
    queryKey: ["mailbox", "message", mailboxId, messageId],
    queryFn: () => mailboxApi.getMessage(mailboxId, messageId as string),
    enabled: !!messageId,
  })

  const reply = useMutation({
    mutationFn: () => mailboxApi.reply(mailboxId, messageId as string, replyText),
    onSuccess: () => {
      toast.success(t("mb.reply.sent"))
      setReplyText("")
      onOpenChange()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  return (
    <Dialog open={!!messageId} onOpenChange={(v) => !v && onOpenChange()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">
            {detail.data?.subject ?? t("mb.noSubject")}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2">
            <span>{detail.data?.from}</span>
            {detail.data && <span>· {new Date(detail.data.receivedAt).toLocaleString()}</span>}
          </DialogDescription>
        </DialogHeader>
        {detail.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <p className="max-h-72 overflow-y-auto text-sm whitespace-pre-wrap text-foreground">
            {detail.data?.body}
          </p>
        )}
        <div className="space-y-2 border-t pt-3">
          <Label htmlFor="mb-reply">{t("mb.reply.label")}</Label>
          <textarea
            id="mb-reply"
            className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder={t("mb.reply.ph")}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <Button size="sm" disabled={!replyText.trim() || reply.isPending} onClick={() => reply.mutate()}>
            {reply.isPending ? t("common.loading") : t("mb.reply.send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MailboxPage() {
  const { t } = useT()
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsFor, setSettingsFor] = useState<MailboxAddress | null>(null)
  const [detailFor, setDetailFor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const markAllRead = useMutation({
    mutationFn: () => mailboxApi.readAll(mailboxId as string),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mailbox"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const batchDelete = useMutation({
    mutationFn: () => mailboxApi.batchDelete(mailboxId as string, [...selected]),
    onSuccess: () => {
      toast.success(t("common.success"))
      setSelected(new Set())
      void qc.invalidateQueries({ queryKey: ["mailbox"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const openDetail = (id: string) => {
    setDetailFor(id)
    // 打开即视为已读
    const m = messages.data?.messages.find((x) => x.id === id)
    if (m && !m.read) {
      void mailboxApi.markRead(mailboxId as string, id).then(() =>
        qc.invalidateQueries({ queryKey: ["mailbox", "messages", mailboxId] })
      )
    }
  }

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
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
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
                  <span>{t("mb.addr.count", { n: a.messageCount })}</span>
                  {a.forwardTo && (
                    <span className="flex items-center gap-1">
                      <Badge variant={a.forwardVerified ? "success" : "secondary"}>
                        {a.forwardVerified ? t("mb.addr.forwarded") : t("mb.addr.forwardUnverified")}
                      </Badge>
                      → {a.forwardTo}
                    </span>
                  )}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("mb.addr.settings", { addr: a.address })}
                onClick={() => setSettingsFor(a)}
              >
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
            <div className="flex items-center gap-2">
              {active && <p className="text-xs text-muted-foreground">{active.address}</p>}
              {selected.size > 0 && (
                <Button variant="destructive" size="sm" disabled={batchDelete.isPending} onClick={() => batchDelete.mutate()}>
                  {t("mb.deleteSelected", { n: selected.size })}
                </Button>
              )}
              {(messages.data?.messages.some((m) => !m.read)) && (
                <Button variant="outline" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
                  {t("mb.markAllRead")}
                </Button>
              )}
            </div>
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
                  <input
                    type="checkbox"
                    aria-label={`${t("common.delete")} ${m.subject ?? ""}`}
                    className="mt-1 accent-[var(--color-primary)]"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSelect(m.id)}
                  />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDetail(m.id)}>
                    <p className="truncate text-sm">{m.subject ?? t("mb.noSubject")}</p>
                    <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{m.excerpt}</p>
                  </button>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{m.from}</span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{timeAgo(m.receivedAt, t)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddAddressDialog open={addOpen} onOpenChange={setAddOpen} />
      <AddressSettingsDialog address={settingsFor} onOpenChange={() => setSettingsFor(null)} />
      {mailboxId && (
        <MessageDetailDialog mailboxId={mailboxId} messageId={detailFor} onOpenChange={() => setDetailFor(null)} />
      )}
    </div>
  )
}
