import { BadgeCheck, Bell, GitPullRequest, Hash, Lock } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { ToolLogo } from './Brand'

/**
 * A live mini-version of the Nexus thread view, using the core scenario from docs/01-business/scope.md.
 * The rows play back in order so the hero tells the product story: discuss, confirm, lock, link.
 */
export function DecisionPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
      {/* Halo that lifts the card off the aurora. */}
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/20 blur-3xl" />
      <div className="beam-border glass rounded-3xl shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Hash size={15} strokeWidth={1.75} className="text-ink-3" />
            payments-gateway
          </div>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-ink-2">Project Common</span>
        </div>

        <div className="space-y-5 px-5 py-5">
          <Message delay={350} initials="SW" name="Sarah Whitfield" role="VP Product, client" time="09:31">
            Let's raise the payment timeout from 5s to 15s. Card issuers in APAC are timing out at peak hours.
          </Message>

          <Message delay={650} initials="MT" name="Minh Tran" role="Lead BA" time="09:38" tag="Requirement">
            Captured as a requirement. Scope: card and wallet checkout only, refunds unchanged. Sarah, can you confirm?
          </Message>

          <div
            className="stamp rounded-xl border border-brand-green/30 bg-brand-green/10 px-4 py-3.5"
            style={{ '--delay': '1050ms' } as CSSProperties}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-green">
                <BadgeCheck size={18} strokeWidth={1.75} />
                Customer confirmation
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                <Lock size={12} strokeWidth={2} />
                Content locked
              </span>
            </div>
            <p className="mt-1.5 text-sm text-ink-2">Confirmed by Sarah Whitfield on Nov 18, 09:42 EST</p>
          </div>

          <div className="rise flex flex-wrap gap-2" style={{ '--delay': '1400ms' } as CSSProperties}>
            <Ref icon={<ToolLogo tool="jira" size={14} />} label="NEX-1024" status="In progress" />
            <Ref icon={<ToolLogo tool="github" size={14} />} label="PR #405" status="Open" />
            <Ref icon={<Bell size={14} strokeWidth={1.75} className="text-ink-3" />} label="Backend, QA" status="Notified" />
          </div>
        </div>
      </div>

      {/* Second layer: where the PR sits, pointing back to the confirmation. */}
      <div
        className="rise absolute -bottom-20 -right-3 hidden w-64 glass rounded-3xl p-4 shadow-soft sm:block md:-right-6"
        style={{ '--delay': '1700ms' } as CSSProperties}
      >
        <div className="flex items-center gap-2 text-xs text-ink-3">
          <GitPullRequest size={14} strokeWidth={1.75} />
          Linked from PR #405
        </div>
        <p className="mt-2 text-sm leading-snug text-ink">Why 15s? Open the confirmed decision in Nexus.</p>
      </div>
    </div>
  )
}

type MessageProps = {
  delay: number
  initials: string
  name: string
  role: string
  time: string
  tag?: string
  children: ReactNode
}

function Message({ delay, initials, name, role, time, tag, children }: MessageProps) {
  return (
    <div className="rise flex gap-3" style={{ '--delay': `${delay}ms` } as CSSProperties}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink-2">
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-ink">{name}</span>
          <span className="text-xs text-ink-3">{role}</span>
          <span className="font-mono text-xs text-ink-3">{time}</span>
          {tag && (
            <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-2">{tag}</span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">{children}</p>
      </div>
    </div>
  )
}

function Ref({ icon, label, status }: { icon: ReactNode; label: string; status: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-white/[0.03] px-2.5 py-1.5 text-xs">
      {icon}
      <span className="font-mono font-medium text-ink">{label}</span>
      <span className="text-ink-3">{status}</span>
    </span>
  )
}
