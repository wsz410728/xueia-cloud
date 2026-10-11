import { expect, test } from "@playwright/test"

/**
 * 批次② E2E（mock 态）。
 * 说明：mock 会话存于 MSW worker 内存 —— 整页跳转（page.goto）会重置登录态，
 * 因此登录后的用例必须用**页内导航**（点击链接），见「settings page」用例。
 */

test("guest can pick up a shared text without login", async ({ page }) => {
  await page.goto("/tempbox?code=ABC123")
  await expect(page.getByText("hello from mock")).toBeVisible()
})

test("guest sees a friendly expired state for an unknown code", async ({ page }) => {
  await page.goto("/tempbox")
  await page.getByRole("textbox").fill("ZZZZZZ")
  await page.getByRole("button", { name: "解锁" }).click()
  await expect(page.getByText(/已过期或不存在/)).toBeVisible()
})

test("appeal page is public and validates length", async ({ page }) => {
  await page.goto("/appeal")
  const submit = page.getByRole("button", { name: "提交申诉" })
  await expect(submit).toBeDisabled()
  await page.getByLabel("申诉说明").fill("我的账号被误封了，请复核。")
  await page.getByLabel("账号（用户名或邮箱）").fill("jooyang")
  await expect(submit).toBeEnabled()
})

test("login then reach settings and the email page (SPA navigation)", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel(/用户名或邮箱/).fill("yanxi")
  await page.getByLabel(/密码/).fill("password123")
  await page.getByRole("button", { name: "登录", exact: true }).click()
  await page.getByText("二次验证").waitFor({ state: "visible" })
  await page.getByRole("textbox", { name: "6 位动态码" }).fill("123456")
  await page.getByRole("button", { name: "验证", exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // 页内导航：账户设置（七分类）
  await page.getByRole("link", { name: "账户设置" }).click()
  await expect(page.getByRole("button", { name: "危险区" })).toBeVisible()

  // 页内导航：邮箱（地址卡 + 临时邮箱区）
  await page.getByRole("link", { name: "邮箱", exact: true }).click()
  await expect(page.getByText(/个地址$/)).toBeVisible()
  await expect(page.getByText("临时邮箱")).toBeVisible()

  // 页内导航：分享箱（四项参数）
  await page.getByRole("link", { name: "临时分享箱" }).click()
  await expect(page.getByText("默认保存")).toBeVisible()
})
