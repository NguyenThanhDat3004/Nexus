import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PORTALS } from '../lib/portals'
import { Brand } from './Brand'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#capabilities', label: 'Product' },
  { href: '#roles', label: 'For teams' },
  { href: '#security', label: 'Security' },
]

const PORTAL_LIST = Object.values(PORTALS)

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8" aria-label="Main">
        <a href="#top" aria-label="Nexus home">
          <Brand />
        </a>

        <ul className="hidden items-center gap-8 text-sm text-ink-2 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <SignInMenu />
          <a
            href="#demo"
            className="btn-primary rounded-full px-4 py-2 text-sm font-medium active:scale-[0.98]"
          >
            Request a demo
          </a>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-canvas/95 px-5 backdrop-blur-xl pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col text-base text-ink">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="block py-3" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-ink-3">Sign in</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {PORTAL_LIST.map((p) => (
              <a key={p.label} href={p.url} className="rounded-full border border-line px-4 py-2.5 text-center text-sm font-medium text-ink">
                {p.label.replace(' Portal', '')}
              </a>
            ))}
          </div>
          <a
            href="#demo"
            onClick={() => setOpen(false)}
            className="btn-primary mt-3 block rounded-full px-4 py-2.5 text-center text-sm font-medium"
          >
            Request a demo
          </a>
        </div>
      )}
    </header>
  )
}

/** Customers and delivery teams sign in to different portals, so the public site lets them choose. */
function SignInMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        Sign in
        <ChevronDown size={14} strokeWidth={1.75} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="rise absolute right-0 top-full mt-2 w-64 rounded-3xl border border-line bg-[#0b0c1a]/90 p-2 shadow-soft backdrop-blur-xl">
          {PORTAL_LIST.map((p) => (
            <a key={p.label} href={p.url} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
              <span className="block text-sm font-medium text-ink">{p.label}</span>
              <span className="block text-xs text-ink-3">{p.description}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
