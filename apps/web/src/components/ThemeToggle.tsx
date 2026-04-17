import { useTheme } from '#/lib/hooks'

export default function ThemeToggle() {
  const [theme, , toggle] = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="theme-toggle"
    >
      <span className="theme-toggle__track">
        <span
          className="theme-toggle__thumb"
          data-theme={theme}
          aria-hidden="true"
        />
      </span>
      <span className="font-mono theme-toggle__label" aria-hidden="true">
        {theme === 'light' ? 'LIGHT' : 'DARK'}
      </span>
    </button>
  )
}
