import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { zh } from "./zh"
import { en } from "./en"

export type Lang = "zh" | "en"
export type Dict = Record<string, string>
export type TFn = (key: string, params?: Record<string, string | number>) => string

const STORAGE_KEY = "xueia-lang"
const dicts: Record<Lang, Dict> = { zh, en }

function initialLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === "zh" || v === "en") return v
  } catch {
    /* 隐私模式 */
  }
  return "zh"
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: TFn
}

const I18nContext = createContext<I18nContextValue | null>(null)

let currentLang: Lang = "zh"

/** 未命中回退：当前语言 → zh → key 本身（对齐原站方案） */
function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let text = dicts[lang][key] ?? zh[key] ?? key
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (_, name: string) =>
      name in params ? String(params[name]) : `{${name}}`
    )
  }
  return text
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  currentLang = lang

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* 隐私模式 */
    }
  }, [])

  const t = useCallback<TFn>(
    (key, params) => translate(lang, key, params),
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** 在 Provider 外使用要 throw（对齐原站 useT 方案） */
export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useT 必须在 <I18nProvider> 内使用")
  return ctx
}

/** 非 React 环境取当前语言 */
export function getLang(): Lang {
  return currentLang
}

/** 非 React 环境的翻译函数（错误边界等无 hook 场景） */
export function getT(): TFn {
  return (key, params) => translate(currentLang, key, params)
}
