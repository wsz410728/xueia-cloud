/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 前缀（默认 /api/v1 同源反代） */
  readonly VITE_API_BASE?: string
  /** 是否启用 MSW mock（dev 默认 true，生产构建 false） */
  readonly VITE_ENABLE_MSW?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
