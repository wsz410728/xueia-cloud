import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useT } from "@/i18n"
import { settingsApi } from "@/api/settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { SettingCard } from "./SettingsPage"

/** 通知偏好卡（参考站结构）：接收站点公告 / 接收个人相关通知 两个开关 */
export function NotifyCard() {
  const { t } = useT()
  const qc = useQueryClient()
  const [prefs, setPrefs] = useState({ announcements: true, personal: true })

  const save = useMutation({
    mutationFn: settingsApi.updateNotify,
    onSuccess: () => {
      toast.success(t("common.success"))
      void qc.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  function toggle(key: "announcements" | "personal", value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    save.mutate(next)
  }

  return (
    <SettingCard title={t("settings.notify")} desc={t("settings.notify.desc")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="notify-ann">{t("settings.notify.announcements")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.notify.announcementsHint")}</p>
          </div>
          <Switch
            id="notify-ann"
            checked={prefs.announcements}
            onCheckedChange={(v) => toggle("announcements", v)}
            aria-label={t("settings.notify.announcements")}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="notify-personal">{t("settings.notify.personal")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.notify.personalHint")}</p>
          </div>
          <Switch
            id="notify-personal"
            checked={prefs.personal}
            onCheckedChange={(v) => toggle("personal", v)}
            aria-label={t("settings.notify.personal")}
          />
        </div>
      </div>
    </SettingCard>
  )
}

/** 安全卡：修改密码 + 消息通知说明 */
export function SecurityCard() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")

  const change = useMutation({
    mutationFn: () => settingsApi.changePassword(oldPw, newPw),
    onSuccess: () => {
      toast.success(t("settings.security.pwChanged"))
      setOpen(false)
      setOldPw("")
      setNewPw("")
      setConfirmPw("")
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const mismatch = confirmPw.length > 0 && newPw !== confirmPw

  return (
    <SettingCard title={t("settings.security")} desc={t("settings.security.desc")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">{t("settings.security.password")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.security.passwordHint")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("settings.security.changePw")}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-sm">{t("settings.security.push")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.security.pushHint")}</p>
          </div>
          <span className="text-xs text-success">{t("s2fa.enabled")}</span>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.security.changePw")}</DialogTitle>
            <DialogDescription>{t("settings.security.passwordHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pw-old">{t("settings.security.oldPw")}</Label>
            <Input id="pw-old" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            <Label htmlFor="pw-new">{t("settings.security.newPw")}</Label>
            <Input id="pw-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <Label htmlFor="pw-confirm">{t("settings.security.confirmPw")}</Label>
            <Input id="pw-confirm" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            {mismatch && <p className="text-xs text-destructive">{t("settings.security.mismatch")}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!oldPw || newPw.length < 8 || mismatch || change.isPending}
              onClick={() => change.mutate()}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingCard>
  )
}
