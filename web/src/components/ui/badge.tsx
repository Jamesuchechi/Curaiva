import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'critical' | 'urgent' | 'moderate' | 'low' | 'stable' | 'new' | 'default'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-2 text-text-white border-border-base-2",
    critical: "bg-red/10 text-red border-red/20 animate-pulse",
    urgent: "bg-amber/10 text-amber border-amber/20",
    moderate: "bg-amber/10 text-amber border-amber/20",
    low: "bg-teal/10 text-teal border-teal/20",
    stable: "bg-brand-green/10 text-brand-green border-brand-green/20",
    new: "bg-purple/10 text-purple border-purple/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
