import { Mail, MessageSquare, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToolLogo } from './Brand'
import { Reveal } from '@nexus/ui'

const FRAGMENTS: { icon: ReactNode; source: string; text: string; tilt: string }[] = [
  { icon: <Mail size={14} strokeWidth={1.75} />, source: 'Email, 14 replies', text: 'Re: Re: Fwd: checkout timeout?', tilt: 'md:-rotate-2 md:translate-y-3' },
  { icon: <Phone size={14} strokeWidth={1.75} />, source: 'Weekly call', text: 'Agreed verbally, notes not shared', tilt: 'md:rotate-1' },
  { icon: <MessageSquare size={14} strokeWidth={1.75} />, source: 'Direct message', text: 'ok go with 15s for now', tilt: 'md:-rotate-1 md:translate-y-5' },
  { icon: <ToolLogo tool="jira" size={14} />, source: 'Jira comment', text: 'Per client, see thread (which one?)', tilt: 'md:rotate-2 md:translate-y-1' },
  { icon: <ToolLogo tool="github" size={14} />, source: 'PR review', text: 'Why was this changed from 5s?', tilt: 'md:-rotate-1 md:translate-y-4' },
]

export function Problem() {
  return (
    <section className="border-t border-line py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-4xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            The decision was made. <span className="text-ink-3">Two weeks later, nobody can find where.</span>
          </h2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">
            Requirements change in calls, chats and email threads. By the time the code ships, the reason behind it is gone.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
          {FRAGMENTS.map((f, i) => (
            <Reveal key={f.source} delay={i * 70} className={f.tilt}>
              <div className="h-full rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  {f.icon}
                  {f.source}
                </div>
                <p className="mt-3 text-sm leading-snug text-ink-2">&ldquo;{f.text}&rdquo;</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 grid grid-cols-1 items-end gap-6 md:grid-cols-[auto_1fr] md:gap-12">
          <p className="text-5xl font-semibold tracking-tight text-ink md:text-7xl">
            2h+ <span className="text-ink-3">to</span> <span className="text-gradient">&lt;5 min</span>
          </p>
          <p className="max-w-[44ch] pb-2 text-base leading-relaxed text-ink-2">
            Our design target for tracing any requirement back to the confirmation that approved it.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
