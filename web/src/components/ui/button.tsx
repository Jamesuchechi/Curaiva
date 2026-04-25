import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
      primary: "bg-brand-lime text-bg hover:opacity-90 active:scale-95",
      secondary: "bg-surface-2 text-text-white hover:bg-surface-2/80 active:scale-95",
      ghost: "bg-transparent border border-border-base-2 text-text-light hover:bg-surface-2 active:scale-95",
      danger: "bg-red text-white hover:bg-red/90 active:scale-95",
      icon: "p-2 aspect-square flex items-center justify-center rounded-md border border-border-base bg-surface hover:bg-surface-2 active:scale-95",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          size !== 'icon' && sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
