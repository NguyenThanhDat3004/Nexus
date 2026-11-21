import { useEffect, useRef } from 'react'

type Particle = { x: number; y: number; vx: number; vy: number; r: number }

const LINK_DISTANCE = 130 // px between two points before a faint line joins them
const POINTER_DISTANCE = 190 // px from the cursor before a cyan line reaches a point
const AREA_PER_POINT = 14000 // one point per this many px² of viewport
const MAX_POINTS = 120

/**
 * Full-viewport network of slowly drifting points. Nearby points are joined by faint lines,
 * and points near the cursor are joined to it in cyan.
 * Runs entirely outside React state, pauses while the tab is hidden, and draws one static
 * frame (no animation, no pointer lines) under prefers-reduced-motion.
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
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 0.6 + Math.random() * 1.3,
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

      // Point-to-point links.
      ctx!.lineWidth = 1
      for (let i = 0; i < points.length; i++) {
        const a = points[i]
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > LINK_DISTANCE * LINK_DISTANCE) continue
          const alpha = (1 - Math.sqrt(dist2) / LINK_DISTANCE) * 0.16
          ctx!.strokeStyle = `rgba(164, 154, 255, ${alpha})`
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      // Cursor links.
      if (pointer.active && !reduceMotion) {
        for (const p of points) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist2 = dx * dx + dy * dy
          if (dist2 > POINTER_DISTANCE * POINTER_DISTANCE) continue
          const alpha = (1 - Math.sqrt(dist2) / POINTER_DISTANCE) * 0.55
          ctx!.strokeStyle = `rgba(34, 211, 238, ${alpha})`
          ctx!.beginPath()
          ctx!.moveTo(pointer.x, pointer.y)
          ctx!.lineTo(p.x, p.y)
          ctx!.stroke()
        }
      }

      // Points on top of their lines.
      for (const p of points) {
        ctx!.fillStyle = 'rgba(226, 228, 255, 0.55)'
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function loop() {
      draw()
      frameId = requestAnimationFrame(loop)
    }

    function start() {
      cancelAnimationFrame(frameId)
      if (reduceMotion) draw()
      else frameId = requestAnimationFrame(loop)
    }

    function onResize() {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        seed()
        start()
      }, 150)
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }

    function onPointerLeave() {
      pointer.active = false
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(frameId)
      else start()
    }

    seed()
    start()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" />
}
