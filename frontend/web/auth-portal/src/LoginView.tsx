import React from 'react'
import { CredentialForm } from './components/CredentialForm'
import { LedgerComplianceBadge } from './components/LedgerComplianceBadge'
import { SsoButtons } from './components/SsoButtons'
import { NexusLogo } from './components/NexusLogo'

export interface LoginViewProps {
  onGoogleSignIn?: () => void
  onMicrosoftSignIn?: () => void
  onSubmit?: (email: string, password: string) => void
  onRequestInvitation?: () => void
  onForgotPassword?: () => void
  isLoading?: boolean
  error?: string | null
}

export function LoginView({
  onGoogleSignIn,
  onMicrosoftSignIn,
  onSubmit,
  onRequestInvitation,
  onForgotPassword,
  isLoading = false,
  error = null,
}: LoginViewProps) {
  return (
    <div className="relative w-full rounded-[36px] bg-white/95 p-8 sm:p-12 shadow-[0_25px_80px_rgba(30,27,75,0.12)] border border-slate-200/80 backdrop-blur-2xl transition-all">
      {/* Official Nexus Logo Header (Đồng bộ chuẩn Landing Page) */}
      <div className="flex flex-col items-center justify-center">
        <NexusLogo size={48} markOnly />
      </div>

      {/* Title & Version Badge */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nexus</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-semibold tracking-wide text-indigo-600 border border-indigo-200/80 shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            v2.4-PROD
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Enterprise Evidentiary Platform &amp; Decision Ledger
        </p>
      </div>

      {/* Error Banner Thẩm Mỹ (Chỉ hiện khi có lỗi, màu sắc trang nhã, icon cảnh báo) */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-rose-50/90 border border-rose-200/80 p-3.5 text-xs text-rose-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <svg className="size-4 shrink-0 text-rose-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-relaxed font-medium">{error}</span>
        </div>
      )}

      {/* Credential Form Component */}
      <div className="mt-8">
        <CredentialForm
          isLoading={isLoading}
          onSubmit={onSubmit}
          onForgotPassword={onForgotPassword}
        />
      </div>

      {/* Or Continue With Divider */}
      <div className="relative my-7 flex items-center justify-center">
        <div className="w-full border-t border-slate-200/90" />
        <span className="absolute bg-white px-4 font-mono text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Or Continue With
        </span>
      </div>

      {/* SSO Buttons Component */}
      <SsoButtons
        disabled={isLoading}
        onGoogleSignIn={onGoogleSignIn}
        onMicrosoftSignIn={onMicrosoftSignIn}
      />

      {/* Request Invitation & Sign Up Link */}
      <div className="mt-7 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onRequestInvitation}
          className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors cursor-pointer"
        >
          Request Invitation &amp; Sign Up
        </button>
      </div>

      {/* Ledger Compliance Badge Component */}
      <div className="mt-7">
        <LedgerComplianceBadge />
      </div>
    </div>
  )
}
