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

/** Resolve a CSS value that may be a custom property (e.g. "var(--lime)") to its
 *  actual computed colour string so Canvas APIs can consume it. */
function resolveColor(raw: string, el: HTMLElement): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("var(")) return trimmed

  // Extract the property name: "var(--lime)" → "--lime"
  const propName = trimmed.replace(/^var\(/, "").replace(/\)$/, "").trim()
  const resolved = getComputedStyle(el).getPropertyValue(propName).trim()
  return resolved || "#84cc16"
}

/** Convert any colour Canvas understands into a hex string so we can safely
 *  append two-digit opacity suffixes like "33" or "00". */
function toHex(color: string, opacity: number, el: HTMLElement): string {
  const resolved = resolveColor(color, el)

  // If it's already a 6-digit hex, append the opacity byte directly
  if (/^#[0-9a-fA-F]{6}$/.test(resolved)) {
    return `${resolved}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`
  }

  // For any other format (rgb, hsl, named colour) use an off-screen canvas to
  // convert it to a pixel value, then reconstruct the hex string.
  try {
    const tmp = document.createElement("canvas")
    tmp.width = tmp.height = 1
    const ctx = tmp.getContext("2d")!
    ctx.fillStyle = resolved
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    const a = Math.round(opacity * 255)
    return `rgba(${r},${g},${b},${a / 255})`
  } catch {
    return `rgba(132,204,22,${opacity})`
  }
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
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const minValue = min ?? Math.min(...data)
    const maxValue = max ?? Math.max(...data)
    const range = maxValue - minValue || 1   // guard against all-same data → NaN

    // Resolve the colour once against the live DOM element
    const lineColor = resolveColor(color, canvas)

    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = "round"
    ctx.lineCap = "round"

    data.forEach((val, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const y = height - ((val - minValue) / range) * height
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Gradient fill — use safe colour helpers to avoid CSS-variable errors
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, toHex(color, 0.2, canvas))
    gradient.addColorStop(1, toHex(color, 0,   canvas))
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
