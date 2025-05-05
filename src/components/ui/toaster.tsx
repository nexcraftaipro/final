
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="bg-background/95 backdrop-blur-sm border-blue-700/30 shadow-lg">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-blue-100">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-blue-50/90">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="p-6" />
    </ToastProvider>
  )
}
