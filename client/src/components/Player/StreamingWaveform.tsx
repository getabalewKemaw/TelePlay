import React, { useEffect, useRef, useState } from 'react'

interface StreamingWaveformProps {
  peaks: number[]
  duration: number
  currentTime: number
  baseColor?: string
  progressColor?: string
  backgroundColor?: string
}

export function StreamingWaveform({
  peaks,
  duration,
  currentTime,
  baseColor = '#989f9eff',
  progressColor = '#0f172a',
  backgroundColor = '#f8fafc'
}: StreamingWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (size.width === 0 || size.height === 0) return
    canvas.width = size.width
    canvas.height = size.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size.width, size.height)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, size.width, size.height)

    const midY = size.height / 2
    const total = peaks.length
    if (total === 0) return

    const barWidth = 3
    const barGap = 4
    const barRadius = 3
    const totalBars = Math.floor(size.width / (barWidth + barGap))
    const step = totalBars > 0 ? Math.max(1, Math.floor(total / totalBars)) : 1
    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0
    const progressX = Math.floor(progress * size.width)

    let x = 0
    for (let i = 0; i < total; i += step) {
      const rawPeak = Number.isFinite(peaks[i]) ? peaks[i] : 0.15
      const boosted = Math.pow(rawPeak, 0.5)
      const barHeight = Math.max(4, Math.floor(boosted * (size.height * 0.95)))

      const y = Math.floor(midY - barHeight / 2)
      const height = Math.floor(barHeight)

      const drawRounded = (color: string) => {
        ctx.fillStyle = color
        ctx.beginPath()
        const r = Math.min(barRadius, barWidth / 2, height / 2)
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + barWidth - r, y)
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r)
        ctx.lineTo(x + barWidth, y + height - r)
        ctx.quadraticCurveTo(x + barWidth, y + height, x + barWidth - r, y + height)
        ctx.lineTo(x + r, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
        ctx.fill()
      }

      drawRounded(baseColor)
      if (x <= progressX) {
        drawRounded(progressColor)
      }
      x += barWidth + barGap
      if (x > size.width) break
    }

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, size.height)
    ctx.stroke()
  }, [peaks, duration, currentTime, size])

  return (
    <div ref={containerRef} className="relative z-10 w-full h-24 md:h-28">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
