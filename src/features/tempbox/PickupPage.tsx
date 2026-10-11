import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Cloud, Copy, Download, LockOpen } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { tempboxApi } from "@/api/tempbox"
import type { TempboxPickup } from "@/api/tempbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

/**
 * 临时分享箱 —— 游客取件页（公开路由 /tempbox，不套控制台外壳）。
 * 参考站结构：「输入接收码解锁」+「访客无需登录即可查看与下载」+ 输入框 + 解锁。
 * ?code= 参数自动解锁；未知/过期码显示友好过期态（不抛未捕获错误）。
 */
export function PickupPage() {
  const { t } = useT()
  // 分享链接直达：从 ?code= 初始化并无感解锁
  const [params] = useSearchParams()
  const [code, setCode] = useState(() => (params.get("code") ?? "").toUpperCase())
  const [result, setResult] = useState<TempboxPickup | null>(null)
  const [expired, setExpired] = useState(false)

  const pickup = useMutation({
    mutationFn: () => tempboxApi.pickup(code),
    onSuccess: (data) => {
      setExpired(false)
      setResult(data)
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : String(e)
      // 过期/不存在 → 友好过期态（Review Focus #1），其余错误 toast
      if (/过期|不存在|TB_CODE_EXPIRED/.test(message)) {
        setExpired(true)
        setResult(null)
      } else {
        toast.error(message)
      }
    },
  })

  // 分享链接直达：挂载时若已有合法码，自动解锁
  useEffect(() => {
    const c = (params.get("code") ?? "").toUpperCase()
    if (/^[A-Z0-9]{6}$/.test(c)) pickup.mutate()
    // 仅挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-2 px-4 font-bold">
          <Link to="/" className="flex items-center gap-2">
            <Cloud className="size-6" />
            {brand.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("tb.pickup.title")}</CardTitle>
            <CardDescription>{t("tb.pickup.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (code.trim().length === 6) pickup.mutate()
                }}
              >
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setExpired(false)
                  }}
                  placeholder={t("tb.codePlaceholder")}
                  aria-label={t("tb.codePlaceholder")}
                  maxLength={6}
                  className="text-center font-mono text-xl tracking-[0.4em]"
                />
                {expired && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-center text-xs text-destructive">
                    {t("tb.pickup.expired")}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={code.trim().length !== 6 || pickup.isPending}>
                  <LockOpen className="size-4" />
                  {pickup.isPending ? t("common.loading") : t("tb.unlock")}
                </Button>
              </form>
            ) : result.kind === "text" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{t("tb.textBadge")}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("tb.pickup.expires", { time: new Date(result.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                  </span>
                </div>
                <p className="max-h-72 overflow-y-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                  {result.text}
                </p>
                <Button variant="outline" size="sm" onClick={() => copy(result.kind === "text" ? result.text : "")}>
                  <Copy className="size-4" />
                  {t("tb.copyText")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setResult(null); setCode("") }}>
                  {t("tb.pickup.another")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{t("tb.pickup.filesBadge")}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("tb.pickup.expires", { time: new Date(result.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {result.files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="min-w-0 truncate text-sm">{f.name}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                        <Button asChild variant="outline" size="sm">
                          <a href={f.url} download={f.name}>
                            <Download className="size-4" />
                            {t("tb.download")}
                          </a>
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" size="sm" onClick={() => { setResult(null); setCode("") }}>
                  {t("tb.pickup.another")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {result === null && !expired && (
          <Skeleton className="hidden" />
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {brand.fullName} ·{" "}
          <Link to="/terms" className="underline-offset-2 hover:underline">{t("legal.terms")}</Link> ·{" "}
          <Link to="/privacy" className="underline-offset-2 hover:underline">{t("legal.privacy")}</Link>
        </div>
      </footer>
    </div>
  )
}
