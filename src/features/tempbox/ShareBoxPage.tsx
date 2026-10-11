import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Copy, FileUp, Timer, Upload } from "lucide-react"
import { useT } from "@/i18n"
import { tempboxApi } from "@/api/tempbox"
import type { TempboxCreated } from "@/api/tempbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"

/**
 * 临时分享箱 —— 分享端（对齐参考站结构）：
 * 页头 + 四项配置参数 + 「分享临时内容」卡（文字 / 文件·图片 双 Tab）+ 生成结果卡（大号接收码 + 分享链接）。
 * 取件端（游客）见 PickupPage；<PageHeader> 下方不含解锁区（取件在公开页 /tempbox）。
 */
export function ShareBoxPage() {
  const { t } = useT()
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [created, setCreated] = useState<TempboxCreated | null>(null)

  const config = useQuery({ queryKey: ["tempbox", "config"], queryFn: tempboxApi.getConfig })

  const shareText = useMutation({
    mutationFn: () => tempboxApi.createText(text),
    onSuccess: setCreated,
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  const shareFiles = useMutation({
    mutationFn: () => tempboxApi.createFiles(files),
    onSuccess: setCreated,
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  })

  async function copy(textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success(t("common.copied"))
    } catch {
      // 剪贴板不可用（非 https/localhost）：提示手动复制，文本框可选中
      toast.error(t("common.copyFailed"))
    }
  }

  const totalSize = files.reduce((n, f) => n + f.size, 0)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title={t("tb.title")} subtitle={t("tb.subtitle")} />

      {/* 四项配置参数（来自 /tempbox/config） */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {config.isLoading ? (
          <Skeleton className="col-span-4 h-16 w-full" />
        ) : (
          [
            { label: t("tb.defaultRetention"), value: t("tb.minutes", { n: config.data?.retentionMinutes ?? 30 }) },
            { label: t("tb.maxFileSize"), value: `${config.data?.maxFileSizeMB ?? 100} MB` },
            { label: t("tb.maxFiles"), value: String(config.data?.maxFiles ?? 100) },
            { label: t("tb.maxLiveBatches"), value: String(config.data?.maxLive ?? 10) },
          ].map((p) => (
            <Card key={p.label}>
              <CardContent className="py-3 text-center">
                <p className="text-sm font-semibold tabular-nums">{p.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 分享区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("tb.shareTitle")}</CardTitle>
          <CardDescription>{t("tb.shareHint.authed")}</CardDescription>
        </CardHeader>
        <CardContent>
          {created ? (
            <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("tb.yourCode")}</p>
              <p className="font-mono text-3xl font-bold tracking-[0.3em]">{created.code}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => copy(created.link)}>
                  <Copy className="size-4" />
                  {t("tb.copyLink")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => copy(created.code)}>
                  {t("tb.copyCodeOnly")}
                </Button>
              </div>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Timer className="size-3.5" />
                {t("tb.expiresAt", { time: new Date(created.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
              </p>
              <p className="text-xs text-muted-foreground">{t("tb.shareLinkHint")}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreated(null)
                  setText("")
                  setFiles([])
                }}
              >
                {t("tb.restart")}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="text">
              <TabsList className="w-full">
                <TabsTrigger value="text">{t("tb.tab.text")}</TabsTrigger>
                <TabsTrigger value="files">{t("tb.tab.files")}</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4 space-y-3">
                <textarea
                  className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder={t("tb.textPlaceholder")}
                  aria-label={t("tb.textLabel")}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button disabled={!text.trim() || shareText.isPending} onClick={() => shareText.mutate()}>
                  {shareText.isPending ? t("tb.uploading") : t("tb.createCode")}
                </Button>
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-3">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center transition-colors hover:border-ring">
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm">{t("tb.chooseFiles")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("tb.files.maxSize", { size: `${config.data?.maxFileSizeMB ?? 100} MB` })}
                  </span>
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      const list = Array.from(e.target.files ?? [])
                      setFiles(list)
                    }}
                  />
                </label>
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileUp className="size-3.5" />
                      {t("tb.fileSummary", { n: files.length, size: `${(totalSize / 1024 / 1024).toFixed(2)} MB` })}
                    </p>
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                      {files.map((f) => (
                        <li key={f.name} className="flex items-center justify-between rounded-sm bg-muted px-2 py-1">
                          <span className="truncate">{f.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {(f.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button disabled={shareFiles.isPending} onClick={() => shareFiles.mutate()}>
                      {shareFiles.isPending ? t("tb.uploading") : t("tb.createCode")}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{t("ph.demo")}</Badge>
        {t("tb.storageNote")}
      </p>
    </div>
  )
}
