import { useRef, useState, type KeyboardEvent } from 'react'
import { Reveal } from './Reveal'

/** Personas come from docs/01-business/personas.md. */
const ROLES = [
  {
    id: 'customer',
    tab: 'Customer',
    person: 'Sarah, VP of Product',
    portal: 'Customer Portal',
    before: 'Cannot tell where a verbal or chat decision was ever confirmed.',
    after: 'Reviews proposals and confirms scope changes in one click, on web or mobile.',
  },
  {
    id: 'ba',
    tab: 'Business Analyst',
    person: 'Minh, Lead BA',
    portal: 'Delivery Portal',
    before: 'Developers ask “why are we doing this?” weeks after the meeting.',
    after: 'Turns discussion into tagged requirements, with proof of client confirmation attached.',
  },
  {
    id: 'dev',
    tab: 'Engineering',
    person: 'An, Senior Backend Engineer',
    portal: 'Delivery Portal',
    before: 'Jira tickets arrive without the conversation behind the business rule.',
    after: 'Opens the confirmed decision straight from the issue or the pull request.',
  },
  {
    id: 'qa',
    tab: 'QA',
    person: 'Trang, QA Lead',
    portal: 'Delivery Portal',
    before: 'Tested against an old spec after a change happened in a private chat.',
    after: 'Gets notified the moment a confirmation changes what should be tested.',
  },
  {
    id: 'pm',
    tab: 'Project Manager',
    person: 'Delivery and project leads',
    portal: 'Delivery and Admin Portal',
    before: 'Blind spots between client, ODC and partner teams.',
    after: 'One timeline of decisions across teams, ready for audit at any time.',
  },
]

export function Roles() {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const role = ROLES[active]

  function onKeyDown(e: KeyboardEvent) {
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (active + delta + ROLES.length) % ROLES.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <section id="roles" className="border-y border-line bg-white/[0.015] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Everyone sees the same decision. Through their own lens.
          </h2>
        </Reveal>

        <Reveal className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:gap-14">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Roles"
            onKeyDown={onKeyDown}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
          >
            {ROLES.map((r, i) => {
              const selected = i === active
              return (
                <button
                  key={r.id}
                  ref={(el) => {
                    tabs.current[i] = el
                  }}
                  role="tab"
                  id={`tab-${r.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${r.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-left text-sm font-medium transition lg:text-base ${
                    selected ? 'bg-ink text-canvas' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {r.tab}
                </button>
              )
            })}
          </div>

          <div
            key={role.id}
            role="tabpanel"
            id={`panel-${role.id}`}
            aria-labelledby={`tab-${role.id}`}
            className="rise glass rounded-3xl p-7 md:p-10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold text-ink">{role.person}</p>
              <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent-ink">{role.portal}</span>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-ink-3">Today</p>
                <p className="mt-2 text-xl leading-snug text-ink-2">{role.before}</p>
              </div>
              <div className="md:border-l md:border-line md:pl-8">
                <p className="text-sm font-medium text-accent-ink">With Nexus</p>
                <p className="mt-2 text-xl leading-snug text-ink">{role.after}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
