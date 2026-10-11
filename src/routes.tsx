import { BrowserRouter, Route, Routes } from "react-router"
import { LandingPage } from "@/features/landing/LandingPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage"
import { DashboardLayout, RequireAuth } from "@/features/dashboard-shell/DashboardLayout"
import { OverviewPage } from "@/features/overview/OverviewPage"
import { MailboxPage } from "@/features/mailbox/MailboxPage"
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage"
import { NotFoundPage } from "@/features/placeholder/NotFoundPage"

/** 守卫白名单例外：这些 /dashboard 子路由游客可访问（原站实测设计；页面本身仍属后续批次） */
export const DASHBOARD_GUEST_WHITELIST = ["/dashboard/tempbox", "/dashboard/community", "/dashboard/events"]

/** 全量路由表（未实施模块 = 「建设中」占位，批次地图见设计文档 §9） */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公共 */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<PlaceholderPage />} />
        <Route path="/privacy" element={<PlaceholderPage />} />
        <Route path="/u/:username" element={<PlaceholderPage />} />
        <Route path="/tempbox" element={<PlaceholderPage />} />
        <Route path="/appeal" element={<PlaceholderPage />} />

        {/* 控制台：requiresAuth（白名单例外暂未接入独立页面，批次②③④实现时挂白名单） */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            {/* 实施中：邮箱（加料演示） */}
            <Route path="email" element={<MailboxPage />} />
            {/* 占位：后续批次 */}
            <Route path="tempbox" element={<PlaceholderPage moduleKey="nav.tempbox" />} />
            <Route path="settings" element={<PlaceholderPage moduleKey="nav.settings" />} />
            <Route path="ai" element={<PlaceholderPage moduleKey="nav.ai" />} />
            <Route path="frp" element={<PlaceholderPage moduleKey="nav.frp" />} />
            <Route path="proxy" element={<PlaceholderPage moduleKey="nav.proxy" />} />
            <Route path="profile" element={<PlaceholderPage moduleKey="nav.profile" />} />
            <Route path="space" element={<PlaceholderPage moduleKey="nav.space" />} />
            <Route path="community" element={<PlaceholderPage moduleKey="nav.community" />} />
            <Route path="chat" element={<PlaceholderPage moduleKey="nav.chat" />} />
            <Route path="dm" element={<PlaceholderPage moduleKey="nav.dm" />} />
            <Route path="messages" element={<PlaceholderPage moduleKey="nav.messages" />} />
            <Route path="points" element={<PlaceholderPage moduleKey="nav.points" />} />
            <Route path="leaderboard" element={<PlaceholderPage moduleKey="nav.leaderboard" />} />
            <Route path="achievements" element={<PlaceholderPage moduleKey="nav.achievements" />} />
            <Route path="donations" element={<PlaceholderPage moduleKey="nav.donations" />} />
            <Route path="toolbox" element={<PlaceholderPage moduleKey="nav.toolbox" />} />
            <Route path="feedback" element={<PlaceholderPage moduleKey="nav.feedback" />} />
            <Route path="events/:id" element={<PlaceholderPage />} />
            <Route path="apiset" element={<PlaceholderPage />} />
            <Route path="oauth" element={<PlaceholderPage />} />
            <Route path="admin" element={<PlaceholderPage moduleKey="nav.admin" />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
