import { useEffect, useRef, type ElementType, type PointerEvent, type ReactNode } from 'react'
import { ParticleField } from './ParticleField'

/**
 * Fixed page background: three slow aurora orbs under a drifting particle network.
 * Sits at the bottom of the page's stacking context; everything else scrolls over it.
 */
export function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob aurora-blob--a -right-[8%] -top-[12%] h-[44vw] max-h-[620px] w-[44vw] max-w-[620px] bg-[#7c6cff] opacity-[0.32]" />
      <div className="aurora-blob aurora-blob--b -left-[10%] top-[30%] h-[38vw] max-h-[520px] w-[38vw] max-w-[520px] bg-[#22d3ee] opacity-[0.18]" />
      <div className="aurora-blob aurora-blob--c bottom-[-14%] right-[20%] h-[36vw] max-h-[500px] w-[36vw] max-w-[500px] bg-[#f472b6] opacity-[0.16]" />
      <ParticleField />
    </div>
  )
}

/** Hero-only engineering grid that recedes as the page scrolls. */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="bg-grid absolute inset-0" />
    </div>
  )
}

/**
 * Gradient reading-progress bar along the top edge.
 * CSS scroll timeline drives it where supported. Elsewhere a passive, rAF-batched listener
 * writes the transform directly, so React never re-renders while scrolling.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!bar || CSS.supports('animation-timeline: scroll()')) return

    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return <div ref={ref} aria-hidden="true" className="scroll-progress" />
}

/** Thin bright line with a soft glow that opens a section. Parent must be `relative`. */
export function Horizon() {
  return <div aria-hidden="true" className="horizon" />
}

/** Page-wide film grain. Fixed and non-interactive so it costs nothing on scroll. */
export function Grain() {
  return <div aria-hidden="true" className="grain" />
}

type SpotlightProps = {
  as?: ElementType
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}

/**
 * Card whose border and surface light up under the cursor.
 * Pointer position is written straight to CSS variables, so React never re-renders on move.
 */
export function Spotlight({ as: Tag = 'article', className = '', style, children }: SpotlightProps) {
  const ref = useRef<HTMLElement>(null)

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    node.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <Tag ref={ref} onPointerMove={onPointerMove} className={`spotlight ${className}`} style={style}>
      {children}
    </Tag>
  )
}
