import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Coins, History, RefreshCw, Send, ShoppingBag, Ticket } from "lucide-react"
import { useT } from "@/i18n"
import { pointsApi } from "@/api/points"
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
 * 积分与商城 —— 对齐参考站结构：余额卡（签到/补签/转账/订单/明细）+ 兑换卡 + 商品网格。
 * Task 7：余额/签到（幂等）/补签/兑换（不可透支）/转账/明细 全接真实接口。
 * Task 8：商品网格与订单接真实接口（当前为占位商品）。
 */
export function PointsPage() {
  const { t } = useT()
  const qc = useQueryClient()
  const [transferOpen, setTransferOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState("")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")

  const status = useQuery({ queryKey: ["points", "status"], queryFn: pointsApi.status })
  const balance = status.data?.balance ?? 0

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["points"] })
  }

  const checkin = useMutation({
    mutationFn: pointsApi.checkin,
    onSuccess: (r) => {
      toast.success(t("pt.checkin.ok", { n: r.reward }))
      invalidate()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "POINTS_ALREADY_CHECKED_IN") {
        toast.error(t("pt.checkin.already"))
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  const makeup = useMutation({
    mutationFn: pointsApi.makeup,
    onSuccess: (r) => {
      toast.success(t("pt.makeup.ok", { n: r.reward }))
      invalidate()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const redeem = useMutation({
    mutationFn: () => pointsApi.redeem(Number(redeemAmount)),
    onSuccess: (r) => {
      toast.success(t("pt.redeemOk", { balance: r.balance }))
      setRedeemAmount("")
      invalidate()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "POINTS_INSUFFICIENT") {
        toast.error(t("pt.notEnough"))
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  const transfer = useMutation({
    mutationFn: () => pointsApi.transfer(to, Number(amount)),
    onSuccess: (r) => {
      toast.success(t("pt.transferOk", { balance: r.balance }))
      setTransferOpen(false)
      setTo("")
      setAmount("")
      invalidate()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "POINTS_INSUFFICIENT") {
        toast.error(t("pt.notEnough"))
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    },
  })

  const redeemNum = Number(redeemAmount)
  const redeemInvalid = !Number.isInteger(redeemNum) || redeemNum <= 0 || redeemNum > balance

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("pt.title")}
        subtitle={t("pt.subtitle")}
        toolbar={
          <>
            <Button variant="outline" size="sm" onClick={invalidate} disabled={status.isFetching}>
              <RefreshCw className="size-4" />
              {t("common.refresh")}
            </Button>
            {status.data?.todayCheckedIn ? (
              <Button size="sm" variant="secondary" disabled>
                {t("pt.checkin.done")}
              </Button>
            ) : (
              <Button size="sm" disabled={checkin.isPending} onClick={() => checkin.mutate()}>
                {checkin.isPending ? t("common.loading") : t("pt.checkin")}
              </Button>
            )}
            {(status.data?.makeupCards ?? 0) > 0 && (
              <Button variant="outline" size="sm" disabled={makeup.isPending} onClick={() => makeup.mutate()}>
                {t("pt.makeup")}
              </Button>
            )}
          </>
        }
      />

      {/* 余额与操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pt.mine")}</CardTitle>
          <CardDescription>
            {t("pt.rate")}
            {status.data?.todayCheckedIn ? ` · ${t("pt.checkin.doneHint")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          {status.isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="flex items-center gap-2 text-2xl font-bold tabular-nums">
              <Coins className="size-6 text-success" />
              {balance}
              <span className="text-sm font-normal text-muted-foreground">{t("pt.unit")}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
              <Send className="size-4" />
              {t("pt.transfer")}
            </Button>
            <Button variant="outline" size="sm" disabled>
              <ShoppingBag className="size-4" />
              {t("pt.orders")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="size-4" />
              {t("pt.detail")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 兑换卡（1 积分 = ¥1，金额自填，不可透支） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="size-4" />
            {t("pt.redeemBalance")}
          </CardTitle>
          <CardDescription>{t("pt.redeemCardDesc", { v: "1" })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              inputMode="numeric"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={t("pt.redeemAmountPh")}
              aria-label={t("pt.redeemBalance")}
              className="max-w-40"
            />
            <Button size="sm" disabled={redeemInvalid || redeem.isPending} onClick={() => redeem.mutate()}>
              {redeem.isPending ? t("common.loading") : t("pt.redeemNow")}
            </Button>
            {redeemNum > balance && <span className="text-xs text-destructive">{t("pt.notEnough")}</span>}
          </div>
        </CardContent>
      </Card>

      {/* 商品网格（Task 8 接真实接口） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pt.shop")}</CardTitle>
          <CardDescription>
            <Badge variant="secondary">{t("ph.demo")}</Badge> {t("pt.shopPending")}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 转账对话框 */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("pt.transfer")}</DialogTitle>
            <DialogDescription>{t("pt.transferDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pt-to">{t("pt.transferTo")}</Label>
            <Input id="pt-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("pt.transferToPh")} />
            <Label htmlFor="pt-amount">{t("pt.transferAmount")}</Label>
            <Input
              id="pt-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            />
            <p className="text-xs text-muted-foreground">{t("pt.transferHint", { balance })}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!to.trim() || !amount || Number(amount) <= 0 || transfer.isPending}
              onClick={() => transfer.mutate()}
            >
              {t("pt.transferSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 积分明细 */}
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  )
}

function HistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useT()
  const history = useQuery({ queryKey: ["points", "history"], queryFn: pointsApi.history, enabled: open })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pt.detail")}</DialogTitle>
        </DialogHeader>
        {history.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {history.data?.items.map((h, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{t(`pt.reason.${h.reason.split(":")[0]}`) || h.reason}</span>
                <span className={h.amount >= 0 ? "tabular-nums text-success" : "tabular-nums text-destructive"}>
                  {h.amount >= 0 ? "+" : ""}
                  {h.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
