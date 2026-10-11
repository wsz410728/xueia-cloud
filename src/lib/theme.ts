export type ThemeSetting = "light" | "dark" | "system"

const STORAGE_KEY = "xueia-theme"

export function getStoredTheme(): ThemeSetting {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === "light" || v === "dark" || v === "system") return v
  } catch {
    /* 隐私模式 */
  }
  return "system"
}

function systemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function apply(setting: ThemeSetting) {
  const dark = setting === "dark" || (setting === "system" && systemDark())
  document.documentElement.classList.toggle("dark", dark)
}

export function setTheme(setting: ThemeSetting) {
  try {
    localStorage.setItem(STORAGE_KEY, setting)
  } catch {
    /* 隐私模式 */
  }
  apply(setting)
}

/** 订阅系统主题变化（设置里选「跟随系统」时生效）；返回取消函数 */
export function watchSystemTheme(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const onChange = () => {
    if (getStoredTheme() === "system") apply("system")
  }
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}
