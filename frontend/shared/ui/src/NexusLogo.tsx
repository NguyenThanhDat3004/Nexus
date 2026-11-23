import markUrl from './assets/nexus-mark.svg'

type NexusLogoProps = {
  /** Mark size in px. The wordmark scales with the surrounding font size. */
  size?: number
  /** Hide the "Nexus" wordmark and show the mark only. */
  markOnly?: boolean
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}

/**
 * Official Nexus logo: the mark from docs/assets/logo/nexus-mark.svg plus the wordmark set as
 * live text (Inter 800, tight tracking) so it stays crisp and inherits the page's text colour.
 */
export function NexusLogo({
  size = 30,
  markOnly = false,
  className = '',
  markClassName = '',
  wordmarkClassName = 'text-lg',
}: NexusLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src={markUrl} alt={markOnly ? 'Nexus' : ''} width={size} height={size} className={`shrink-0 ${markClassName}`} />
      {!markOnly && <span className={`font-extrabold tracking-[-0.03em] ${wordmarkClassName}`}>Nexus</span>}
    </span>
  )
}
