import { expect, test } from "@playwright/test"

/** E2E 主链路（mock 态）：落地页可访问、核心区块渲染 */
test("landing renders hero and features", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/一站式云端平台|One cloud platform/)
  await expect(page.getByText(/九大能力|Nine capabilities/)).toBeVisible()
  await expect(page.getByRole("link", { name: /立即注册|Sign up now/ }).first()).toBeVisible()
})

test("login page renders and env diag works", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /登录|Sign in/ })).toBeVisible()
  await expect(page.getByText(/环境自检|Environment check/)).toBeVisible()
})

test("dashboard redirects to login when not authed", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login/)
})

test("register shows email preview when typing username", async ({ page }) => {
  await page.goto("/register")
  await page.getByLabel(/用户名|Username/).fill("yanxi")
  await expect(page.getByText(/yanxi@xueia\.com/)).toBeVisible()
})
