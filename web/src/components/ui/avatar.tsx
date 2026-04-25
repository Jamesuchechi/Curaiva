import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg'
}

function Avatar({ className, src, fallback, size = 'md', ...props }: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-border-base bg-surface-2 items-center justify-center font-display font-medium text-text-light",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={fallback} className="aspect-square h-full w-full" />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}

export { Avatar }
