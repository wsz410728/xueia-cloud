import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Cloud, MailCheck } from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/api/auth"

/** 忘记密码页 */
export function ForgotPasswordPage() {
  const { t } = useT()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
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
          <CardTitle className="text-xl">{t("forgot.title")}</CardTitle>
          <CardDescription>{t("forgot.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <MailCheck className="size-10 text-success" />
              <p className="text-sm text-muted-foreground">{t("forgot.sent")}</p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">{t("forgot.back")}</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t("forgot.email")}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("reg.emailPh")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !email}>
                {t("forgot.submit")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="underline-offset-2 hover:underline">
                  {t("forgot.back")}
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} {brand.fullName}</p>
    </main>
  )
}
