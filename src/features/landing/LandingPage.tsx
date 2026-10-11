import { Link } from "react-router"
import {
  AtSign,
  Bot,
  Cloud,
  Globe,
  IdCard,
  Inbox,
  Languages,
  Menu,
  MessagesSquare,
  Moon,
  Network,
  Package,
  ShoppingCart,
  Sun,
  X,
} from "lucide-react"
import { useT } from "@/i18n"
import { brand } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setTheme, type ThemeSetting } from "@/lib/theme"
import { useState } from "react"
import { useMe } from "@/features/dashboard-shell/use-me"

/** 顶部导航（毛玻璃 sticky）+ 主题/语言切换 + 登录态感知 */
function LandingNav() {
  const { t, lang, setLang } = useT()
  const { data: user } = useMe()
  const [open, setOpen] = useState(false)

  const links: Array<[string, string]> = [
    ["#features", "nav.features"],
    ["#how", "nav.how"],
    ["#updates", "nav.updates"],
    ["#download", "nav.download"],
    ["#faq", "nav.faq"],
    ["#contact", "nav.contact"],
  ]

  return (
    <header className="glass-panel sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Cloud className="size-6" />
          <span>{brand.name}</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            {t("logo.tagline")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {links.map(([href, key]) => (
            <a key={href} href={href} className="transition-colors hover:text-foreground">
              {t(key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {/* 主题切换 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.language")}>
                <Sun className="size-4 dark:hidden" />
                <Moon className="hidden size-4 dark:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["light", "dark", "system"] as ThemeSetting[]).map((v) => (
                <DropdownMenuItem key={v} onClick={() => setTheme(v)}>
                  {v === "light" && <Sun className="size-4" />}
                  {v === "dark" && <Moon className="size-4" />}
                  {v === "system" && <Languages className="size-4" />}
                  {t(`th.${v}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 语言切换 */}
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

          {user ? (
            <Button asChild size="sm" className="ml-2">
              <Link to="/dashboard">
                {t("nav.enterDashboard")}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="ml-1">
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </>
          )}

          {/* 移动端菜单 */}
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="menu" onClick={() => setOpen(!open)}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2">
            {links.map(([href, key]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="py-2 text-sm text-muted-foreground">
                {t(key)}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

/** Hero */
function Hero() {
  const { t } = useT()
  const { data: user } = useMe()
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-20 pb-16 text-center lg:px-8">
      <Badge variant="secondary" className="mb-6 data-fade">
        <Cloud className="size-3" />
        {t("landing.heroBadge")}
      </Badge>
      <h1 className="heading-xl page-enter">
        {t("landing.heroLine1")}
        <br />
        {t("landing.heroLine2")}
      </h1>
      <p className="mt-6 max-w-2xl text-balance text-muted-foreground">{t("landing.heroSub")}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <Button asChild size="lg">
            <Link to="/dashboard">{t("nav.enterDashboard")}</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link to="/register">{t("landing.signUp")}</Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <a href="#features">{t("landing.getStarted")}</a>
        </Button>
      </div>
    </section>
  )
}

/** 九大能力卡 */
const FEATURES: Array<{ icon: React.ElementType; key: string; free: boolean }> = [
  { icon: AtSign, key: "f1", free: true },
  { icon: Inbox, key: "f2", free: true },
  { icon: Package, key: "f3", free: true },
  { icon: IdCard, key: "f4", free: true },
  { icon: Bot, key: "f5", free: false },
  { icon: Network, key: "f6", free: false },
  { icon: Globe, key: "f7", free: false },
  { icon: MessagesSquare, key: "f8", free: true },
  { icon: ShoppingCart, key: "f9", free: true },
]

function Features() {
  const { t } = useT()
  return (
    <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-16 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl sm:text-4xl">{t("landing.featuresTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{t("landing.featuresSub")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, key, free }, i) => (
          <Card key={key} className="data-fade" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5" />
                </div>
                <Badge variant={free ? "success" : "secondary"}>
                  {free ? t("landing.tierFree") : t("landing.tierContribute")}
                </Badge>
              </div>
              <h3 className="font-semibold">{t(`landing.${key}.title`)}</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>· {t(`landing.${key}.p1`)}</li>
                <li>· {t(`landing.${key}.p2`)}</li>
                <li>· {t(`landing.${key}.p3`)}</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/** 三步流程 */
function HowItWorks() {
  const { t } = useT()
  const steps = [
    { key: "1", title: "landing.step1Title", desc: "landing.step1Desc" },
    { key: "2", title: "landing.step2Title", desc: "landing.step2Desc" },
    { key: "3", title: "landing.step3Title", desc: "landing.step3Desc" },
  ]
  return (
    <section id="how" className="w-full scroll-mt-16 border-y bg-muted/40 py-16">
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl">{t("landing.howTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{t("landing.howSub")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ key, title, desc }) => (
            <Card key={key} className="data-fade bg-card">
              <CardContent className="space-y-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {key}
                </div>
                <h3 className="font-semibold">{t(title)}</h3>
                <p className="text-sm text-muted-foreground">{t(desc)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 下载区 */
function Download() {
  const { t } = useT()
  const items = [
    { icon: Globe, title: "landing.dlPwa", desc: "landing.dlPwaDesc", cta: t("landing.dlPwaInstall"), disabled: false },
    { icon: Network, title: "landing.dlAndroid", desc: "landing.dlAndroidDesc", cta: t("landing.dlWindows"), disabled: true },
    { icon: Package, title: "landing.dlWindows", desc: "landing.dlWindowsDesc", cta: t("landing.dlWindows"), disabled: true },
  ]
  return (
    <section id="download" className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-16 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-3xl sm:text-4xl">{t("landing.downloadTitle")}</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("landing.downloadSub")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ icon: Icon, title, desc, cta, disabled }) => (
          <Card key={title} className="text-center">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-6" />
              </div>
              <h3 className="font-semibold">{t(title)}</h3>
              <p className="text-sm text-muted-foreground">{t(desc)}</p>
              <Button variant={disabled ? "secondary" : "default"} size="sm" disabled={disabled}>
                {cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/** 更新日志 */
function Updates() {
  const { t } = useT()
  const updates = ["landing.upd1", "landing.upd2", "landing.upd3", "landing.upd4"]
  return (
    <section id="updates" className="w-full scroll-mt-16 border-y bg-muted/40 py-16">
      <div className="mx-auto w-full max-w-3xl px-4 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl sm:text-4xl">{t("landing.updatesTitle")}</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("landing.updatesSub")}</p>
        </div>
        <ol className="space-y-3">
          {updates.map((key) => (
            <li key={key} className="data-fade flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
              <Badge variant="secondary" className="mt-0.5 shrink-0">
                v0.1
              </Badge>
              <span className="text-muted-foreground">{t(key)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** FAQ 手风琴（原生 details/summary，无依赖） */
function Faq() {
  const { t } = useT()
  const faqs: Array<[string, string]> = [
    ["landing.faq1Q", "landing.faq1A"],
    ["landing.faq2Q", "landing.faq2A"],
    ["landing.faq3Q", "landing.faq3A"],
    ["landing.faq4Q", "landing.faq4A"],
  ]
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-16 px-4 py-16 lg:px-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl sm:text-4xl">{t("landing.faqTitle")}</h2>
      </div>
      <div className="space-y-2">
        {faqs.map(([q, a]) => (
          <details key={q} className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {t(q)}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">＋</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-muted-foreground">{t(a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/** 社区入口 */
function Contact() {
  const { t } = useT()
  return (
    <section id="contact" className="mx-auto w-full max-w-6xl scroll-mt-16 px-4 py-16 text-center lg:px-8">
      <h2 className="text-3xl sm:text-4xl">{t("landing.contactTitle")}</h2>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("landing.contactSub")}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <a href={`https://qm.qq.com/cgi-bin/qm/qr?k=${brand.contact.qqGroup}`} target="_blank" rel="noopener noreferrer">
            {t("landing.contactQq")} · {brand.contact.qqGroup}
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`https://t.me/${brand.contact.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
            {t("landing.contactTg")} · {brand.contact.telegram}
          </a>
        </Button>
      </div>
    </section>
  )
}

/** CTA + 页脚 */
function Footer() {
  const { t } = useT()
  return (
    <footer className="border-t">
      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center lg:px-8">
        <h2 className="text-3xl sm:text-4xl">{t("landing.ctaTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{t("landing.ctaDesc")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/register">{t("landing.signUp")}</Link>
        </Button>
      </section>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Cloud className="size-4" />
            <span>
              © {new Date().getFullYear()} {brand.fullName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">
              {t("legal.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              {t("legal.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Download />
        <Updates />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
