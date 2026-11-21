import { ArrowRight, CircleCheck, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Reveal } from './Reveal'

type Status = 'idle' | 'submitting' | 'success'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function FinalCta() {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [errors, setErrors] = useState<{ email?: string; company?: string }>({})
  const [status, setStatus] = useState<Status>('idle')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid work email.'
    if (!company.trim()) next.company = 'Tell us which company you are with.'
    setErrors(next)
    if (Object.keys(next).length) return

    // TODO: wire to the demo-request endpoint once the API gateway exposes one.
    setStatus('submitting')
    window.setTimeout(() => setStatus('success'), 900)
  }

  return (
    <section id="demo" className="relative isolate px-5 pb-24 md:px-8 md:pb-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-[420px] max-w-5xl -translate-y-1/2 rounded-full bg-accent/15 blur-[100px]" />
      <Reveal className="beam-border glass shadow-soft mx-auto max-w-7xl rounded-3xl">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl lg:grid-cols-[1.1fr_1fr]">
          <div className="dot-grid relative p-8 md:p-14">
            <h2 className="max-w-lg text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
              Bring your next requirement change into <span className="text-gradient">Nexus</span>.
            </h2>
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-2">
              We will walk your client and delivery leads through one real decision, from chat to pull request.
            </p>
          </div>

          <div className="border-t border-line p-8 md:p-14 lg:border-l lg:border-t-0">
            {status === 'success' ? (
              <div className="rise flex h-full flex-col justify-center" role="status">
                <CircleCheck size={32} strokeWidth={1.5} className="text-brand-green" />
                <p className="mt-4 text-xl font-semibold text-ink">Request received.</p>
                <p className="mt-2 max-w-[40ch] text-ink-2">
                  We will reply to {email.trim()} within two business days to schedule the walkthrough.
                </p>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
                <Field
                  id="demo-email"
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                />
                <Field
                  id="demo-company"
                  label="Company"
                  autoComplete="organization"
                  placeholder="Company name"
                  value={company}
                  onChange={setCompany}
                  error={errors.company}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="mt-2 inline-flex items-center justify-center gap-2 btn-primary rounded-full px-6 py-3.5 text-sm font-medium active:scale-[0.98] disabled:opacity-70"
                >
                  {status === 'submitting' ? (
                    <>
                      <LoaderCircle size={16} strokeWidth={1.75} className="animate-spin motion-reduce:animate-none" />
                      Sending
                    </>
                  ) : (
                    <>
                      Request a demo
                      <ArrowRight size={16} strokeWidth={1.75} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

type FieldProps = {
  id: string
  label: string
  type?: string
  autoComplete: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
}

function Field({ id, label, type = 'text', autoComplete, placeholder, value, onChange, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`rounded-xl border bg-canvas px-4 py-3 text-ink placeholder:text-ink-3 outline-none transition focus:ring-2 focus:ring-accent/40 ${
          error ? 'border-brand-pink' : 'border-line focus:border-accent'
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-brand-pink">
          {error}
        </p>
      )}
    </div>
  )
}
