"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SparklineProps extends React.HTMLAttributes<HTMLCanvasElement> {
  data: number[]
  color?: string
  min?: number
  max?: number
  width?: number
  height?: number
}

function Sparkline({ 
  data, 
  color = "#84cc16", 
  min, 
  max, 
  width = 120, 
  height = 40, 
  className,
  ...props 
}: SparklineProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const minValue = min ?? Math.min(...data)
    const maxValue = max ?? Math.max(...data)
    const range = maxValue - minValue

    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - minValue) / range) * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Add gradient fill
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}33`)
    gradient.addColorStop(1, `${color}00`)
    ctx.fillStyle = gradient
    ctx.fill()

  }, [data, color, min, max, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={cn("block", className)}
      {...props}
    />
  )
}

export { Sparkline }
