import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Eye, EyeOff } from "lucide-react"
import { useT } from "@/i18n"
import { settingsApi } from "@/api/settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingCard } from "./SettingsPage"

/** 危险区卡：注销账号（警告 → 请求验证码 → 二次确认 → 注销并清会话跳首页） */
export function DangerCard() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [reveal, setReveal] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const requestCode = useMutation({
    mutationFn: settingsApi.requestDeleteCode,
    onSuccess: (d) => {
      setSentTo(d.sentTo)
      toast.success(t("settings.danger.codeSent", { to: d.sentTo }))
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const confirmDelete = useMutation({
    mutationFn: () => settingsApi.deleteAccount(code),
    onSuccess: () => {
      toast.success(t("settings.danger.done"))
      window.location.assign("/")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  return (
    <SettingCard title={t("settings.danger")} desc={t("settings.danger.desc")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex max-w-md items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {t("settings.danger.warn")}
        </p>
        <Button variant="destructive" size="sm" onClick={() => { setOpen(true); requestCode.mutate() }}>
          {t("settings.danger.action")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.danger.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {sentTo ? t("settings.danger.codeSent", { to: sentTo }) : t("settings.danger.confirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="del-code">{t("settings.danger.code")}</Label>
            <div className="flex gap-2">
              <Input
                id="del-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder={t("settings.danger.codePh")}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => (reveal ? setReveal(false) : setReveal(true))}
                aria-label={t("common.view")}
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.danger.note")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={code.length !== 6 || confirmDelete.isPending}
              onClick={() => confirmDelete.mutate()}
            >
              {t("settings.danger.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingCard>
  )
}
