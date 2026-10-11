import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeAll, afterAll } from "vitest"
import { setupServer } from "msw/node"
import { handlers } from "@/mocks/handlers"

/** 测试用 MSW（node 端拦截 fetch） */
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
