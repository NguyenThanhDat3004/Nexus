import { NexusLogo } from '@nexus/ui'

/** Nexus logo as used on the landing page: shared mark with a violet glow for the dark background. */
export function Brand({ className = '' }: { className?: string }) {
  return (
    <NexusLogo
      className={`text-ink ${className}`}
      markClassName="drop-shadow-[0_4px_14px_rgb(124_108_255_/_0.45)]"
    />
  )
}

const LOGOS = {
  jira: '/logos/jira.svg',
  github: '/logos/github.svg',
} as const

const NAMES = { jira: 'Jira', github: 'GitHub' } as const

/** Jira and GitHub marks from Simple Icons (CC0), self-hosted in public/logos and tinted for the dark page. */
export function ToolLogo({ tool, size = 16 }: { tool: keyof typeof LOGOS; size?: number }) {
  return (
    <img src={LOGOS[tool]} alt={NAMES[tool]} width={size} height={size} loading="lazy" className="shrink-0" />
  )
}
