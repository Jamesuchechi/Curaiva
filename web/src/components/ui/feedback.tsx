import * as React from "react"
import { cn } from "@/lib/utils"

function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: { 
  icon?: React.ReactNode, 
  title: string, 
  description?: string,
  action?: React.ReactNode,
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 glass rounded-2xl", className)}>
      {icon && <div className="mb-4 p-4 rounded-full bg-surface-2 text-text-muted">{icon}</div>}
      <h3 className="text-xl font-display font-semibold mb-2">{title}</h3>
      {description && <p className="text-text-muted max-w-xs mx-auto mb-6">{description}</p>}
      {action}
    </div>
  )
}

function StatusDot({ status = 'online', className }: { status?: 'online' | 'offline' | 'busy', className?: string }) {
  const colors = {
    online: "bg-brand-green",
    offline: "bg-text-muted",
    busy: "bg-red",
  }

  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])}></span>
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", colors[status])}></span>
    </span>
  )
}

function Toast({ 
  variant = 'info', 
  message, 
  onClose,
  className 
}: { 
  variant?: 'success' | 'error' | 'warning' | 'info', 
  message: string, 
  onClose?: () => void,
  className?: string
}) {
  const variants = {
    success: "border-teal text-teal bg-teal/10",
    error: "border-red text-red bg-red/10",
    warning: "border-amber text-amber bg-amber/10",
    info: "border-brand-lime text-brand-lime bg-brand-lime/10",
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border rounded-xl shadow-lg glass animate-in slide-in-from-right-full",
      variants[variant],
      className
    )}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
          &times;
        </button>
      )}
    </div>
  )
}

export { EmptyState, StatusDot, Toast }
