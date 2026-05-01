import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  fallback: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function Avatar({ className, src, fallback, size = 'md', ...props }: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-32 w-32 text-4xl",
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
        <Image 
          src={src} 
          alt={fallback} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  )
}

export { Avatar }
