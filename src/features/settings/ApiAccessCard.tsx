import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Copy, KeySquare, RefreshCw, Trash2 } from "lucide-react"
import { useT } from "@/i18n"
import { apiAccessApi } from "@/api/access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SettingCard } from "./SettingsPage"

/**
 * 公开 API 卡（参考站结构）：Key 生成/重置/删除 + 我的层级 + 功能额度表。
 * 明文 Key 只显示一次（醒目提示）。
 */
export function ApiAccessCard() {
  const { t } = useT()
  const qc = useQueryClient()

  const status = useQuery({ queryKey: ["api-key", "status"], queryFn: apiAccessApi.status })

  const generate = useMutation({
    mutationFn: apiAccessApi.generateKey,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["api-key"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })
  const reset = useMutation({
    mutationFn: apiAccessApi.resetKey,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["api-key"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })
  const remove = useMutation({
    mutationFn: apiAccessApi.deleteKey,
    onSuccess: () => {
      toast.success(t("apiset.deleted"))
      void qc.invalidateQueries({ queryKey: ["api-key"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const plainKey = generate.data?.key ?? reset.data?.key ?? null

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  return (
    <SettingCard title={t("apiset.title")} desc={t("apiset.desc")}>
      <div className="space-y-4">
        {status.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            {plainKey ? (
              <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">{t("apiset.keyOnce")}</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">{plainKey}</code>
                  <Button variant="outline" size="sm" onClick={() => copy(plainKey)}>
                    <Copy className="size-4" />
                    {t("common.copy")}
                  </Button>
                </div>
              </div>
            ) : status.data?.hasKey ? (
              <p className="text-sm text-muted-foreground">
                {t("apiset.hasKey")} <code className="rounded bg-muted px-1.5 py-0.5 text-xs">sk-xueia-••••••••</code>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("apiset.noKey")}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {!status.data?.hasKey ? (
                <Button size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
                  <KeySquare className="size-4" />
                  {t("apiset.generate")}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" disabled={reset.isPending} onClick={() => reset.mutate()}>
                    <RefreshCw className="size-4" />
                    {t("apiset.reset")}
                  </Button>
                  <Button variant="destructive" size="sm" disabled={remove.isPending} onClick={() => remove.mutate()}>
                    <Trash2 className="size-4" />
                    {t("common.delete")}
                  </Button>
                </>
              )}
              <Badge variant="secondary" className="ml-auto">
                {t("apiset.tierValue", { tier: status.data?.tier ?? 0, points: status.data?.achievementPoints ?? 0 })}
              </Badge>
            </div>

            {/* 功能额度表 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("apiset.colFeature")}</TableHead>
                    <TableHead>{t("apiset.colStatus")}</TableHead>
                    <TableHead className="text-right">{t("apiset.colLimit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(status.data?.features ?? []).map((f) => (
                    <TableRow key={f.name}>
                      <TableCell>{f.name}</TableCell>
                      <TableCell>
                        {f.open ? (
                          <Badge variant="success">{t("apiset.open")}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("apiset.closed")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {t("apiset.limitPerDay", { n: f.limitPerDay })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">{t("apiset.tierHint")}</p>
          </>
        )}
      </div>
    </SettingCard>
  )
}
