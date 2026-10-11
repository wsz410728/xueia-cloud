import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Ticket } from "lucide-react"
import { useT } from "@/i18n"
import { donationsApi } from "@/api/donations"
import type { DonationTypeKey } from "@/api/donations"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * 兑换码区（参考站结构）：「用别人的码」表单（码 + 模块选择 combobox + 兑换按钮）+ 说明。
 * 自选券必须选模块；普通券自动补缺。未选模块时兑换按钮 disabled（Review Focus #5）。
 */
export function RedeemSection() {
  const { t } = useT()
  const qc = useQueryClient()
  const [code, setCode] = useState("")
  const [moduleKey, setModuleKey] = useState<string>("")

  const redeem = useMutation({
    mutationFn: () =>
      donationsApi.redeem(
        code,
        moduleKey ? (moduleKey as DonationTypeKey) : undefined
      ),
    onSuccess: (r) => {
      toast.success(t("don.redeem.ok", { unlocked: r.unlocked.join(" / ") }))
      setCode("")
      void qc.invalidateQueries({ queryKey: ["donations"] })
      void qc.invalidateQueries({ queryKey: ["ai", "status"] })
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "DON_PICK_MODULE") {
        toast.error(t("don.redeem.pickModule"))
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="size-4" />
          {t("don.redeem.title")}
        </CardTitle>
        <CardDescription>{t("don.redeem.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("don.redeem.ph")}
            aria-label={t("don.redeem.title")}
            className="max-w-64 font-mono"
          />
          {/* 自选券的模块选择（参考站 combobox「自选券：选模块」） */}
          <Select value={moduleKey} onValueChange={setModuleKey}>
            <SelectTrigger aria-label={t("don.redeem.pick")} className="w-44">
              <SelectValue placeholder={t("don.redeem.pick")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">{t("don.type.ai")}</SelectItem>
              <SelectItem value="frp">{t("don.type.frp")}</SelectItem>
              <SelectItem value="proxy">{t("don.type.proxy")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={code.trim().length < 6 || redeem.isPending}
            onClick={() => redeem.mutate()}
          >
            {redeem.isPending ? t("common.loading") : t("don.redeem.submit")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("don.redeem.hint")}</p>
      </CardContent>
    </Card>
  )
}
