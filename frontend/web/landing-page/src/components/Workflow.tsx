import { BadgeCheck, GitMerge, Link2, MessagesSquare } from 'lucide-react'
import { Reveal } from './Reveal'

const STEPS = [
  {
    icon: MessagesSquare,
    title: 'Discuss',
    body: 'Customers, BAs and engineers talk in project channels and threads, not scattered inboxes.',
  },
  {
    icon: BadgeCheck,
    title: 'Confirm',
    body: 'The customer confirms in one click. The message is locked and versioned from that moment.',
  },
  {
    icon: GitMerge,
    title: 'Bridge',
    body: 'The confirmed decision lands in Project Common and notifies Backend, QA and DevOps.',
  },
  {
    icon: Link2,
    title: 'Link',
    body: 'Attach the Jira issue and the pull request. Anyone can follow the trail in either direction.',
  },
]

export function Workflow() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white/[0.015] py-24 md:py-32">
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_70%_at_80%_100%,#000,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            From a customer sentence to a merged pull request.
          </h2>
        </Reveal>

        <div className="relative mt-16">
        {/* Connecting rail: horizontal on desktop, vertical on mobile. */}
        <span aria-hidden="true" className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-px bg-line md:right-0 md:h-px md:w-auto">
          <span className="rail-beam hidden md:block" />
        </span>
        <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">

          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 110} className="relative pl-16 md:pl-0">
              <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-line bg-[#0b0c1a] text-accent-ink shadow-soft md:relative">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <h3 className="text-xl font-semibold text-ink md:mt-6">{title}</h3>
              <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-ink-2">{body}</p>
            </Reveal>
          ))}
        </ol>
        </div>
      </div>
    </section>
  )
}
