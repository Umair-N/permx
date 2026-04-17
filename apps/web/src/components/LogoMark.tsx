interface LogoMarkProps {
  size?: number
  className?: string
  title?: string
}

export default function LogoMark({
  size = 24,
  className,
  title,
}: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line x1="0" y1="6" x2="2" y2="6" stroke="currentColor" strokeWidth="1" />
      <line
        x1="0"
        y1="18"
        x2="2"
        y2="18"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="22"
        y1="6"
        x2="24"
        y2="6"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="22"
        y1="18"
        x2="24"
        y2="18"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M6 6 H16 V14 H8 V18 H6 Z" fill="currentColor" />
      <rect x="10" y="8" width="4" height="4" fill="var(--cobalt)" />
    </svg>
  )
}
