/**
 * 界面偏好（纯客户端，存 localStorage，不随账号同步 —— 与参考站语义一致）。
 */
export interface UiPrefs {
  /** 全局动效开关 */
  motion: boolean
  /** 点击粒子（需先开动效） */
  clickParticles: boolean
  /** AI 实验室专属花哨动效（与上面两项互不影响） */
  labMotion: boolean
}

const KEY = "xueia-ui-prefs"

const DEFAULTS: UiPrefs = { motion: true, clickParticles: false, labMotion: true }

export function getUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UiPrefs>) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setUiPref<K extends keyof UiPrefs>(key: K, value: UiPrefs[K]): UiPrefs {
  const next = { ...getUiPrefs(), [key]: value }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 隐私模式：偏好不持久化，仅本次会话生效 */
  }
  return next
}
