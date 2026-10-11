import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"

/** 浏览器端 MSW worker（public/mockServiceWorker.js 由 `npx msw init public/` 生成） */
export const worker = setupWorker(...handlers)
