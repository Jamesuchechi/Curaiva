"use client"

import * as React from "react"

export function VisualBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w: number, h: number
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const lines = Array.from({ length: 15 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 40 + Math.random() * 100,
      speed: 0.5 + Math.random() * 1,
      opacity: 0.05 + Math.random() * 0.1,
      angle: Math.PI * 0.5 + (Math.random() - 0.5) * 0.4
    }))

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.1 + 0.05
    }))

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, w, h)

      // Gradient background
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, h * 0.7)
      g.addColorStop(0, 'rgba(132, 204, 22, 0.03)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // Lines
      lines.forEach(l => {
        l.y -= l.speed
        if (l.y + l.len < 0) {
          l.y = h + l.len
          l.x = Math.random() * w
        }
        const ex = l.x + Math.cos(l.angle) * l.len
        const ey = l.y + Math.sin(l.angle) * l.len
        
        const lg = ctx.createLinearGradient(l.x, l.y, ex, ey)
        lg.addColorStop(0, 'rgba(132, 204, 22, 0)')
        lg.addColorStop(0.5, `rgba(132, 204, 22, ${l.opacity})`)
        lg.addColorStop(1, 'rgba(20, 184, 166, 0)')
        
        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = lg
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(20, 184, 166, ${p.a})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-60"
    />
  )
}
