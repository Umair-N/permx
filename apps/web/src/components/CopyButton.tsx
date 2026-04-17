import { useCopy } from '#/lib/hooks'

interface CopyButtonProps {
  value: string
  label?: string
}

export default function CopyButton({ value, label = 'copy' }: CopyButtonProps) {
  const { copied, copy } = useCopy()
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="copy-btn font-mono"
      aria-label={copied ? 'Copied' : `Copy ${label}`}
    >
      <span aria-hidden="true">{copied ? '✓' : '⎘'}</span>
      {copied ? 'COPIED' : label.toUpperCase()}
    </button>
  )
}
