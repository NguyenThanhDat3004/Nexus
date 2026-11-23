import markUrl from '../assets/nexus-mark.svg'

type NexusLogoProps = {
  size?: number
  markOnly?: boolean
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}

export function NexusLogo({
  size = 36,
  markOnly = false,
  className = '',
  markClassName = '',
  wordmarkClassName = 'text-2xl',
}: NexusLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={markUrl}
        alt="Nexus"
        width={size}
        height={size}
        className={`shrink-0 drop-shadow-[0_4px_16px_rgba(79,70,229,0.35)] ${markClassName}`}
      />
      {!markOnly && (
        <span className={`font-extrabold tracking-[-0.03em] text-slate-900 ${wordmarkClassName}`}>
          Nexus
        </span>
      )}
    </span>
  )
}
