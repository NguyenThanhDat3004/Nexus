import { PORTALS } from '../lib/portals'
import { Brand } from './Brand'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Capabilities', href: '#capabilities' },
      { label: 'Security', href: '#security' },
    ],
  },
  {
    title: 'Sign in',
    links: [
      { label: PORTALS.customer.label, href: PORTALS.customer.url },
      { label: PORTALS.delivery.label, href: PORTALS.delivery.url },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
        <div>
          <Brand />
          <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-ink-2">
            The project context platform for customers and distributed delivery teams.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold text-ink">{col.title}</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-7xl border-t border-line px-5 py-6 text-xs text-ink-3 md:px-8">
        © 2026 Nexus. Released under the MIT License.
      </div>
    </footer>
  )
}
