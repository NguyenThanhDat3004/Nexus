import { Database, Fingerprint, ShieldCheck, UserRound } from 'lucide-react'
import { Horizon, Spotlight } from './Backdrop'
import { Reveal } from '@nexus/ui'

const PIPELINE = [
  { icon: UserRound, title: 'Request', detail: 'Web, mobile or API' },
  { icon: Fingerprint, title: 'Identity', detail: 'OIDC, OAuth2, MFA' },
  { icon: ShieldCheck, title: 'Resource policy', detail: 'RBAC and ABAC per tenant, project and channel' },
  { icon: Database, title: 'Data, search, AI context', detail: 'Only what the policy allowed' },
]

const POINTS = [
  { title: 'Tenant isolation', body: 'Enforced at the API, the query and the cache.' },
  { title: 'Immutable audit', body: 'Confirmations and break-glass access are logged permanently.' },
  { title: 'Idempotent sync', body: 'Duplicate Jira and GitHub webhooks never create duplicate records.' },
]

export function Security() {
  return (
    <section id="security" className="relative py-24 md:py-32">
      <Horizon />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 md:px-8 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-ink">Security</p>
          <h2 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Authorization runs before retrieval. <span className="text-gradient">Every time.</span>
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2">
            Client, ODC and partner teams share one platform without sharing what they should not see.
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title} className="border-t border-line pt-4">
                <dt className="font-semibold text-ink">{p.title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.body}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="relative isolate">
          {/* Radar rings centred on the policy gate. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[62%] -z-10 -translate-x-1/2 -translate-y-1/2">
            {[220, 360, 500].map((d) => (
              <span key={d} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/25" style={{ width: d, height: d }} />
            ))}
            <span className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl" />
          </div>
        <ol className="relative mx-auto w-full max-w-md">
          {PIPELINE.map(({ icon: Icon, title, detail }, i) => {
            const isGate = i === 2
            return (
              <Reveal as="li" key={title} delay={i * 120} className="relative pb-6 last:pb-0">
                {i < PIPELINE.length - 1 && (
                  <span aria-hidden="true" className="absolute left-7 top-14 h-[calc(100%-3.5rem)] w-px bg-line" />
                )}
                <Spotlight
                  as="div"
                  className={`flex items-center gap-4 rounded-3xl border p-4 ${
                    isGate ? 'border-accent/40 bg-accent-soft shadow-soft' : 'glass'
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      isGate ? 'bg-accent text-white' : 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="text-sm text-ink-2">{detail}</p>
                  </div>
                </Spotlight>
              </Reveal>
            )
          })}
        </ol>
        </div>
      </div>
    </section>
  )
}
