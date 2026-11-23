import React, { useState } from 'react'

export interface CredentialFormProps {
  onSubmit?: (email: string, password: string) => void
  onForgotPassword?: () => void
  isLoading?: boolean
}

export function CredentialForm({ onSubmit, onForgotPassword, isLoading = false }: CredentialFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(email, password)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="nexus-work-email" className="text-sm font-semibold text-slate-800">
            Institutional Work Email
          </label>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 border border-slate-200/60">
            SSO ENABLED
          </span>
        </div>
        <div className="relative flex items-center rounded-2xl bg-[#f0f3fa] border border-slate-200/50 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/70 shadow-sm">
          <span className="grid size-12 place-items-center text-slate-400 shrink-0">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
            </svg>
          </span>
          <input
            id="nexus-work-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-transparent pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor="nexus-password" className="text-sm font-semibold text-slate-800">
            Master Security Key / Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative flex items-center rounded-2xl bg-[#f0f3fa] border border-slate-200/50 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100/70 shadow-sm">
          <span className="grid size-12 place-items-center text-slate-400 shrink-0">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="nexus-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full bg-transparent pr-12 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            {showPassword ? (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Hardware Key or FIPS 140-3 Compliant Credential supported.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] py-4 text-base font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_16px_36px_rgba(79,70,229,0.45)] hover:from-[#4338ca] hover:to-[#3730a3] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="size-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Verifying Ledger Identity...</span>
          </span>
        ) : (
          <>
            <span>Sign In to Ledger</span>
            <span className="transition-transform group-hover:translate-x-1 font-bold text-lg leading-none">→</span>
          </>
        )}
      </button>
    </form>
  )
}
