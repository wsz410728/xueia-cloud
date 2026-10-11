import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

// 双平台（Windows 开发 / WSL 测试）共用一份 node_modules：
// esbuild/rollup/tailwind-oxide 的 win32+linux 原生二进制都在 devDependencies 里。
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true, // WSL 测试时 Windows 浏览器也能访问
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "vendor-icons"
            if (
              id.includes("@radix-ui") ||
              id.includes("class-variance-authority") ||
              id.includes("sonner") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge")
            ) {
              return "vendor-ui"
            }
            if (id.includes("@tanstack")) return "vendor-query"
            if (/react(-dom|-router)?[/.]|\/react\/|scheduler/.test(id)) return "vendor-react"
          }
          if (id.includes("/src/api/") || id.includes("api-client")) return "api"
          if (id.includes("/src/i18n/")) return "i18n"
          return undefined
        },
      },
    },
  },
})
