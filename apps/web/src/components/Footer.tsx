import { Link } from '@tanstack/react-router'

const REPO = 'https://github.com/Umair-N/permx'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="rule-h mt-28 pb-12 pt-10">
      <div className="frame grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-(--granite)">
            {"// permx"}
          </p>
          <p className="font-display mt-3 text-[1.35rem] leading-tight text-(--ink)">
            Structured RBAC.
            <br />
            <span className="italic-accent">Without the abstraction tax.</span>
          </p>
        </div>

        <FooterCol
          title="Packages"
          links={[
            ['@permx/core', 'https://www.npmjs.com/package/@permx/core'],
            ['@permx/react', 'https://www.npmjs.com/package/@permx/react'],
            ['Source · core', `${REPO}/tree/main/packages/core`],
            ['Source · react', `${REPO}/tree/main/packages/react`],
          ]}
        />
        <FooterCol
          title="Reference"
          links={[
            ['Getting Started', '/docs/getting-started'],
            ['Anatomy', '#anatomy'],
            ['Three-Layer Model', '#layers'],
            ['Compare', '#compare'],
            ['PermX vs CASL', '/vs/casl'],
            ['PermX vs Casbin', '/vs/casbin'],
          ]}
        />
        <FooterCol
          title="Source"
          links={[
            ['GitHub ↗', REPO],
            ['Issues ↗', `${REPO}/issues`],
            ['Releases ↗', `${REPO}/releases`],
            ['MIT License ↗', `${REPO}/blob/main/LICENSE`],
          ]}
        />
      </div>

      <div className="frame rule-h-soft mt-10 flex flex-wrap items-baseline justify-between gap-3 pt-5">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-(--granite)">
          ©{year} permx — MIT — zero-dep core — 261 tests
        </p>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-(--granite)">
          built · tanstack start · react 19
        </p>
      </div>
    </footer>
  )
}

interface FooterColProps {
  title: string
  links: Array<[string, string]>
}

function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => {
          const external = href.startsWith('http')
          const hash = href.startsWith('#')
          const linkClass =
            'font-mono text-[0.8rem] text-(--ink) underline decoration-(--rule) underline-offset-4 hover:decoration-(--ink)'
          return (
            <li key={label}>
              {external || hash ? (
                <a
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className={linkClass}
                >
                  {label}
                </a>
              ) : (
                <Link to={href} className={linkClass}>
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
