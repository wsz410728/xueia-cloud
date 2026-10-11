import { defineConfig, devices } from "@playwright/test"

/**
 * E2E（WSL 环境执行；webServer 自动起 vite dev）。
 * 主链路：落地页 → 注册（mock）→ 登录 → 概览（批次①范围）。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
