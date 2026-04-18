import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useActiveSection } from '#/lib/hooks'
import LogoMark from './LogoMark'
import ThemeToggle from './ThemeToggle'

const SECTION_IDS = ['anatomy', 'layers', 'compare', 'faq', 'install'] as const
const NAV_ITEMS: Array<[string, string]> = [
  ['Anatomy', '#anatomy'],
  ['Layers', '#layers'],
  ['Compare', '#compare'],
  ['FAQ', '#faq'],
  ['Install', '#install'],
]

export default function Header() {
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="topbar sticky top-0 z-50">
      <div className="frame flex items-center gap-8 py-4">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <LogoMark className="text-(--ink)" />
          <span className="font-mono text-[0.78rem] font-medium uppercase tracking-[0.16em] text-(--ink)">
            permx
          </span>
          <span className="font-mono text-[0.64rem] uppercase tracking-[0.12em] text-(--granite)">
            v0.4
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map(([label, href]) => {
            const id = href.slice(1)
            const isActive = active === id
            return (
              <a
                key={href}
                href={href}
                className={`nav-link ${isActive ? 'is-active' : ''}`}
              >
                {label}
              </a>
            )
          })}
          <Link to="/docs/getting-started" className="nav-link">
            Docs
          </Link>
          <a
            href="https://github.com/Umair-N/permx"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            GitHub ↗
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <ThemeToggle />

          <a
            href="#install"
            className="btn btn--cobalt hidden md:inline-flex"
          >
            <span aria-hidden>↓</span>
            install
          </a>

          <button
            type="button"
            className="md:hidden font-mono text-[0.7rem] uppercase tracking-[0.14em] border border-(--ink) px-3 py-2"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'close' : 'menu'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-nav md:hidden">
          {NAV_ITEMS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="font-display text-[2.25rem] leading-none text-(--ink)"
            >
              {label}
            </a>
          ))}
          <Link
            to="/docs/getting-started"
            onClick={() => setOpen(false)}
            className="font-display text-[2.25rem] leading-none text-(--ink)"
          >
            Docs
          </Link>
          <a
            href="https://github.com/Umair-N/permx"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="font-display text-[2.25rem] leading-none text-(--cobalt)"
          >
            GitHub ↗
          </a>
          <a
            href="#install"
            onClick={() => setOpen(false)}
            className="btn btn--cobalt mt-4 self-start"
          >
            <span aria-hidden>↓</span>
            install
          </a>
        </div>
      )}
    </header>
  )
}

