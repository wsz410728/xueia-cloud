import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Ticket } from "lucide-react"
import { useT } from "@/i18n"
import { donationsApi } from "@/api/donations"
import { ApiError } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

/** 邀请分区（参考站结构）：我的邀请码（创建/复制）+ 奖励记录 + 补填邀请码（7 天内一次） */
export function InviteSection() {
  const { t } = useT()
  const qc = useQueryClient()
  const [claimCode, setClaimCode] = useState("")

  const invites = useQuery({ queryKey: ["my-invites"], queryFn: donationsApi.listInvites })

  const create = useMutation({
    mutationFn: donationsApi.createInvite,
    onSuccess: (d) => {
      toast.success(t("don.invite.created", { code: d.code }))
      void qc.invalidateQueries({ queryKey: ["my-invites"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  const claim = useMutation({
    mutationFn: () => donationsApi.claimCode(claimCode),
    onSuccess: (d) => {
      toast.success(d.rewarded ? t("don.claim.rewarded", { n: d.rewarded ?? 0 }) : t("don.claim.ok"))
      setClaimCode("")
      void qc.invalidateQueries({ queryKey: ["my-invites"] })
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "DON_CLAIM_USED") {
        toast.error(t("don.claim.alreadyUsed"))
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  return (
    <div className="space-y-4">
      {/* 我的邀请码 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Ticket className="size-4" />
              {t("don.invite.codes")}
            </span>
            <Button size="sm" disabled={create.isPending} onClick={() => create.mutate()}>
              <Plus className="size-4" />
              {t("don.invite.create")}
            </Button>
          </CardTitle>
          <CardDescription>{t("don.invite.codesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (invites.data?.codes.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("don.invite.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {invites.data?.codes.map((c) => (
                <li key={c.code} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <code className="text-sm">{c.code}</code>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {c.uses}/{c.max}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copy(c.code)}>
                      {t("common.copy")}
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 补填邀请码 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("don.claim.title")}</CardTitle>
          <CardDescription>{t("don.claim.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="claim-code" className="sr-only">
            {t("don.claim.title")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="claim-code"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              placeholder={t("don.claim.ph")}
            />
            <Button size="sm" disabled={!claimCode.trim() || claim.isPending} onClick={() => claim.mutate()}>
              {t("don.claim.submit")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("don.claim.hint")}</p>
        </CardContent>
      </Card>

      {/* 奖励记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("don.rewards.title")}</CardTitle>
          <CardDescription>{t("don.rewards.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {(invites.data?.rewards.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("don.rewards.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {invites.data?.rewards.map((r) => (
                <li key={r.invited} className="flex items-center justify-between text-sm">
                  <span>
                    {t("don.rewards.invited")} <strong>{r.invited}</strong>
                  </span>
                  <Badge variant="success">{r.daily}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
