import { useState } from "react"
import { useT } from "@/i18n"
import { getUiPrefs, setUiPref, type UiPrefs } from "@/lib/ui-prefs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SettingCard } from "./SettingsPage"

/**
 * 界面动效卡（参考站结构）：三个开关 —— 启用动效 / 点击粒子（依赖动效） / AI 实验室动效。
 * 偏好存 localStorage（`xueia-ui-prefs`），不进接口。
 */
export function GeneralCard() {
  const { t } = useT()
  const [prefs, setPrefs] = useState<UiPrefs>(() => getUiPrefs())

  function update<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]) {
    setPrefs(setUiPref(key, value))
  }

  return (
    <SettingCard title={t("settings.motion")} desc={t("settings.motion.desc")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="pref-motion">{t("settings.motion.enable")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.motion.enableHint")}</p>
          </div>
          <Switch
            id="pref-motion"
            checked={prefs.motion}
            onCheckedChange={(v) => update("motion", v)}
            aria-label={t("settings.motion.enable")}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="pref-particles">{t("settings.motion.particles")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.motion.particlesHint")}</p>
          </div>
          <Switch
            id="pref-particles"
            checked={prefs.clickParticles}
            disabled={!prefs.motion}
            onCheckedChange={(v) => update("clickParticles", v)}
            aria-label={t("settings.motion.particles")}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="pref-lab">{t("settings.motion.lab")}</Label>
            <p className="text-xs text-muted-foreground">{t("settings.motion.labHint")}</p>
          </div>
          <Switch
            id="pref-lab"
            checked={prefs.labMotion}
            onCheckedChange={(v) => update("labMotion", v)}
            aria-label={t("settings.motion.lab")}
          />
        </div>

        <p className="text-xs text-muted-foreground">{t("settings.motion.note")}</p>
      </div>
    </SettingCard>
  )
}
