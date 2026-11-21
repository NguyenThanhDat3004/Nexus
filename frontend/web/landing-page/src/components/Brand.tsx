/**
 * Official Nexus logo: the mark from docs/assets/logo/nexus-mark.svg (served from /public)
 * plus the wordmark set as live text in Inter 800, matching nexus-logo-dark.svg.
 */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/nexus-mark.svg"
        alt=""
        width={30}
        height={30}
        className="size-[30px] shrink-0 drop-shadow-[0_4px_14px_rgb(124_108_255_/_0.45)]"
      />
      <span className="text-lg font-extrabold tracking-[-0.03em] text-ink">Nexus</span>
    </span>
  )
}

const LOGOS = {
  jira: 'https://cdn.simpleicons.org/jira/4C9AFF',
  github: 'https://cdn.simpleicons.org/github/eef0fb',
} as const

const NAMES = { jira: 'Jira', github: 'GitHub' } as const

/** Brand logos from Simple Icons, tinted for the dark page. */
export function ToolLogo({ tool, size = 16 }: { tool: keyof typeof LOGOS; size?: number }) {
  return (
    <img src={LOGOS[tool]} alt={NAMES[tool]} width={size} height={size} loading="lazy" className="shrink-0" />
  )
}
