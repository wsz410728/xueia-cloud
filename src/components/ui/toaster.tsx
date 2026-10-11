import { Toaster as Sonner } from "sonner"

/** 全站 Toast（sonner）：api-client 统一错误 toast 的载体，挂在应用根部 */
function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !bg-popover !text-popover-foreground !text-sm",
        },
      }}
    />
  )
}

export { Toaster }
