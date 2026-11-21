import { ArrowRight, EyeOff, Lock, Search } from 'lucide-react'
import { ToolLogo } from './Brand'
import { Horizon, Spotlight } from './Backdrop'
import { Reveal } from './Reveal'

export function Capabilities() {
  return (
    <section id="capabilities" className="relative py-24 md:py-32">
      <Horizon />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Built around the moment a customer <span className="text-gradient">says yes</span>.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-[auto_auto_auto]">
          {/* 1. Confirmation lock: the core feature gets the largest tile. */}
          <Reveal className="md:col-span-4 md:row-span-2">
            <Spotlight className="flex h-full flex-col justify-between gap-10 glass rounded-3xl bg-accent-soft p-7 md:p-9">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-ink">Confirmations that cannot drift</h3>
                <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-2">
                  Once marked as a customer confirmation, the content is locked. Any change creates a new version, and the original stays on record.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-brand-green/30 bg-brand-green/[0.07] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-brand-green">v1, confirmed</span>
                    <Lock size={13} strokeWidth={2} className="text-brand-green" />
                  </div>
                  <p className="mt-2 text-sm text-ink">Payment timeout: 5s to 15s</p>
                  <p className="mt-1 text-xs text-ink-3">Sarah Whitfield, Nov 18</p>
                </div>
                <div className="rounded-xl border border-dashed border-line bg-surface/70 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-brand-pink">v2, pending</span>
                    <ArrowRight size={13} strokeWidth={2} className="text-ink-3" />
                  </div>
                  <p className="mt-2 text-sm text-ink">Payment timeout: 15s to 20s</p>
                  <p className="mt-1 text-xs text-ink-3">Awaiting customer confirmation</p>
                </div>
              </div>
            </Spotlight>
          </Reveal>

          {/* 2. Cross-team bridge */}
          <Reveal delay={80} className="md:col-span-2">
            <Spotlight className="dot-grid glass h-full rounded-3xl p-7">
              <div className="flex flex-wrap gap-2">
                {['Backend', 'QA', 'DevOps'].map((team) => (
                  <span key={team} className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink-2">
                    {team}
                  </span>
                ))}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-ink">One shared hub, private team rooms</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Bridge a decision into Project Common. Team channels stay private.
              </p>
            </Spotlight>
          </Reveal>

          {/* 3. External references */}
          <Reveal delay={140} className="md:col-span-2">
            <Spotlight className="h-full glass rounded-3xl p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2">
                  <ToolLogo tool="jira" size={20} />
                </span>
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2">
                  <ToolLogo tool="github" size={20} />
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-ink">Linked, never duplicated</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Nexus shows live status. Jira and GitHub stay the source of truth.
              </p>
            </Spotlight>
          </Reveal>

          {/* 4. Authorization-aware search */}
          <Reveal delay={60} className="md:col-span-3">
            <Spotlight className="h-full glass rounded-3xl p-7">
              <div className="flex items-center gap-2 rounded-full border border-line bg-black/30 px-4 py-2.5 text-sm">
                <Search size={15} strokeWidth={1.75} className="text-ink-3" />
                <span className="text-ink">payment timeout</span>
              </div>
              <div className="mt-3 flex items-center gap-2 px-1 text-xs text-ink-3">
                <EyeOff size={13} strokeWidth={1.75} />
                Results from channels you cannot access are never queried.
              </div>
              <h3 className="mt-6 text-lg font-semibold text-ink">Search that respects access</h3>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
                Permissions are checked before search, retrieval and AI context. Not filtered afterwards.
              </p>
            </Spotlight>
          </Reveal>

          {/* 5. Audit trail */}
          <Reveal delay={120} className="md:col-span-3">
            <Spotlight
              className="glass h-full rounded-3xl p-7"
              style={{ background: 'linear-gradient(160deg, rgb(244 114 182 / 0.12) 0%, rgb(124 108 255 / 0.06) 45%, transparent 75%)' }}
            >
              <ul className="space-y-1.5 font-mono text-xs text-ink-2">
                <li>09:42 confirmation.created by s.whitfield</li>
                <li>09:42 content.locked v1</li>
                <li>09:44 reference.linked NEX-1024</li>
                <li>11:05 reference.linked PR #405</li>
              </ul>
              <h3 className="mt-6 text-lg font-semibold text-ink">A record auditors can read</h3>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
                Confirmations, permission changes and break-glass access are logged and cannot be edited.
              </p>
            </Spotlight>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
