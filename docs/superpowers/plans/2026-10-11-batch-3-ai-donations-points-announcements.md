# 批次③实施计划：AI 中转站 + 捐献与邀请 + 积分与商城 + 公告强制确认

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native，本项目已定) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 批次③四项：AI 中转站（锁定态/解锁绑定/已解锁界面）、捐献与邀请（资源贡献/邀请码/兑换码）、积分与商城真实功能（签到/兑换/转账/订单）、公告与强制确认弹窗（含「需先捐献」前置）。

**Architecture:** 与批次②同构的三层（页面 → TanStack Query → `api/<域>.ts` → api-client → MSW）。新增 api 模块：`ai.ts`、`donations.ts`、`announcements.ts`；`points.ts` 并扩展。遵循批次②沉淀的全部裁决（MSW 静态路径先于参数路径、校验型方法 async、任务收尾测试+构建双验证、设置卡壳始终渲染、品牌/i18n 红线）。

**Tech Stack:** 不新增依赖（二维码 qrcode.react 已有）。

**Spec:** `docs/superpowers/specs/2026-10-07-xueia-cloud-frontend-design.md`（批次③范围 §2.1/§9；契约 docs/api.md）

## Global Constraints（沿批次②，逐条仍有效）

- 品牌单一来源 `brand.ts`；文案自写走 i18n（`ai.` `don.` `pt.` `an.` `noticeAck.` 命名空间，zh/en 对称）。
- `/api/v1` 契约：**新接口/错误码先登记 `docs/api.md` 再写代码**；envelope `{ok,data}|{ok:false,error:{code,message}}`。
- 测试在 WSL（`wsl -d Ubuntu -- bash -c "cd /mnt/d/WSL/wenjian/web && npm install >/dev/null 2>&1; npm test"`）；构建在 Windows；**每任务收尾必须测试+构建双验证 + commit + push origin main**。
- TDD：先失败测试（看到失败原因正确）→ 最小实现 → 绿 → 提交。
- MSW：静态路径注册在参数路径之前；带前置校验的 api 方法一律 async；mock 会话仅存活于 SPA 导航（E2E 用页内导航）。

## Review Focus

1. **权限门**：AI/FRP/代理页在未解锁时必须显示锁定态（不可绕过看到管理界面）；「贡献解锁」后的解锁流程不可跳步（未审核通过不得解锁）。
2. **积分不可透支**：兑换/转账/商城购买在余额不足时禁止提交（前端前置 + mock 校验），不产生负余额。
3. **强制确认弹窗**：公告含 `requireDonation` 时，未捐献用户**不可关闭**弹窗（关闭按钮隐藏/禁用），且拦截导航；已确认后同会话不再弹。
4. **签到幂等**：同一天重复签到返回明确错误（`POINTS_ALREADY_CHECKED_IN`），UI 显示已签到态；补签卡数量不足时禁止补签。
5. **捐献提交幂等/校验**：重复提交同一资源给出提示；格式不对（如代理订阅链接非 http(s)）前置拦截。
6. **公告已读**：确认后的公告不再重复出现（mock 会话内存态 + localStorage 双保险）。

---

## Task 1: AI 中转站 —— 锁定态（真实复刻）+ 状态查询

**Files:**
- Create: `src/api/ai.ts`、`src/features/ai/AiPage.tsx`
- Modify: `src/mocks/handlers.ts`、`src/routes.tsx`、i18n（`ai.*`）
- Test: `tests/api/ai.test.ts`

**Interfaces:**
- Produces: `aiApi.getStatus(): Promise<{configured:boolean; enabled:boolean; unlocked:boolean; modelCount:number; remainingQuota:string|null}>`；`<AiPage />` 锁定态组件（解锁态 Task 2/3 挂入）。

**参考站实测（锁定态）**：h1「AI 中转站」逐字 + 副标题位「功能未开放」+ 锁定卡：「该功能暂未向你开放」+「你的账号未被授予『AI 中转站』权限。站长资源有限，该服务暂未全量开放。」+「如何解锁」说明 + 「前往捐献」链接 + 底部「功能标识：ai」。

- [ ] **Step 1: 失败测试**

```ts
// tests/api/ai.test.ts
import { beforeEach, describe, expect, it } from "vitest"
import { aiApi } from "@/api/ai"
import { loginAsMockUser } from "../helpers/session"

describe("aiApi status", () => {
  beforeEach(() => loginAsMockUser())

  it("reports locked state for a user without permission", async () => {
    const s = await aiApi.getStatus()
    expect(s.unlocked).toBe(false)
    expect(s.enabled).toBe(true)
  })
})
```

- [ ] **Step 2: 跑 RED**（模块不存在）
- [ ] **Step 3: 实现 api + mock**（`/ai/status`；mock 用户默认未解锁——mockUser 增 `aiUnlocked: false` 字段；管理员角色则 true）
- [ ] **Step 4: AiPage 锁定态**（按参考站结构，`<PageHeader title subtitle={功能未开放}>` + 锁定卡 + 前往捐献）；路由接线
- [ ] **Step 5: 测试+构建双验证 → 登记 → 提交推送**

---

## Task 2: AI 解锁/绑定流（activate）

**Files:**
- Modify: `src/api/ai.ts`、`src/mocks/handlers.ts`、`src/features/ai/AiPage.tsx`
- Test: `tests/api/ai.test.ts`（追加）

**Interfaces:**
- Produces: `aiApi.checkAccount(): Promise<{accountExists:boolean}>`、`aiApi.bind(password:string): Promise<{unlocked:true}>`（密码为登录密码，校验后同步为中转站密码——mock 直接解锁）。

**参考站实测 + i18n 推导（ai.activate.*）**：锁定卡上「如何解锁」区含贡献入口；解锁流 = 检查中转站账号 → 输入登录密码绑定 → 解锁。参考站锁定态只显示捐献入口（绑定流在解锁后首次进入时出现）——**裁决：mock 用户直接以「密码绑定」作为解锁方式**（对应原站「用 Doulor Cloud 账号登录中转站」简化），锁定态保持参考站原样（只有捐献入口），绑定流在 Task 5 捐献审核通过后自动触发解锁时使用。

- [ ] **Step 1: 失败测试**

```ts
it("bind with wrong password is rejected", async () => {
  await expect(aiApi.bind("wrong-pass")).rejects.toMatchObject({ code: "AI_PASSWORD_MISMATCH" })
})
it("bind with the login password unlocks", async () => {
  await expect(aiApi.bind("password123")).resolves.toMatchObject({ unlocked: true })
  const s = await aiApi.getStatus()
  expect(s.unlocked).toBe(true)
})
```

- [ ] **Step 2: RED → Step 3: api+mock（`/ai/bind`；密码校验对 mock 登录密码 `password123`）→ Step 4: 页面接线（捐献成功后或直接在锁定卡提供「密码绑定解锁」次入口，主路径仍是捐献）**
- [ ] **Step 5: 双验证 → 登记（`AI_PASSWORD_MISMATCH` 错误码）→ 提交推送**

---

## Task 3: AI 已解锁界面（接入信息 / Key 管理 / 模型列表 / 额度订阅）

**Files:**
- Modify: `src/api/ai.ts`、`src/mocks/handlers.ts`、`src/features/ai/AiPage.tsx`（解锁态分支）
- Test: `tests/api/ai.test.ts`（追加）、`tests/components/ai-page.test.tsx`

**Interfaces:**
- Produces: `aiApi.listKeys(): Promise<{keys: Array<{id,name,group,createdAt,skPrefix}>}>`、`aiApi.createKey(name): Promise<{key:string}>`（**明文只显示一次**）、`aiApi.deleteKey(id)`、`aiApi.listModels(): Promise<{models: Array<{name,tag}>, recommended: string[]}>`、`aiApi.listSubscriptions(): Promise<{free:{remaining:string,total:string,nextResetAt},rewards:Array<{title,remaining,nextResetAt}>}>`。

**结构（i18n ai.* 命名空间推导 + api.md 契约；参考站解锁态未能实测——该账号未解锁，标注「按原站语义复刻」）**：三段式 = 接入信息（Base URL 可复制 + Key 管理【列表/新建（明文一次性）/删除】）+ 免费订阅卡（今日剩余/领取按钮/规则说明）+ 其他订阅卡 + 模型列表（分档推荐 + 点击复制模型名）+ 钱包余额。

- [ ] **Step 1: 失败测试**（listKeys/createKey 明文一次性/listModels/listSubscriptions 各 1 例；createKey 后 listKeys 含新 Key 的 skPrefix）
- [ ] **Step 2: RED → Step 3: api+mock（`/dev/key(s)`、`/dev/subscribe`、`/proxy/latency` 等按 docs/api.md §5.2 对齐；mock 返回 Base URL `https://ai.xueia.com/v1`）**
- [ ] **Step 4: AiPage 解锁态分支**（`unlocked ? <解锁界面> : <锁定态>`）；Base URL/模型名复制带失败回退
- [ ] **Step 5: 双验证 → 登记 → 提交推送**

---

## Task 4: 捐献页（概览 / 资源卡 / 贡献对话框）

**Files:**
- Create: `src/api/donations.ts`、`src/features/donations/DonationsPage.tsx`
- Modify: `src/mocks/handlers.ts`、`src/routes.tsx`、i18n（`don.*`）
- Test: `tests/api/donations.test.ts`

**Interfaces:**
- Produces: `donationsApi.list(): Promise<{types: Array<{key,label,desc,unlocked,grantsPermission}>; records: Array<{id,type,status,submittedAt,reviewNote?}>}>`、`donationsApi.submit(type, payload)`（Review Focus #5：格式前置校验 + 重复提交提示）。

**参考站实测（完整）**：页内子导航（回到控制台/概览/邀请 + 分组「捐献资源」：AI 模型/内网穿透/代理节点）+ 概览面板（「资源有限，按需开放」+ 首次捐献送「自选权限」兑换码说明）+ 资源卡三类（名称+未解锁徽章+描述+「贡献」按钮）+ 兑换码区（Task 6）+ 邀请入口（Task 5）。

- [ ] **Step 1: 失败测试**

```ts
// tests/api/donations.test.ts（节选）
import { beforeEach, describe, expect, it } from "vitest"
import { donationsApi } from "@/api/donations"
import { loginAsMockUser } from "../helpers/session"

describe("donationsApi", () => {
  beforeEach(() => loginAsMockUser())

  it("lists three resource types, all locked by default", async () => {
    const r = await donationsApi.list()
    expect(r.types.map((t) => t.key)).toEqual(["ai", "frp", "proxy"])
    expect(r.types.every((t) => !t.unlocked)).toBe(true)
  })

  it("rejects a malformed proxy subscription link before submit", async () => {
    await expect(donationsApi.submit("proxy", { link: "not-a-url" })).rejects.toMatchObject({ code: "DON_FORMAT_INVALID" })
  })

  it("submits a valid proxy link and records it as pending", async () => {
    await donationsApi.submit("proxy", { link: "https://sub.example.com/clash" })
    const r = await donationsApi.list()
    expect(r.records[0]?.status).toBe("pending")
  })
})
```

- [ ] **Step 2: RED → Step 3: api+mock（`/donations`(+`/ai/probe`)；重复提交同一 type+link 返回 `DON_DUPLICATE`）**
- [ ] **Step 4: DonationsPage**（子导航 + 概览 + 三资源卡 + 贡献对话框【按类型出表单：AI 模型=渠道格式选择(自动识别/OpenAI 兼容/Anthropic 原生)+Base URL+Key；FRP=config.yml 文本域；代理=订阅链接】+ 提交后记录列表【状态徽章：待审核/已通过/未通过/已失效】）
- [ ] **Step 5: 双验证 → 登记（`DON_FORMAT_INVALID`/`DON_DUPLICATE`）→ 提交推送**

---

## Task 5: 邀请分区（我的邀请码 / 创建 / 奖励记录 / 补填）

**Files:**
- Create: `src/features/donations/InviteSection.tsx`
- Modify: `src/api/donations.ts`、`src/mocks/handlers.ts`、`src/features/donations/DonationsPage.tsx`
- Test: `tests/api/donations.test.ts`（追加）

**Interfaces:**
- Produces: `donationsApi.listInvites(): Promise<{codes: Array<{code,uses,max,createdAt}>; rewards: Array<{invited,subscription,daily,at}>}>`、`donationsApi.createInvite(): Promise<{code}>`、`donationsApi.claimCode(code): Promise<{ok, rewarded?}>`（注册后 7 天内一次，`DON_CLAIM_USED` 否则）。

**参考站实测**：「兑换码」区说明（邀请码和兑换码同物：发给别人或自己用）+ 「用别人的码」表单（码输入 + 模块选择 combobox + 兑换按钮）+ 「邀请好友」区（前往邀请按钮）。

- [ ] **Step 1: 失败测试**（listInvites 形状/createInvite 生成 `VX-XXXX-XXXX` 形码/claimCode 有效与 7 天外各 1 例）
- [ ] **Step 2: RED → Step 3: api+mock（`/my-invites`(+`/claim`)）**
- [ ] **Step 4: InviteSection**（我的码列表 + 创建按钮 + 奖励记录 + 补填表单）挂入 DonationsPage 的「邀请」分区
- [ ] **Step 5: 双验证 → 登记 → 提交推送**

---

## Task 6: 兑换码（用别人的码 / 自选模块）

**Files:**
- Modify: `src/api/donations.ts`（redeem）、`src/mocks/handlers.ts`、`src/features/donations/DonationsPage.tsx`（兑换码区接真实接口）
- Test: `tests/api/donations.test.ts`（追加）

**Interfaces:**
- Produces: `donationsApi.redeem(code, moduleKey?): Promise<{unlocked: string[]; skipped: string[]}>`（自选券必须选模块；普通码自动补缺，已有跳过——Review Focus #5）。

- [ ] **Step 1: 失败测试**（普通码补缺/自选券未选模块报 `DON_PICK_MODULE`/自选券选模块后解锁/无效码 `DON_CODE_INVALID`）
- [ ] **Step 2: RED → Step 3: api+mock（`/vouchers/redeem`）→ Step 4: 兑换码区接真实接口（combobox 模块选择 + 兑换按钮 + 结果提示）**
- [ ] **Step 5: 双验证 → 登记 → 提交推送**

---

## Task 7: 积分真实功能（签到 / 补签 / 兑换余额 / 转账 / 明细）

**Files:**
- Create: `src/api/points.ts`、`src/features/points/` 下接真实数据的改造
- Modify: `src/mocks/handlers.ts`、i18n（`pt.*`）
- Test: `tests/api/points.test.ts`

**Interfaces:**
- Produces: `pointsApi.status(): Promise<{balance:number; todayCheckedIn:boolean; makeupCards:number}>`、`pointsApi.checkin(): Promise<{reward:number; streak:number}>`、`pointsApi.makeup(): Promise<{reward:number}>`、`pointsApi.redeem(amount:number): Promise<{balance:number}>`（每日限 3 次，`POINTS_REDEEM_LIMIT`）、`pointsApi.transfer(to, amount)`（余额不足 `POINTS_INSUFFICIENT`——Review Focus #2）、`pointsApi.history(): Promise<{items: Array<{reason,amount,at}}>}`。

**参考站实测（页面结构已有）**：余额卡（刷新/签到工具栏 + 转账/我的订单/积分明细按钮）+ 兑换卡（1 积分=￥1，金额自填）+ 商品网格（已有占位）。

- [ ] **Step 1: 失败测试**（含 Review Focus #2 不可透支、#4 签到幂等：同日再签 `POINTS_ALREADY_CHECKED_IN`；补签卡不足 `POINTS_NO_MAKEUP_CARD`）
- [ ] **Step 2: RED → Step 3: api+mock（`/points`(+`/redeem`/`/transfer`)、`/checkin`(+`/auto`/`/makeup`)；mock 内存态记当日签到与余额）**
- [ ] **Step 4: 页面接线**（余额/签到按钮态【已签到/可签到】+ 补签卡计数 + 兑换卡真实提交【余额不足禁用】+ 转账对话框 + 明细对话框）
- [ ] **Step 5: 双验证 → 登记（`POINTS_*` 错误码族）→ 提交推送**

---

## Task 8: 商城真实功能（商品 / 购买 / 我的订单）

**Files:**
- Modify: `src/api/points.ts`（shop）、`src/mocks/handlers.ts`、`src/features/points/PointsPage.tsx`
- Test: `tests/api/points.test.ts`（追加）

**Interfaces:**
- Produces: `pointsApi.listProducts(): Promise<{products: Array<{id,name,desc,price,stock,delivery} }>}`、`pointsApi.buy(id): Promise<{orderId}>`（Review Focus #2）、`pointsApi.myOrders(): Promise<{orders: Array<{id,product,status,deliveryContent?}>}>`。

- [ ] **Step 1: 失败测试**（列表/购买扣积分且库存减/余额不足拒/订单列表含发货内容【code 类】）
- [ ] **Step 2: RED → Step 3: api+mock（`/points/products`(+`/shop/buy`)；delivery 类型沿用参考站语义：quota/feature/subscription/inviteQuota/code/content/manual）**
- [ ] **Step 4: 页面接线**（商品卡真实数据 + 购买对话框【余额检查】+ 我的订单抽屉【状态徽章 + 卡密类复制发货内容】）
- [ ] **Step 5: 双验证 → 登记 → 提交推送**

---

## Task 9: 公告 + 强制确认弹窗

**Files:**
- Create: `src/api/announcements.ts`、`src/features/announcements/NoticeGate.tsx`
- Modify: `src/mocks/handlers.ts`、`src/AppRoutes` 挂载点（`main.tsx` 或 DashboardLayout）
- Test: `tests/components/notice-gate.test.tsx`

**Interfaces:**
- Produces: `announcementsApi.list(): Promise<{items: Array<{id,category,title,content,pinned,requireDonation,createdAt}>}>`、`announcementsApi.ack(id)`、`announcementsApi.pendingAck(): Promise<{required: Announcement | null}>`。
- `<NoticeGate />`：挂在控制台布局内；有 `requireDonation` 未确认公告时弹**不可关闭**的 Dialog（Review Focus #3：未捐献隐藏关闭按钮 + 拦截导航）；普通公告确认后 localStorage 记忆（`xueia-ack-<id>`）同会话不再弹。

**参考站实测（登录即弹投票公告 dialog，标题+全文+操作按钮；noticeAck.* 文案：pill/confirm/remaining/recheck/donationHint/donationMissing/needDonation）**。

- [ ] **Step 1: 失败测试**（含 Review Focus #3：requireDonation 公告无关闭按钮；确认后不再弹；普通公告确认后 localStorage 记忆）
- [ ] **Step 2: RED → Step 3: api+mock（`/announcements`、`/notice/pending`、`/notice/ack`；mock 一条 requireDonation 公告 + 一条普通公告）**
- [ ] **Step 4: NoticeGate 实现 + 挂载；公告数据同时供概览页「网站动态」卡使用（同一 api）**
- [ ] **Step 5: 双验证 → 登记 → 提交推送**

---

## Task 10: E2E 扩展 + 文档收尾

**Files:**
- Create: `tests/e2e/batch3.spec.ts`
- Modify: `docs/api.md`（核对全部批次③条目 🟡）、`AGENTS.md`（进度日志）

**E2E 用例**（页内导航，mock 会话特性）：
1. AI 页锁定态：未解锁显示「前往捐献」，无管理界面元素
2. 捐献页：三资源卡 + 提交一个代理订阅 → 记录出现「待审核」
3. 积分：签到 → 余额增加 + 按钮变已签到；再签报错提示
4. 强制确认弹窗：requireDonation 公告不可关闭；确认（mock 已捐献态）后消失
5. 商城：购买一个商品 → 订单出现

- [ ] **Step 1: 写 E2E → Step 2: Windows 跑（`npm run e2e`）全绿**
- [ ] **Step 3: 文档同步（api.md 全量核对 + AGENTS 进度日志）**
- [ ] **Step 4: 双验证（测试+构建）→ 提交推送**

## 自检记录

- Spec 覆盖：批次③四项（AI/捐献邀请/积分商城/公告确认）均有任务。
- Review Focus 落点：#1→Task 1/2；#2→Task 7/8；#3→Task 9；#4→Task 7；#5→Task 4/6；#6→Task 9。
- 已知限制（计划期裁决）：AI 解锁态界面按原站 i18n 语义复刻（参考站该账号未解锁，无法实测）；绑定流简化为密码绑定（对应原站「复用 Doulor Cloud 密码」）。
