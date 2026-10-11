/**
 * 品牌单一来源：站名/域名/邮箱后缀/社交链接全站只允许从这里引用。
 * 换品牌只改这一个文件。
 */
export const brand = {
  /** 短名（导航/Logo 文字） */
  name: "Xueia",
  /** 全名（开屏/标题/PWA） */
  fullName: "Xueia Cloud",
  /** 主域名 */
  domain: "xueia.com",
  /** 域名邮箱后缀（可配置项，2026-10-07 拍板不写死） */
  emailDomain: "xueia.com",
  /** 站点描述 */
  description: "邮箱、临时分享箱、AI 中转站、社区，一个账号开箱即用。",
  /** 联系方式（占位，待真实素材） */
  contact: {
    qqGroup: "000-000-000", // TODO: 真实 QQ 群号
    telegram: "@xueiacloud", // TODO: 真实 TG
  },
  /** 法律页更新时间 */
  legalUpdatedAt: "2026-10-07",
} as const

export type Brand = typeof brand
