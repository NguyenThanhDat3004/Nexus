import React from 'react'

export function LedgerComplianceBadge() {
  return (
    <div className="rounded-2xl bg-[#eef1fd] border border-indigo-200/80 p-5 text-center shadow-sm">
      <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-900 uppercase">
        <svg className="size-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
        <span>Immutable Evidentiary Ledger</span>
      </div>
      <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-indigo-950/80">
        Protected by RFC 3161 cryptographic timestamps &amp; WebAuthn support. End-to-end 256-bit TLS operational protocol.
      </p>
      <div className="mt-2.5 text-[11px] font-bold tracking-wide text-indigo-700">
        SHA-256 Audit Trail • SOC2 Type II • FIPS 140-3
      </div>
    </div>
  )
}
