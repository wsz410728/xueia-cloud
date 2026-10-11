import { BrowserRouter, Route, Routes } from "react-router"
import { LandingPage } from "@/features/landing/LandingPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage"
import { DashboardLayout, RequireAuth } from "@/features/dashboard-shell/DashboardLayout"
import { OverviewPage } from "@/features/overview/OverviewPage"
import { MailboxPage } from "@/features/mailbox/MailboxPage"
import { GalleryPage } from "@/features/gallery/GalleryPage"
import { LeaderboardPage, AchievementsPage } from "@/features/leaderboard/LeaderboardPage"
import { PointsPage } from "@/features/points/PointsPage"
import { SectionPlaceholder } from "@/features/placeholder/SectionPlaceholder"
import { SettingsPage } from "@/features/settings/SettingsPage"
import { ShareBoxPage } from "@/features/tempbox/ShareBoxPage"
import { PickupPage } from "@/features/tempbox/PickupPage"
import { AppealPage } from "@/features/appeal/AppealPage"
import { PlaceholderPage } from "@/features/placeholder/PlaceholderPage"
import { NotFoundPage } from "@/features/placeholder/NotFoundPage"

/** 守卫白名单例外：这些 /dashboard 子路由游客可访问（页面实现后接入，见 AGENTS.md §3.4） */
export const DASHBOARD_GUEST_WHITELIST = ["/dashboard/tempbox", "/dashboard/community", "/dashboard/events", "/dashboard/gallery"]

/** 全量路由表（批次地图见设计文档 §9；未实施模块 = 对齐参考站风格的占位骨架） */
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
        <Route path="/tempbox" element={<PickupPage />} />
        <Route path="/appeal" element={<AppealPage />} />

        {/* 控制台：requiresAuth */}
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="email" element={<MailboxPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="points" element={<PointsPage />} />
            {/* 已建骨架，待批次实现 */}
            <Route path="tempbox" element={<ShareBoxPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="ai" element={<SectionPlaceholder titleKey="nav.ai" subtitleKey="ai.subtitle" batch="③" />} />
            <Route path="donations" element={<SectionPlaceholder titleKey="nav.donations" subtitleKey="don.subtitle" batch="③" />} />
            <Route path="community" element={<SectionPlaceholder titleKey="nav.community" subtitleKey="cm.subtitle" batch="④" />} />
            <Route path="chat" element={<SectionPlaceholder titleKey="nav.chat" subtitleKey="chat.subtitle" batch="④" />} />
            <Route path="dm" element={<SectionPlaceholder titleKey="nav.dm" subtitleKey="dm.subtitle" batch="④" />} />
            <Route path="messages" element={<SectionPlaceholder titleKey="nav.messages" subtitleKey="msg.subtitle" batch="④" />} />
            <Route path="profile" element={<SectionPlaceholder titleKey="nav.profile" subtitleKey="pf.subtitle" batch="④" />} />
            <Route path="space" element={<SectionPlaceholder titleKey="nav.space" subtitleKey="space.subtitle" batch="④" />} />
            <Route path="feedback" element={<SectionPlaceholder titleKey="nav.feedback" subtitleKey="fb.subtitle" batch="④" />} />
            <Route path="events/:id" element={<PlaceholderPage />} />
            <Route path="frp" element={<SectionPlaceholder titleKey="nav.frp" subtitleKey="frp.subtitle" batch="⑤" />} />
            <Route path="proxy" element={<SectionPlaceholder titleKey="nav.proxy" subtitleKey="px.subtitle" batch="⑤" />} />
            <Route path="toolbox" element={<SectionPlaceholder titleKey="nav.toolbox" subtitleKey="toolbox.subtitle" batch="⑤" />} />
            <Route path="apiset" element={<SectionPlaceholder titleKey="nav.apiset" subtitleKey="apiset.subtitle" batch="⑥" />} />
            <Route path="oauth" element={<SectionPlaceholder titleKey="nav.oauth" subtitleKey="oapp.subtitle" batch="⑥" />} />
            <Route path="admin" element={<SectionPlaceholder titleKey="nav.admin" subtitleKey="admin.subtitle" batch="⑥" />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
