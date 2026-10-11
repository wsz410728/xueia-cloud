import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 相对时间：刚刚 / n 分钟前 / n 小时前 / 昨天 / n 天前 */
export function timeAgo(iso: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return t("fmt.justNow")
  if (min < 60) return t("fmt.minutesAgo", { n: min })
  const hours = Math.floor(min / 60)
  if (hours < 24) return t("fmt.hoursAgo", { n: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t("fmt.yesterday")
  return t("fmt.daysAgo", { n: days })
}
