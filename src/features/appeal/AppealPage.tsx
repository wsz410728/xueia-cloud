import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Cloud, Send } from "lucide-react"
import { Link } from "react-router"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { appealApi } from "@/api/appeal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MIN_LEN = 10

/**
 * 账号申诉页（公开路由 /appeal，不套控制台外壳）。
 * 参考站结构：品牌 Logo + 账号申诉 + 说明 + 三字段（账号/联系方式选填/申诉说明）
 * + 实时字数（还需 N 个字，至少 10 字）+ 提交（不足禁用）+ 返回登录 + 页脚。
 */
export function AppealPage() {
  const { t } = useT()
  const [account, setAccount] = useState("")
  const [contact, setContact] = useState("")
  const [content, setContent] = useState("")
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  const remaining = Math.max(0, MIN_LEN - content.trim().length)

  const submit = useMutation({
    mutationFn: () => appealApi.submit({ account, contact, content }),
    onSuccess: (d) => setSubmittedAt(d.submittedAt),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("appeal.title")}</CardTitle>
            <CardDescription>{t("appeal.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submittedAt ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="size-10 text-success" />
                <p className="text-sm font-medium">{t("appeal.submitted")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("appeal.submittedDesc", { time: new Date(submittedAt).toLocaleString() })}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">{t("appeal.backToLogin")}</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit.mutate()
                }}
              >
                <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">{t("appeal.note")}</p>

                <div className="space-y-2">
                  <Label htmlFor="ap-account">{t("appeal.account")}</Label>
                  <Input
                    id="ap-account"
                    required
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder={t("appeal.accountPh")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ap-contact">{t("appeal.contact")}</Label>
                  <Input
                    id="ap-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("appeal.contactPh")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ap-content">{t("appeal.content")}</Label>
                  <textarea
                    id="ap-content"
                    required
                    className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("appeal.contentPh")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining > 0 ? t("appeal.remaining", { n: remaining }) : t("appeal.enough")}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={remaining > 0 || !account.trim() || submit.isPending}>
                  <Send className="size-4" />
                  {submit.isPending ? t("common.loading") : t("appeal.submit")}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="underline-offset-2 hover:underline">
                    {t("appeal.backToLogin")}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
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
