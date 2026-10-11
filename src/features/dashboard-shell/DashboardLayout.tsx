import { useState } from "react"
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router"
import {
  AtSign,
  Bell,
  Bot,
  Cloud,
  Globe,
  IdCard,
  Inbox,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
  Moon,
  Network,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Sun,
  Trophy,
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
    const from = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?from=${from}`} replace />
  }
  return <Outlet />
}

/** 侧栏导航分组（对齐原站信息架构，去掉域名/网盘） */
const NAV_GROUPS: Array<{ title?: string; items: Array<{ to: string; icon: React.ElementType; key: string }> }> = [
  {
    items: [{ to: "/dashboard", icon: LayoutDashboard, key: "nav.overview" }],
  },
  {
    title: "nav.email",
    items: [
      { to: "/dashboard/email", icon: Inbox, key: "nav.email" },
      { to: "/dashboard/tempbox", icon: Package, key: "nav.tempbox" },
    ],
  },
  {
    title: "nav.ai",
    items: [
      { to: "/dashboard/ai", icon: Bot, key: "nav.ai" },
      { to: "/dashboard/frp", icon: Network, key: "nav.frp" },
      { to: "/dashboard/proxy", icon: Globe, key: "nav.proxy" },
    ],
  },
  {
    title: "nav.community",
    items: [
      { to: "/dashboard/community", icon: Users, key: "nav.community" },
      { to: "/dashboard/chat", icon: MessagesSquare, key: "nav.chat" },
      { to: "/dashboard/dm", icon: MessageCircle, key: "nav.dm" },
      { to: "/dashboard/messages", icon: Bell, key: "nav.messages" },
    ],
  },
  {
    title: "nav.points",
    items: [
      { to: "/dashboard/points", icon: ShoppingCart, key: "nav.points" },
      { to: "/dashboard/leaderboard", icon: Trophy, key: "nav.leaderboard" },
      { to: "/dashboard/achievements", icon: Trophy, key: "nav.achievements" },
      { to: "/dashboard/donations", icon: AtSign, key: "nav.donations" },
    ],
  },
  {
    title: "nav.space",
    items: [
      { to: "/dashboard/profile", icon: IdCard, key: "nav.profile" },
      { to: "/dashboard/toolbox", icon: Package, key: "nav.toolbox" },
      { to: "/dashboard/feedback", icon: MessageCircle, key: "nav.feedback" },
      { to: "/dashboard/settings", icon: IdCard, key: "nav.settings" },
    ],
  },
]

// 占位说明已并入顶部 import，无底部 import。

function NavItem({ to, icon: Icon, label, collapsed }: { to: string; icon: React.ElementType; label: string; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed && "justify-center px-2",
          isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

/** 玻璃拟态侧栏（可折叠 + 移动端抽屉） */
function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { t } = useT()
  return (
    <aside
      className={cn(
        "glass-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <Link to="/" className="flex h-14 items-center gap-2 border-b px-4 font-bold">
        <Cloud className="size-6 shrink-0" />
        {!collapsed && <span className="truncate">{brand.name}</span>}
      </Link>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.title && !collapsed && (
              <p className="px-3 pt-2 text-xs font-medium text-muted-foreground">{t(group.title)}</p>
            )}
            {group.items.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.key)} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/** 顶栏：移动端菜单 + 双铃铛（站内消息/私信，mock 未读数）+ 语言 + 主题 + 用户菜单 */
function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { t, lang, setLang } = useT()
  const { data: user } = useMe()
  const clearMe = useClearMe()
  const [, setThemeTick] = useState(0)

  const unreadMessages = 2
  const unreadDm = 1

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
      <Button variant="ghost" size="icon" className="relative" onClick={() => (window.location.hash = "")} asChild>
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
        {user && <BellIcon count={unreadMessages} to="/dashboard/messages" label={t("nav.messages")} />}
        {user && <BellIcon count={unreadDm} to="/dashboard/dm" label={t("nav.dm")} />}

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

/** 控制台布局：侧栏 + 顶栏 + 移动端抽屉 + Outlet */
export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useT()

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-16 left-1 z-40 hidden rounded-full border bg-card md:inline-flex"
        onClick={() => setCollapsed((c) => !c)}
        aria-label="toggle sidebar"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </Button>

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
              {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
                <NavItem key={item.to} to={item.to} icon={item.icon} label={t(item.key)} collapsed={false} />
              ))}
            </nav>
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
