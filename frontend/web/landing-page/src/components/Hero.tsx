import { ArrowRight } from 'lucide-react'
import { HeroBackdrop } from './Backdrop'
import { DecisionPreview } from './DecisionPreview'

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <HeroBackdrop />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-16 pt-12 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-16">
        <div className="max-w-xl lg:max-w-none">
          <p className="rise text-xs font-medium uppercase tracking-[0.16em] text-accent-ink">
            Project context platform
          </p>
          <h1 className="rise mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-5xl lg:text-[2.85rem] xl:text-[3.05rem]" style={{ '--delay': '80ms' } as React.CSSProperties}>
            Every decision, traced to <span className="text-gradient">the customer</span> who made it.
          </h1>
          <p className="rise mt-6 max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-2" style={{ '--delay': '160ms' } as React.CSSProperties}>
            Nexus links customer confirmations, team conversations, Jira issues and GitHub pull requests into one auditable record.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ '--delay': '240ms' } as React.CSSProperties}>
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 btn-primary rounded-full px-6 py-3 text-sm font-medium active:scale-[0.98]"
            >
              Request a demo
              <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center glass rounded-full px-6 py-3 text-sm font-medium text-ink transition active:scale-[0.98] hover:border-white/20"
            >
              See how it works
            </a>
          </div>
        </div>

        <DecisionPreview />
      </div>
    </section>
  )
}
