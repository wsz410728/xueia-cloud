import { useState } from "react"
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router"
import {
  Bell,
  Bot,
  Cloud,
  Coins,
  Globe,
  IdCard,
  Inbox,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  Package,
  Settings,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getStoredTheme, setTheme, type ThemeSetting } from "@/lib/theme"
import { authApi } from "@/api/auth"
import { DASHBOARD_GUEST_WHITELIST } from "@/config/guards"
import { useClearMe, useMe } from "./use-me"

/** 守卫：/dashboard/* 整组 requiresAuth；未登录跳 /login?from=…（白名单例外由路由表控制，见 routes.tsx） */
export function RequireAuth() {
  const { data: user, isLoading } = useMe()
  const location = useLocation()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Cloud className="mr-2 size-5 animate-pulse" />
        …
      </div>
    )
  }
  if (!user) {
    // 白名单例外：公开可看的子路由放行（页面自身处理「交互需登录」）
    const isGuestOk = DASHBOARD_GUEST_WHITELIST.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/")
    )
    if (isGuestOk) return <Outlet />
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?from=${from}`} replace />
  }
  return <Outlet />
}

/** 侧栏主导航（平铺，对齐参考站信息架构；域名/网盘已裁剪，含创想造物） */
const NAV_MAIN: Array<{ to: string; icon: React.ElementType; key: string }> = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.overview" },
  { to: "/dashboard/email", icon: Inbox, key: "nav.email" },
  { to: "/dashboard/tempbox", icon: Package, key: "nav.tempbox" },
  { to: "/dashboard/ai", icon: Bot, key: "nav.ai" },
  { to: "/dashboard/frp", icon: Network, key: "nav.frp" },
  { to: "/dashboard/proxy", icon: Globe, key: "nav.proxy" },
  { to: "/dashboard/profile", icon: IdCard, key: "nav.profile" },
  { to: "/dashboard/community", icon: Users, key: "nav.community" },
  { to: "/dashboard/gallery", icon: Sparkles, key: "nav.gallery" },
  { to: "/dashboard/toolbox", icon: Package, key: "nav.toolbox" },
]

/** 侧栏底部独立项（参考站同款：反馈/捐献/积分/设置） */
const NAV_FOOTER: Array<{ to: string; key: string }> = [
  { to: "/dashboard/feedback", key: "nav.feedback" },
  { to: "/dashboard/donations", key: "nav.donations" },
  { to: "/dashboard/points", key: "nav.points" },
  { to: "/dashboard/settings", key: "nav.settings" },
]

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

/** 底部用户块（参考站同款：头像角色环 + 昵称 + 邮箱 + 账户菜单） */
function UserBlock() {
  const { t } = useT()
  const { data: user } = useMe()
  const clearMe = useClearMe()
  if (!user) return null

  async function onLogout() {
    try {
      await authApi.logout()
    } finally {
      clearMe()
      window.location.assign("/")
    }
  }

  return (
    <div className="flex items-center gap-2.5 border-t p-3">
      <Link
        to={`/u/${user.username}`}
        className={cn("shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", user.role === "admin" && "role-ring role-ring-admin", user.role === "super" && "role-ring role-ring-super")}
        aria-label={t("nav.space")}
      >
        <Avatar className="size-9">
          <AvatarFallback>{(user.nickname ?? user.username).slice(0, 2)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.nickname ?? user.username}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("nav.settings")}>
            <Settings className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild><Link to="/dashboard/settings">{t("nav.settings")}</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to={`/u/${user.username}`}>{t("nav.space")}</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}><LogOut className="size-4" />{t("nav.logout")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** 玻璃拟态侧栏：固定 240px 宽，对齐参考站（参考站侧栏无折叠功能） */
function Sidebar() {
  const { t } = useT()
  return (
    <aside className="glass-sidebar sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex">
      <Link to="/" className="flex h-14 items-center gap-2 border-b px-4 font-bold">
        <Cloud className="size-6 shrink-0" />
        <span className="truncate">{brand.name}</span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_MAIN.map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.key)} />
        ))}
      </nav>
      <div className="space-y-1 border-t p-3">
        {NAV_FOOTER.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <span className="truncate">{t(item.key)}</span>
          </NavLink>
        ))}
      </div>
      <UserBlock />
    </aside>
  )
}

/** 顶栏：移动端菜单 + 积分 chip + 双铃铛（站内消息/私信，mock 未读数）+ 语言 + 主题 + 用户菜单（对齐参考站） */
function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { t, lang, setLang } = useT()
  const { data: user } = useMe()
  const clearMe = useClearMe()
  const [, setThemeTick] = useState(0)

  const unreadMessages = 7
  const unreadDm = 2

  async function onLogout() {
    try {
      await authApi.logout()
    } finally {
      clearMe()
      window.location.assign("/")
    }
  }

  function BellIcon({ count, to, label }: { count: number; to: string; label: string }) {
    return (
      <Button variant="ghost" size="icon" className="relative" asChild>
        <Link to={to} aria-label={label}>
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      </Button>
    )
  }

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobile} aria-label="menu">
          <Menu className="size-4" />
        </Button>
        <span className="font-semibold">{brand.fullName}</span>
      </div>

      <div className="flex items-center gap-1">
        {user && (
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link to="/dashboard/points" aria-label={t("dash.points.chip")}>
              <Coins className="size-4" />
              <span className="text-xs tabular-nums">128</span>
            </Link>
          </Button>
        )}
        {user && <BellIcon count={unreadDm} to="/dashboard/dm" label={t("nav.dm")} />}
        {user && <BellIcon count={unreadMessages} to="/dashboard/messages" label={t("nav.messages")} />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("nav.language")}>
              <Languages className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLang("zh")}>简体中文 {lang === "zh" && "✓"}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang("en")}>English {lang === "en" && "✓"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="theme" onClick={() => setThemeTick((x) => x + 1)}>
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["light", "dark", "system"] as ThemeSetting[]).map((v) => (
              <DropdownMenuItem key={v} onClick={() => setTheme(v)}>
                {t(`th.${v}`)}
                {getStoredTheme() === v && " ✓"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn("ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", user.role === "admin" && "role-ring role-ring-admin", user.role === "super" && "role-ring role-ring-super")}
                aria-label="account"
              >
                <Avatar className="size-9">
                  <AvatarFallback>{(user.nickname ?? user.username).slice(0, 2)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="font-medium">{user.nickname ?? user.username}</p>
                <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">{t("nav.settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/u/${user.username}`}>{t("nav.space")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="size-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

/** 控制台布局：固定侧栏 + 顶栏 + 移动端抽屉 + Outlet */
export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useT()

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="glass-sidebar absolute inset-y-0 left-0 flex w-64 flex-col border-r">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="flex items-center gap-2 font-bold">
                <Cloud className="size-5" />
                {brand.name}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="close">
                <X className="size-4" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_MAIN.map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.key)} />
              ))}
            </nav>
            <div className="space-y-1 border-t p-3">
              {NAV_FOOTER.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="truncate">{t(item.key)}</span>
                </NavLink>
              ))}
            </div>
            <UserBlock />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="page-enter flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
