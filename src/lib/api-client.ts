import { toast } from "sonner"

/** 统一响应 envelope（契约见 docs/api.md §1，前端先定型） */
export type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string }; data?: unknown }

/** API 前缀：同源相对，部署期由托管层反代到后端（设计文档 §10.1） */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "/api/v1"

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  /** 429 时后端给的秒数 */
  readonly retryAfter?: number
  /** 部分错误码携带业务数据（如 AUTH_2FA_REQUIRED 的 twoFactorTicket，契约见 docs/api.md） */
  readonly data?: unknown
  constructor(code: string, message: string, status: number, retryAfter?: number, data?: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
    this.data = data
  }
}

function redirectToLogin() {
  const from = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.assign(`/login?from=${from}`)
}

/**
 * fetch 封装：JSON envelope 解析 + 统一错误处理。
 * 401 → 跳 /login?from=…（/me 与登录页除外）；403/429/5xx → 统一 toast；429 带倒计时秒数。
 * AUTH_2FA_REQUIRED 视为登录流程信号：原样抛出并携带 data，由登录页接票进入 2FA。
 * 各业务代码只 catch ApiError 处理自己关心的 code，无需重复处理 401/403。
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData 让浏览器自带 multipart boundary；JSON 请求才设置 Content-Type
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers,
      },
    })
  } catch {
    toast.error("网络异常，请检查连接后重试")
    throw new ApiError("SYS_NETWORK", "网络异常", 0)
  }

  let body: Envelope<T> | null = null
  try {
    body = (await res.json()) as Envelope<T>
  } catch {
    /* 非 JSON 响应，按下面错误分支走 */
  }

  const errCode = body && body.ok === false ? body.error.code : `SYS_HTTP_${res.status}`
  const errMsg = body && body.ok === false ? body.error.message : `请求失败（${res.status}）`
  const errData = body && body.ok === false ? body.data : undefined
  const retryAfter = Number(res.headers.get("Retry-After")) || undefined

  if (!res.ok || !body || body.ok === false) {
    // 2FA 所需：登录流程信号，原样抛出（含票据），不做 401 跳转
    if (res.status === 401 && errCode === "AUTH_2FA_REQUIRED") {
      throw new ApiError(errCode, errMsg, 401, undefined, errData)
    }

    if (res.status === 401) {
      // /me 的 401 = 未登录状态查询，由路由守卫决定导航，不在此跳转；
      // 其余接口的 401 才统一跳 /login?from=…（已在登录页时不重复跳）。
      const isMeQuery = path === "/me"
      const onLoginPage = window.location.pathname === "/login"
      if (!isMeQuery && !onLoginPage) redirectToLogin()
      throw new ApiError(errCode, errMsg, 401, undefined, errData)
    }

    if (res.status === 403) toast.error("无权限")
    else if (res.status === 429) toast.error(`操作太频繁，请 ${retryAfter ?? 30} 秒后重试`)
    else if (res.status >= 500) toast.error("服务器开小差了，请稍后重试")

    throw new ApiError(errCode, errMsg, res.status, retryAfter, errData)
  }

  return body.data
}

export const get = <T,>(path: string) => request<T>(path)
export const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    // FormData 必须原样透传（由浏览器带 multipart boundary）；JSON 才 stringify。
    // 终审 C1：此前 post 无条件 stringify，把 FormData 变成 "{}" 字符串，上传成功路径全坏。
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  })
