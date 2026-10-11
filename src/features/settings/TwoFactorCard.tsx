import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { Copy, KeyRound, Mail, ShieldCheck } from "lucide-react"
import { useT } from "@/i18n"
import { settingsApi } from "@/api/settings"
import { useMe } from "@/features/dashboard-shell/use-me"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingCard } from "./SettingsPage"

/**
 * 二次认证卡（参考站结构）：
 * 动态码（认证器 App）行 + 邮箱验证码行，各带开启/关闭。
 * 开启流程：start → 二维码 + 密钥 + 6 位码确认 → **恢复码只显示一次**（醒目提示 + 复制全部）。
 */
export function TwoFactorCard() {
  const { t } = useT()
  const qc = useQueryClient()
  const { data: user } = useMe()
  const [totpEnabled, setTotpEnabled] = useState(user?.twoFactorEnabled ?? false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [setupOpen, setSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")

  const start = useMutation({
    mutationFn: settingsApi.startTotp,
    onSuccess: () => setSetupOpen(true),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const confirm = useMutation({
    mutationFn: () => settingsApi.confirmTotp(code),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const disable = useMutation({
    mutationFn: () => settingsApi.disableTotp(password),
    onSuccess: () => {
      toast.success(t("s2fa.disabled"))
      setTotpEnabled(false)
      setDisableOpen(false)
      setPassword("")
      void qc.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const toggleEmail = useMutation({
    mutationFn: () => (emailEnabled ? settingsApi.disableEmail2fa() : settingsApi.enableEmail2fa()),
    onSuccess: () => {
      setEmailEnabled((v) => !v)
      toast.success(t("common.success"))
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  async function copyAll(codes: string[]) {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  const recoveryCodes = confirm.data?.recoveryCodes ?? null

  return (
    <SettingCard title={t("s2fa.title")} desc={t("s2fa.desc")}>
      <div className="space-y-4">
        {/* 认证器 App（动态码） */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm">
            <KeyRound className="size-4 text-muted-foreground" />
            {t("s2fa.totp")}
            {totpEnabled && <Badge variant="success">{t("s2fa.enabled")}</Badge>}
          </span>
          {totpEnabled ? (
            <Button variant="outline" size="sm" onClick={() => setDisableOpen(true)}>
              {t("common.disable")}
            </Button>
          ) : (
            <Button size="sm" disabled={start.isPending} onClick={() => start.mutate()}>
              {t("common.enable")}
            </Button>
          )}
        </div>

        {/* 邮箱验证码 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            {t("s2fa.email")}
            {user?.email && <span className="text-xs text-muted-foreground">{maskEmail(user.email)}</span>}
            {emailEnabled && <Badge variant="success">{t("s2fa.enabled")}</Badge>}
          </span>
          <Button variant="outline" size="sm" disabled={toggleEmail.isPending} onClick={() => toggleEmail.mutate()}>
            {emailEnabled ? t("common.disable") : t("common.enable")}
          </Button>
        </div>
      </div>

      {/* 开启流程对话框 */}
      <Dialog
        open={setupOpen}
        onOpenChange={(v) => {
          if (!v) {
            setSetupOpen(false)
            setCode("")
            confirm.reset()
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{recoveryCodes ? t("s2fa.recovery.title") : t("s2fa.setup.title")}</DialogTitle>
            <DialogDescription>
              {recoveryCodes ? t("s2fa.recovery.desc") : t("s2fa.setup.desc")}
            </DialogDescription>
          </DialogHeader>

          {!recoveryCodes ? (
            <>
              {start.data ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-md bg-white p-3">
                    <QRCodeSVG value={start.data.otpauthUrl} size={160} />
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs">
                      {start.data.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(start.data!.secret)
                          toast.success(t("common.copied"))
                        } catch {
                          toast.error(t("common.copyFailed"))
                        }
                      }}
                    >
                      <Copy className="size-4" />
                      {t("common.copy")}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="s2fa-code">{t("s2fa.codeLabel")}</Label>
                <Input
                  id="s2fa-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("s2fa.codePh")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                />
              </div>
              <DialogFooter>
                <Button
                  disabled={code.length !== 6 || confirm.isPending}
                  onClick={() => confirm.mutate()}
                >
                  {t("s2fa.confirmEnable")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* 恢复码：只显示一次 */}
              <p className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                <ShieldCheck className="size-4 shrink-0" />
                {t("s2fa.recovery.warn")}
              </p>
              <ul className="grid grid-cols-2 gap-1.5 font-mono text-sm">
                {recoveryCodes.map((c) => (
                  <li key={c} className="rounded-sm bg-muted px-2 py-1 text-center">
                    {c}
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => copyAll(recoveryCodes)}>
                  <Copy className="size-4" />
                  {t("s2fa.recovery.copyAll")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setTotpEnabled(true)
                    toast.success(t("s2fa.enabledToast"))
                    setSetupOpen(false)
                    setCode("")
                    confirm.reset()
                  }}
                >
                  {t("s2fa.recovery.saved")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 关闭对话框（需密码） */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("s2fa.disableTitle")}</DialogTitle>
            <DialogDescription>{t("s2fa.disableDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="s2fa-pwd">{t("login.password")}</Label>
            <Input
              id="s2fa-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" disabled={!password || disable.isPending} onClick={() => disable.mutate()}>
              {t("s2fa.disableSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingCard>
  )
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  return `${name.slice(0, 1)}***@${domain}`
}
