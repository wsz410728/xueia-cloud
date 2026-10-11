import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Copy, KeySquare, Plus, Sparkles, Trash2, Wallet } from "lucide-react"
import { useT } from "@/i18n"
import { aiApi } from "@/api/ai"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, timeAgo } from "@/lib/utils"

/** AI 已解锁界面：接入信息（Base URL + Key 管理）/ 免费订阅 / 其他订阅 / 模型列表 */
export function AiUnlocked() {
  const { t } = useT()
  const qc = useQueryClient()
  const status = useQuery({ queryKey: ["ai", "status"], queryFn: aiApi.getStatus })
  const keys = useQuery({ queryKey: ["ai", "keys"], queryFn: aiApi.listKeys })
  const models = useQuery({ queryKey: ["ai", "models"], queryFn: aiApi.listModels })
  const subs = useQuery({ queryKey: ["ai", "subscriptions"], queryFn: aiApi.listSubscriptions })

  const [createOpen, setCreateOpen] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [plainKey, setPlainKey] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => aiApi.createKey(keyName),
    onSuccess: (d) => {
      setPlainKey(d.key)
      setKeyName("")
      void qc.invalidateQueries({ queryKey: ["ai", "keys"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => aiApi.deleteKey(id),
    onSuccess: () => {
      toast.success(t("common.success"))
      void qc.invalidateQueries({ queryKey: ["ai", "keys"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("ai.copied", { label }))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  return (
    <div className="space-y-4">
      {/* 接入信息 + Key 管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ai.access.title")}</CardTitle>
          <CardDescription>{t("ai.access.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("ai.access.baseUrl")}</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                {status.data?.baseUrl}
              </code>
              <Button variant="outline" size="sm" onClick={() => copy(status.data?.baseUrl ?? "", t("ai.access.baseUrl"))}>
                <Copy className="size-4" />
                {t("common.copy")}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label>{t("ai.key.title")}</Label>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                {t("ai.key.new")}
              </Button>
            </div>
            {keys.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (keys.data?.keys.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("ai.key.empty")}</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("ai.key.col.name")}</TableHead>
                      <TableHead>{t("ai.key.col.key")}</TableHead>
                      <TableHead>{t("ai.key.col.group")}</TableHead>
                      <TableHead>{t("ai.key.col.created")}</TableHead>
                      <TableHead className="text-right">{t("common.manage")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.data?.keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell>{k.name}</TableCell>
                        <TableCell>
                          <code className="text-xs">{k.skPrefix}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{k.group}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{timeAgo(k.createdAt, t)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.delete")}
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(k.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("ai.key.hint")}</p>
          </div>
        </CardContent>
      </Card>

      {/* 订阅 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" />
              {t("ai.free.title")}
            </CardTitle>
            <CardDescription>
              {subs.isLoading
                ? t("common.loading")
                : t("ai.free.remaining", { remaining: subs.data?.free?.remaining ?? "-", total: subs.data?.free?.total ?? "-" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {subs.data?.free && (
              <p className="text-xs text-muted-foreground">
                {t("ai.nextReset")}：{new Date(subs.data.free.nextResetAt).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t("ai.free.rules")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {t("ai.rewards.title")}
            </CardTitle>
            <CardDescription>{t("ai.rewards.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {(subs.data?.rewards.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("ai.rewards.empty")}</p>
            ) : (
              <ul className="space-y-2">
                {subs.data?.rewards.map((r) => (
                  <li key={r.title} className="flex items-center justify-between text-sm">
                    <span>{r.title}</span>
                    <span className="tabular-nums text-muted-foreground">{r.remaining}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 模型列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("ai.models.title", { n: models.data?.models.length ?? 0 })}</CardTitle>
          <CardDescription>{t("ai.rec.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {models.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {(models.data?.recommended ?? []).map((name, i) => (
                  <Button
                    key={name}
                    variant={i === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => copy(name, name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {models.data?.models.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => copy(m.name, m.name)}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-ring"
                    )}
                  >
                    <span className="truncate">{m.name}</span>
                    {m.tag && <Badge variant="secondary">{m.tag}</Badge>}
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 新建 Key：明文只显示一次 */}
      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(false)
          if (!v) {
            setPlainKey(null)
            setKeyName("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{plainKey ? t("ai.key.onceTitle") : t("ai.key.new")}</DialogTitle>
            <DialogDescription>{plainKey ? t("ai.key.onceDesc") : t("ai.key.newDesc")}</DialogDescription>
          </DialogHeader>
          {plainKey ? (
            <>
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                <code className="min-w-0 flex-1 truncate text-xs">{plainKey}</code>
                <Button variant="outline" size="sm" onClick={() => copy(plainKey, t("ai.key.col.key"))}>
                  <Copy className="size-4" />
                  {t("common.copy")}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setPlainKey(null); setCreateOpen(false) }}>
                  {t("ai.key.savedIt")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-key-name">{t("ai.key.col.name")}</Label>
                <Input
                  id="ai-key-name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder={t("ai.key.namePh")}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button disabled={!keyName.trim() || create.isPending} onClick={() => create.mutate()}>
                  <KeySquare className="size-4" />
                  {t("ai.key.create")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
