import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import './reveal.css'

type RevealProps = {
  as?: ElementType
  /** Stagger offset in ms. */
  delay?: number
  className?: string
  children: ReactNode
}

/** Fades content up once when it enters the viewport. Static under prefers-reduced-motion. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.dataset.shown = 'true'
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`nx-reveal ${className}`} style={{ '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}
