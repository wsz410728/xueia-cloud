import { Coins, RefreshCw, Send, ShoppingBag, Ticket } from "lucide-react"
import { useT } from "@/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 积分与商城 —— 对齐参考站结构：余额区 + 兑换卡 + 商品网格（含售罄/积分不足态）。
 * 数据占位（批次④接接口）。
 */

interface Product {
  name: string
  desc: string
  price: number
  stock: number
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  { name: "补签卡 1 张", desc: "可以用来补签漏掉的签到日，助力你的连续签到目标", price: 20, stock: 12 },
  { name: "中转站余额 ￥10", desc: "直接充进 AI 中转站余额，下单即到账", price: 10, stock: 99 },
  { name: "邀请码额度 +1", desc: "增加一枚可创建的邀请码", price: 50, stock: 3 },
  { name: "代理订阅 30 天", desc: "开通 30 天代理节点使用权限", price: 200, stock: 0 },
  { name: "FRP 端口使用权", desc: "申请一个内网穿透端口额度", price: 80, stock: 5 },
  { name: "自选权限兑换券", desc: "可解锁任意一个未开通的模块", price: 500, stock: 1 },
]

export function PointsPage() {
  const { t } = useT()
  const balance = 128

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={t("pt.title")}
        subtitle={t("pt.subtitle")}
        toolbar={
          <>
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4" />
              {t("common.refresh")}
            </Button>
            <Button size="sm">{t("pt.checkin")}</Button>
          </>
        }
      />

      {/* 余额与操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pt.mine")}</CardTitle>
          <CardDescription>{t("pt.rate")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-2xl font-bold tabular-nums">
            <Coins className="size-6 text-success" />
            {balance}
            <span className="text-sm font-normal text-muted-foreground">{t("pt.unit")}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm"><Send className="size-4" />{t("pt.transfer")}</Button>
            <Button variant="outline" size="sm"><ShoppingBag className="size-4" />{t("pt.orders")}</Button>
            <Button variant="outline" size="sm"><Ticket className="size-4" />{t("pt.detail")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* 商品网格 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("pt.shop")}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("pt.sortHot")}</Badge>
            <Badge variant="secondary">{t("pt.inStockOnly")}</Badge>
            <Badge variant="secondary">{t("ph.demo")}</Badge>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_PRODUCTS.map((p) => {
            const soldOut = p.stock === 0
            const notEnough = !soldOut && p.price > balance
            return (
              <Card key={p.name} className="data-fade flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{p.name}</span>
                    {soldOut ? (
                      <Badge variant="secondary">{t("pt.soldOut")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("pt.stock", { n: p.stock })}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-base font-bold tabular-nums">
                    {p.price} <span className="text-xs font-normal text-muted-foreground">{t("pt.unit")}</span>
                  </span>
                  <Button size="sm" disabled={soldOut || notEnough} variant={soldOut ? "secondary" : "default"}>
                    {soldOut ? t("pt.soldOut") : notEnough ? t("pt.notEnough") : t("pt.buy")}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
