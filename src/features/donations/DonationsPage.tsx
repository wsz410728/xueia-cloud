import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Link } from "react-router"
import { useT } from "@/i18n"
import { donationsApi } from "@/api/donations"
import type { DonationRecord, DonationType, DonationTypeKey } from "@/api/donations"
import { ApiError } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 捐献与邀请 —— 对齐参考站实测结构：
 * 页内子导航（概览/邀请 + 捐赠资源分组：AI 模型/内网穿透/代理节点）
 * + 概览面板（资源有限 + 首次捐献送自选权限券）
 * + 资源卡（名称+未解锁徽章+描述+贡献按钮 → 类型化对话框）
 * + 我的捐献记录（状态徽章）。
 * 邀请分区（Task 5）与兑换码区（Task 6）挂入对应子导航。
 */
export function DonationsPage() {
  const { t } = useT()
  const qc = useQueryClient()
  const [section, setSection] = useState<"overview" | "invite">("overview")
  const [resType, setResType] = useState<DonationTypeKey | null>(null)

  const donations = useQuery({ queryKey: ["donations"], queryFn: donationsApi.list })

  const cancel = useMutation({
    mutationFn: (id: string) => donationsApi.cancel(id),
    onSuccess: () => {
      toast.success(t("common.success"))
      void qc.invalidateQueries({ queryKey: ["donations"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const statusBadge = (s: DonationRecord["status"]) =>
    s === "pending" ? (
      <Badge variant="secondary">{t("don.status.pending")}</Badge>
    ) : s === "approved" ? (
      <Badge variant="success">{t("don.status.approved")}</Badge>
    ) : s === "rejected" ? (
      <Badge variant="destructive">{t("don.status.rejected")}</Badge>
    ) : (
      <Badge variant="outline">{t("don.status.expired")}</Badge>
    )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader title={t("don.title")} subtitle={t("don.subtitle")} />

      {/* 页内子导航（参考站同款） */}
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/dashboard" className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground">
          {t("don.backToConsole")}
        </Link>
        <Button size="sm" variant={section === "overview" ? "default" : "ghost"} onClick={() => setSection("overview")}>
          {t("don.nav.overview")}
        </Button>
        <Button size="sm" variant={section === "invite" ? "default" : "ghost"} onClick={() => setSection("invite")}>
          {t("don.nav.invite")}
        </Button>
      </nav>

      {section === "overview" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("don.intro.title")}</CardTitle>
              <CardDescription>{t("don.intro.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                {t("don.firstGift")}
              </p>
            </CardContent>
          </Card>

          {/* 资源卡 */}
          {donations.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {donations.data?.types.map((ty: DonationType) => (
                <Card key={ty.key} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{ty.label}</span>
                      {ty.unlocked ? (
                        <Badge variant="success">{t("don.unlocked")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("don.locked")}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{ty.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button
                      size="sm"
                      variant={ty.unlocked ? "secondary" : "default"}
                      disabled={ty.unlocked}
                      onClick={() => setResType(ty.key)}
                    >
                      {ty.unlocked ? t("don.alreadyUnlocked") : t("don.contribute")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 我的捐献记录 */}
          {(donations.data?.records.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("don.records.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {donations.data?.records.map((rec) => (
                  <div key={rec.id} className="flex flex-wrap items-center gap-2 border-b pb-3 text-sm last:border-0 last:pb-0">
                    {statusBadge(rec.status)}
                    <Badge variant="outline">{rec.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rec.submittedAt).toLocaleString()}
                    </span>
                    {rec.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(rec.id)}
                      >
                        {t("don.records.cancel")}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {/* Task 5 挂邀请分区 */}
            {t("ph.desc")}
          </CardContent>
        </Card>
      )}

      {/* 贡献对话框（按类型出表单） */}
      <ContributeDialog
        type={resType}
        onOpenChange={() => setResType(null)}
        onSuccess={() => {
          setResType(null)
          void qc.invalidateQueries({ queryKey: ["donations"] })
        }}
      />
    </div>
  )
}

/** 类型化贡献表单：ai=Base URL+Key；frp=config 文本；proxy=订阅链接 */
function ContributeDialog({
  type,
  onOpenChange,
  onSuccess,
}: {
  type: DonationTypeKey | null
  onOpenChange: () => void
  onSuccess: () => void
}) {
  const { t } = useT()
  const [link, setLink] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [key, setKey] = useState("")
  const [config, setConfig] = useState("")

  const submit = useMutation({
    mutationFn: () => donationsApi.submit(type as DonationTypeKey, { link, baseUrl, key, config }),
    onSuccess: () => {
      toast.success(t("don.submitted"))
      onSuccess()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "DON_FORMAT_INVALID") {
        toast.error(e.message)
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  if (!type) return null

  return (
    <Dialog open onOpenChange={() => onOpenChange()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("don.contributeTitle", { label: t(`don.type.${type}`) })}</DialogTitle>
          <DialogDescription>{t("don.contributeDesc")}</DialogDescription>
        </DialogHeader>

        {type === "proxy" && (
          <div className="space-y-2">
            <Label htmlFor="don-link">{t("don.proxy.link")}</Label>
            <Input
              id="don-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t("don.proxy.linkPh")}
            />
          </div>
        )}
        {type === "ai" && (
          <div className="space-y-2">
            <Label htmlFor="don-baseurl">{t("don.ai.baseUrl")}</Label>
            <Input
              id="don-baseurl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
            <Label htmlFor="don-key">{t("don.ai.key")}</Label>
            <Input id="don-key" value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
        )}
        {type === "frp" && (
          <div className="space-y-2">
            <Label htmlFor="don-config">{t("don.frp.config")}</Label>
            <textarea
              id="don-config"
              className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder={t("don.frp.configPh")}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange()}>
            {t("common.cancel")}
          </Button>
          <Button disabled={submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? t("common.loading") : t("don.submitBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
