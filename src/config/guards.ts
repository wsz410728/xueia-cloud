/**
 * 守卫白名单：这些 /dashboard 子路由**游客可访问**（内容公开可看，交互才需登录）。
 * 由 RequireAuth 消费；注意 /dashboard/tempbox 是分享端，**需要登录**，不在白名单。
 * 独立模块：routes.tsx 与 DashboardLayout.tsx 都要引用，放这里避免循环依赖。
 */
export const DASHBOARD_GUEST_WHITELIST = [
  "/dashboard/community",
  "/dashboard/gallery",
  "/dashboard/events",
] as const
