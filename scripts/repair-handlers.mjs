import { readFileSync, writeFileSync } from "node:fs"
const p = "src/mocks/handlers.ts"
let s = readFileSync(p, "utf8")

// 1) 移除误插入 authHandlers 内部的损坏块（模板字面量已被破坏）
const damaged = `  http.get(, () => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    // mock：中转站账号在本站登录后即存在
    return ok({ accountExists: true })
  }),

  http.post(, async ({ request }) => {
    if (!session.user) return fail(401, "AUTH_REQUIRED", "未登录")
    const { password } = (await request.json()) as { password: string }
    // mock：绑定密码 = 本站登录密码（原站语义：两边共用同一密码）
    if (password !== "password123") return fail(400, "AI_PASSWORD_MISMATCH", "密码与本站登录密码不一致")
    session.user.aiUnlocked = true
    return ok({ unlocked: true })
  }),
`
if (!s.includes(damaged)) throw new Error("damaged block not found — 文件结构已变，需人工查看")
s = s.replace(damaged, "")

// 2) 正确插入到 aiHandlers 末尾（锚定 ai/status 处理器的收尾，唯一）
const anchor = `      baseUrl: unlocked ? "https://ai.xueia.com/v1" : null,
    })
  }),
]`
if (!s.includes(anchor)) throw new Error("aiHandlers anchor not found")

const insert = [
  "      baseUrl: unlocked ? \"https://ai.xueia.com/v1\" : null,",
  "    })",
  "  }),",
  "",
  "  http.get(`${API}/ai/account`, () => {",
  "    if (!session.user) return fail(401, \"AUTH_REQUIRED\", \"未登录\")",
  "    // mock：中转站账号在本站登录后即存在",
  "    return ok({ accountExists: true })",
  "  }),",
  "",
  "  http.post(`${API}/ai/bind`, async ({ request }) => {",
  "    if (!session.user) return fail(401, \"AUTH_REQUIRED\", \"未登录\")",
  "    const { password } = (await request.json()) as { password: string }",
  "    // mock：绑定密码 = 本站登录密码（原站语义：两边共用同一密码）",
  "    if (password !== \"password123\") return fail(400, \"AI_PASSWORD_MISMATCH\", \"密码与本站登录密码不一致\")",
  "    session.user.aiUnlocked = true",
  "    return ok({ unlocked: true })",
  "  }),",
  "]",
].join("\n")

s = s.replace(anchor, insert)
writeFileSync(p, s, "utf8")
console.log("repaired + inserted correctly")
