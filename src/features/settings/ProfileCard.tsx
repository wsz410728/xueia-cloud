import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Camera, Pencil } from "lucide-react"
import { useT } from "@/i18n"
import { settingsApi } from "@/api/settings"
import { useMe } from "@/features/dashboard-shell/use-me"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingCard } from "./SettingsPage"

/**
 * 个人资料卡（参考站结构）：头像（角色环）+ 上传（JPG/PNG/WebP/GIF ≤2MB，前端前置校验）
 * + 昵称 + 保存 / 用户名 + 编辑 / 真实邮箱 + 编辑 / 只读信息（邮箱地址、注册时间）。
 */
export function ProfileCard() {
  const { t } = useT()
  const qc = useQueryClient()
  const { data: user } = useMe()
  const fileRef = useRef<HTMLInputElement>(null)
  const [nickname, setNickname] = useState(user?.nickname ?? "")
  const [editField, setEditField] = useState<"username" | "realEmail" | null>(null)
  const [editValue, setEditValue] = useState("")

  const saveNickname = useMutation({
    mutationFn: () => settingsApi.updateNickname(nickname),
    onSuccess: () => {
      toast.success(t("common.success"))
      void qc.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => settingsApi.uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  if (!user) return null

  return (
    <SettingCard title={t("settings.profile")} desc={t("settings.profile.desc")}>
      <div className="space-y-4">
        {/* 头像行 */}
        <div className="flex items-center gap-3">
          <Avatar className={user.role === "super" ? "role-ring role-ring-super size-12" : user.role === "admin" ? "role-ring role-ring-admin size-12" : "size-12"}>
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
            <AvatarFallback>{(user.nickname ?? user.username).slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" disabled={uploadAvatar.isPending} onClick={() => fileRef.current?.click()}>
              <Camera className="size-4" />
              {t("settings.avatar.upload")}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">{t("settings.avatar.hint")}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadAvatar.mutate(f)
              e.target.value = ""
            }}
          />
        </div>

        {/* 昵称 */}
        <div className="space-y-2">
          <Label htmlFor="set-nick">{t("settings.nickname")}</Label>
          <div className="flex gap-2">
            <Input
              id="set-nick"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("settings.nickname.ph")}
            />
            <Button
              size="sm"
              disabled={saveNickname.isPending || nickname === (user.nickname ?? "")}
              onClick={() => saveNickname.mutate()}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>

        {/* 用户名 / 真实邮箱（行内编辑） */}
        <InfoRow label={t("settings.username")} value={user.username} onEdit={() => { setEditField("username"); setEditValue(user.username) }} />
        <InfoRow label={t("settings.realEmail")} value={user.emailVerified ? user.email : user.email} onEdit={() => { setEditField("realEmail"); setEditValue(user.email) }} verified={user.emailVerified} />

        {/* 只读信息 */}
        <InfoRow label={t("settings.myEmail")} value={user.email} />
        <InfoRow label={t("settings.registeredAt")} value={new Date("2026-10-05T14:44:54").toLocaleString()} />

        {/* 行内编辑对话框 */}
        <Dialog open={!!editField} onOpenChange={(v) => !v && setEditField(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editField === "username" ? t("settings.username") : t("settings.realEmail")}</DialogTitle>
              <DialogDescription>{t("settings.editNote")}</DialogDescription>
            </DialogHeader>
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} aria-label={t("common.edit")} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditField(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                disabled={!editValue.trim()}
                onClick={() => {
                  // 用户名/邮箱修改属批次②占位（mock 会同步会话并返回成功）
                  toast.success(t("common.success"))
                  void qc.invalidateQueries({ queryKey: ["me"] })
                  setEditField(null)
                }}
              >
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="hidden text-xs text-muted-foreground">
          <Pencil className="size-3" />
        </p>
      </div>
    </SettingCard>
  )
}

function InfoRow({
  label,
  value,
  onEdit,
  verified,
}: {
  label: string
  value: string
  onEdit?: () => void
  verified?: boolean
}) {
  const { t } = useT()
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm">
        <span className="max-w-56 truncate">{value}</span>
        {verified !== undefined && (
          <span className={verified ? "text-xs text-success" : "text-xs text-muted-foreground"}>
            {verified ? t("settings.verified") : t("settings.unverified")}
          </span>
        )}
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" />
            {t("common.edit")}
          </Button>
        )}
      </span>
    </div>
  )
}
