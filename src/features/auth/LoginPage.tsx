import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Cloud, CheckCircle2, XCircle } from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api-client"
import { authApi } from "@/api/auth"
import { useSetMe } from "@/features/dashboard-shell/use-me"

type LoginResult = Awaited<ReturnType<typeof authApi.login>>

/** 环境自检面板（HTTPS/Cookie/LocalStorage） */
function EnvDiag() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const https = window.location.protocol === "https:" || window.location.hostname === "localhost"
  let cookie = false
  try {
    document.cookie = "xueia-check=1"
    cookie = document.cookie.includes("xueia-check")
    document.cookie = "xueia-check=;expires=Thu, 01 Jan 1970 00:00:00 GMT"
  } catch {
    cookie = false
  }
  let storage = false
  try {
    localStorage.setItem("xueia-check", "1")
    storage = localStorage.getItem("xueia-check") === "1"
    localStorage.removeItem("xueia-check")
  } catch {
    storage = false
  }
  const rows: Array<[string, boolean, string]> = [
    [t("login.diag.https"), https, "login.diag.https"],
    [t("login.diag.cookie"), cookie, "login.diag.cookie"],
    [t("login.diag.storage"), storage, "login.diag.storage"],
  ]
  return (
    <div className="rounded-lg border bg-muted/40 text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-muted-foreground"
        aria-expanded={open}
      >
        <span>
          {t("login.diag.title")}：
          {rows.every(([, v]) => v) ? t("login.diag.ok") : t("login.diag.bad")}
        </span>
        <span className="underline underline-offset-2">{open ? t("login.diag.collapse") : t("login.diag.expand")}</span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t px-3 py-2">
          {rows.map(([label, v]) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={`flex items-center gap-1 ${v ? "text-success" : "text-destructive"}`}>
                {v ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                {v ? t("login.diag.ok") : t("login.diag.bad")}
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{t("login.diag.tip")}</p>
        </div>
      )}
    </div>
  )
}

/** 登录页：账号密码 →（mock 强制 2FA）→ 验证码三方式 */
export function LoginPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setMe = useSetMe()

  const [ticket, setTicket] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const from = params.get("from") ?? "/dashboard"

  const form = useForm<{ account: string; password: string }>({
    defaultValues: { account: "", password: "" },
  })

  const [twoFa, setTwoFa] = useState({ method: "totp" as "totp" | "email" | "recovery", code: "" })

  async function onSubmit(values: { account: string; password: string }) {
    try {
      const data: LoginResult = await authApi.login(values.account, values.password)
      setMe(data.user)
      toast.success(t("reg.ok"))
      navigate(from, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === "AUTH_BANNED") {
        toast.error(t("login.banned.title"))
        return
      }
      if (e instanceof ApiError && e.code === "AUTH_2FA_REQUIRED") {
        const d = e.data as { twoFactorTicket?: string } | undefined
        const ticket = typeof d?.twoFactorTicket === "string" ? d.twoFactorTicket : null
        if (ticket) {
          setTicket(ticket)
          return
        }
      }
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

  async function on2fa() {
    if (!ticket) return
    try {
      const data = await authApi.login2fa(ticket, twoFa.method, twoFa.code)
      setMe(data.user)
      toast.success(t("reg.ok"))
      navigate(from, { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === "AUTH_2FA_EXPIRED") {
        setTicket(null)
        setTwoFa((s) => ({ ...s, code: "" }))
      }
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

  async function onSendEmail() {
    if (!ticket) return
    try {
      const data = await authApi.send2faEmail(ticket)
      setSentTo(data.sentTo)
      toast.success(t("login.2fa.emailSentTo", { email: data.sentTo }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <Cloud className="size-7" />
        {brand.name}
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{ticket ? t("login.2fa.title") : t("login.title")}</CardTitle>
          <CardDescription>{ticket ? t("login.2fa.desc") : brand.fullName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!ticket ? (
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="account">{t("login.account")}</Label>
                <Input id="account" autoComplete="username" placeholder={t("login.accountPh")} {...form.register("account")} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Link to="/forgot-password" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    {t("login.forgot")}
                  </Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" placeholder={t("login.passwordPh")} {...form.register("password")} required />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t("login.submitting") : t("login.submit")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/register" className="underline-offset-2 hover:underline">
                  {t("login.toRegister")}
                </Link>
              </p>
            </form>
          ) : (
            <Tabs defaultValue="totp" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="totp">{t("login.2fa.tabTotp")}</TabsTrigger>
                <TabsTrigger value="email">{t("login.2fa.tabEmail")}</TabsTrigger>
                <TabsTrigger value="recovery">{t("login.2fa.tabRecovery")}</TabsTrigger>
              </TabsList>

              <TabsContent value="totp">
                <div className="space-y-3">
                  <Label htmlFor="totp-code">{t("login.2fa.codeLabel")}</Label>
                  <Input id="totp-code" inputMode="numeric" maxLength={6} placeholder={t("login.2fa.codePh")} value={twoFa.code} onChange={(e) => setTwoFa((s) => ({ ...s, method: "totp", code: e.target.value }))} />
                </div>
              </TabsContent>
              <TabsContent value="email">
                <div className="space-y-3">
                  <Label htmlFor="email-code">{t("login.2fa.codeLabel")}</Label>
                  <Input id="email-code" inputMode="numeric" maxLength={6} value={twoFa.code} onChange={(e) => setTwoFa((s) => ({ ...s, method: "email", code: e.target.value }))} />
                  {sentTo ? (
                    <p className="text-xs text-muted-foreground">{t("login.2fa.emailSentTo", { email: sentTo })}</p>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={onSendEmail}>
                      {t("login.2fa.resend")}
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="recovery">
                <div className="space-y-3">
                  <Label htmlFor="recovery-code">{t("login.2fa.recoveryLabel")}</Label>
                  <Input id="recovery-code" maxLength={12} placeholder={t("login.2fa.recoveryPh")} value={twoFa.code} onChange={(e) => setTwoFa((s) => ({ ...s, method: "recovery", code: e.target.value }))} />
                </div>
              </TabsContent>

              <Button className="w-full" onClick={on2fa} disabled={!twoFa.code}>
                {t("login.2fa.submit")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setTicket(null)}>
                {t("login.2fa.back")}
              </Button>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 w-full max-w-sm">
        <EnvDiag />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.fullName} · <Link to="/terms" className="underline-offset-2 hover:underline">{t("legal.terms")}</Link> · <Link to="/privacy" className="underline-offset-2 hover:underline">{t("legal.privacy")}</Link>
      </p>
    </main>
  )
}
