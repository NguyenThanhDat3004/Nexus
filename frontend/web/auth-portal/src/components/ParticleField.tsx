import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; r: number }

const LINK_DISTANCE = 140
const POINTER_DISTANCE = 200
const AREA_PER_POINT = 12000
const MAX_POINTS = 130

/**
 * Interactive Particle Network (Mạng nhện kết nối điểm & tương tác con trỏ chuột)
 * Tái sử dụng cho giao diện Auth Portal để đồng bộ hiệu ứng với Landing Page.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0, y: 0, active: false }
    let points: Particle[] = []
    let width = 0
    let height = 0
    let frameId = 0
    let resizeTimer = 0

    function seed() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(MAX_POINTS, Math.round((width * height) / AREA_PER_POINT))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 0.8 + Math.random() * 1.5,
      }))
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      for (const p of points) {
        if (!reduceMotion) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -20) p.x = width + 20
          else if (p.x > width + 20) p.x = -20
          if (p.y < -20) p.y = height + 20
          else if (p.y > height + 20) p.y = -20
        }
      }

      // Point-to-point links (Mạng lưới điểm với điểm)
      ctx!.lineWidth = 1
      for (let i = 0; i < points.length; i++) {
        const a = points[i]
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > LINK_DISTANCE * LINK_DISTANCE) continue
          const alpha = (1 - Math.sqrt(dist2) / LINK_DISTANCE) * 0.22
          ctx!.strokeStyle = `rgba(99, 102, 241, ${alpha})`
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      // Cursor links (Tương tác mạng nhện nối với trỏ chuột)
      if (pointer.active && !reduceMotion) {
        for (const p of points) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > POINTER_DISTANCE * POINTER_DISTANCE) continue
          const alpha = (1 - Math.sqrt(dist2) / POINTER_DISTANCE) * 0.65
          ctx!.strokeStyle = `rgba(79, 70, 229, ${alpha})`
          ctx!.beginPath()
          ctx!.moveTo(pointer.x, pointer.y)
          ctx!.lineTo(p.x, p.y)
          ctx!.stroke()
        }
      }

      // Draw particle points
      for (const p of points) {
        ctx!.fillStyle = '#6366f1'
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (!reduceMotion) frameId = requestAnimationFrame(draw)
    }

    seed()
    draw()

    function onPointerMove(e: PointerEvent) {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }

    function onPointerLeave() {
      pointer.active = false
    }

    function onResize() {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        seed()
        if (reduceMotion) draw()
      }, 120)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
    />
  )
}
