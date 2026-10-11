import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Cloud } from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/api/auth"
import { ApiError } from "@/lib/api-client"
import { useSetMe } from "@/features/dashboard-shell/use-me"

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z0-9_]+$/),
    realEmail: z.string().email(),
    password: z.string().min(8),
    passwordConfirm: z.string(),
    inviteCode: z.string().min(1),
    agreeTerms: z.literal(true),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "passwordMismatch",
  })

type RegisterValues = z.input<typeof registerSchema>

/** 注册页：用户名实时预览 username@{emailDomain}、邀请码、条款勾选 */
export function RegisterPage() {
  const { t } = useT()
  const navigate = useNavigate()
  const setMe = useSetMe()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      realEmail: "",
      password: "",
      passwordConfirm: "",
      inviteCode: "",
    },
  })

  const username = form.watch("username")

  async function onSubmit(values: RegisterValues) {
    try {
      const data = await authApi.register({
        username: values.username,
        realEmail: values.realEmail,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        inviteCode: values.inviteCode,
        agreeTerms: true,
      })
      setMe(data.user)
      toast.success(t("reg.ok"))
      navigate("/dashboard", { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === "AUTH_USERNAME_TAKEN") {
        form.setError("username", { message: "usernameTaken" })
        return
      }
      toast.error(e instanceof Error ? e.message : String(e))
    }
  }

  const err = form.formState.errors

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <Cloud className="size-7" />
        {brand.name}
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t("reg.title")}</CardTitle>
          <CardDescription>{brand.fullName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="reg-username">{t("reg.username")}</Label>
              <Input id="reg-username" autoComplete="username" placeholder={t("reg.usernamePh")} {...form.register("username")} required />
              {err.username ? (
                <p className="text-xs text-destructive">{err.username.message}</p>
              ) : (
                username && (
                  <p className="text-xs text-success">{t("reg.usernameHint", { email: `${username}@${brand.emailDomain}` })}</p>
                )
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">{t("reg.email")}</Label>
              <Input id="reg-email" type="email" autoComplete="email" placeholder={t("reg.emailPh")} {...form.register("realEmail")} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">{t("reg.password")}</Label>
              <Input id="reg-password" type="password" autoComplete="new-password" placeholder={t("reg.passwordPh")} {...form.register("password")} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password2">{t("reg.passwordConfirm")}</Label>
              <Input id="reg-password2" type="password" autoComplete="new-password" {...form.register("passwordConfirm")} required />
              {err.passwordConfirm && <p className="text-xs text-destructive">passwordMismatch</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-invite">{t("reg.invite")}</Label>
              <Input id="reg-invite" placeholder={t("reg.invitePh")} {...form.register("inviteCode")} required />
              <p className="text-xs text-muted-foreground">{t("reg.inviteHint")}</p>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...form.register("agreeTerms")} className="mt-0.5 accent-[var(--color-primary)]" />
              <span className="text-muted-foreground">
                {t("reg.agree")} (<Link to="/terms" className="underline-offset-2 hover:underline">{t("legal.terms")}</Link>)
              </span>
            </label>
            {err.agreeTerms && <p className="text-xs text-destructive">required</p>}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("reg.submitting") : t("reg.submit")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="underline-offset-2 hover:underline">
                {t("reg.toLogin")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.fullName}
      </p>
    </main>
  )
}
