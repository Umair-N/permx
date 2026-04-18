import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import CopyButton from '#/components/CopyButton'
import { useCountUp, useNpmPackage, useReveal, type NpmInfo } from '#/lib/hooks'
import { SITE_URL } from '#/lib/site'

export const Route = createFileRoute('/')({
  head: () => ({
    links: [{ rel: 'canonical', href: SITE_URL }],
  }),
  component: Landing,
})

const REPO = 'https://github.com/Umair-N/permx'

function Landing() {
  return (
    <>
      <Ticker />
      <Hero />
      <Manifesto />
      <Anatomy />
      <BeforeAfter />
      <Layers />
      <Inheritance />
      <CodeSplit />
      <Compare />
      <Stats />
      <FAQ />
      <Contributors />
      <Install />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* SHEET LABEL — blueprint drawing sheet pagination                     */
/* ------------------------------------------------------------------ */

function SheetLabel({ n, total = 12, name }: { n: number; total?: number; name: string }) {
  return (
    <div className="sheet-label" aria-hidden="true">
      <p className="sheet-label__num">permx.drawing.v0.4</p>
      <p className="sheet-label__num">
        sheet {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <p className="sheet-label__num">§ {name}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TICKER                                                              */
/* ------------------------------------------------------------------ */

function Ticker() {
  type Kind = 'text' | 'accent' | 'arrow' | 'sep'
  const items: Array<[string, Kind]> = [
    ['module', 'text'],
    ['·', 'sep'],
    ['resource', 'text'],
    ['·', 'sep'],
    ['field', 'text'],
    ['·', 'sep'],
    ['action', 'text'],
    ['·', 'sep'],
    ['scope', 'text'],
    ['→', 'arrow'],
    ['zero runtime deps', 'accent'],
    ['///', 'sep'],
    ['diamond-safe inheritance', 'text'],
    ['→', 'arrow'],
    ['framework-agnostic', 'text'],
    ['///', 'sep'],
    ['headless react sdk', 'text'],
    ['→', 'arrow'],
    ['~5 KB', 'accent'],
    ['///', 'sep'],
  ]
  const doubled = [...items, ...items]
  return (
    <div className="rule-h-soft border-b border-(--rule-strong) overflow-hidden bg-(--paper-deep) py-2.5">
      <div className="marquee-track">
        {doubled.map(([text, kind], i) => (
          <span
            key={i}
            className={[
              'font-mono mx-4 text-[0.72rem] font-medium uppercase tracking-[0.14em]',
              kind === 'accent' ? 'ticker-item--accent' : '',
              kind === 'arrow' ? 'ticker-item--arrow' : '',
              kind === 'text' || kind === 'sep' ? 'text-(--ink)' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* HERO                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="frame relative pt-16 pb-20 md:pt-24 md:pb-28">
      <SheetLabel n={1} name="hero" />

      <div className="flex items-baseline gap-3">
        <span className="tag">Release 0.4 · Apr 2026</span>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
          ——— permx/core · permx/react
        </span>
      </div>

      <h1 className="display-xl rise-auto mt-8 max-w-[18ch] text-(--ink)">
        Structured RBAC
        <br />
        for the apps{' '}
        <span className="italic-accent">you actually&nbsp;ship.</span>
      </h1>

      <p className="rise-auto mt-8 max-w-[58ch] text-[1.05rem] leading-[1.6] text-(--ink-soft)" style={{ animationDelay: '80ms' }}>
        Permission keys with meaning. Roles that inherit without cycles. UI
        mappings baked into every rule. A framework-agnostic engine with{' '}
        <strong>zero runtime dependencies</strong>, paired with a headless React
        SDK that weighs ~5 KB.
      </p>

      <div className="rise-auto mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: '160ms' }}>
        <a href="#install" className="btn btn--cobalt">
          <span aria-hidden>⌘</span>
          bun add @permx/core
        </a>
        <a href="#anatomy" className="btn btn--ghost">
          Read the anatomy →
        </a>
        <span className="font-mono ml-2 text-[0.7rem] uppercase tracking-[0.12em] text-(--granite)">
          MIT · TypeScript 5.7+ · Node 18+
        </span>
      </div>

      <HeroKey />
    </section>
  )
}

/* --- interactive anatomy diagram with click/hover --- */

function HeroKey() {
  type Part = { id: string; text: string; cls: string; label: string; tone: string; denialCopy: string }
  const parts: Array<Part> = [
    { id: 'mod', text: 'projects', cls: 'anatomy-seg--mod', label: 'MODULE', tone: 'cobalt', denialCopy: 'No module grant.' },
    { id: 'res', text: 'tasks', cls: 'anatomy-seg--res', label: 'RESOURCE', tone: 'vermilion', denialCopy: 'Resource not reachable.' },
    { id: 'fld', text: 'revenue', cls: 'anatomy-seg--fld', label: 'FIELD', tone: 'cobalt-deep', denialCopy: 'Field masked · redacted.' },
    { id: 'act', text: 'view', cls: 'anatomy-seg--act', label: 'ACTION', tone: 'ochre', denialCopy: 'Action missing.' },
    { id: 'scp', text: 'own', cls: 'anatomy-seg--scp', label: 'SCOPE', tone: 'moss', denialCopy: 'Scope out of bounds.' },
  ]

  const [denied, setDenied] = useState<Set<string>>(new Set())
  const [hot, setHot] = useState<string | null>(null)

  const toggleDeny = (id: string) =>
    setDenied((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const allowed = denied.size === 0
  const verdict = allowed ? 'ALLOW · authorize()' : `DENY · ${parts.find((p) => denied.has(p.id))?.denialCopy}`

  return (
    <div className="rise-auto relative mt-16 border-y border-(--rule-strong) bg-(--paper) py-10 md:py-16" style={{ animationDelay: '240ms' }}>
      <div className="flex items-center justify-between pb-6">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
          FIG.01 — permission-key anatomy · click to deny a coordinate
        </p>
        <p className="font-mono hidden text-[0.68rem] uppercase tracking-[0.14em] text-(--granite) md:block">
          module.resource:field.action.scope
        </p>
      </div>

      <div className="anatomy overflow-x-auto py-4 text-center">
        <div className="inline-block whitespace-nowrap text-[clamp(1.6rem,5.2vw,4rem)] font-medium">
          {parts.map((p, i) => (
            <span key={p.id}>
              {i > 0 && (
                <span className={i === 2 ? 'anatomy-colon' : 'anatomy-dot'}>
                  {i === 2 ? ':' : '.'}
                </span>
              )}
              <button
                type="button"
                className={[
                  'anatomy-seg',
                  p.cls,
                  hot === p.id ? 'is-hot' : '',
                  denied.has(p.id) ? 'is-denied' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHot(p.id)}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot(p.id)}
                onBlur={() => setHot(null)}
                onClick={() => toggleDeny(p.id)}
                aria-pressed={denied.has(p.id)}
                aria-label={`Toggle deny for ${p.label}`}
              >
                {p.text}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div
        className="mx-auto mt-4 max-w-max border border-(--rule-strong) px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em]"
        style={{
          color: allowed ? 'var(--moss)' : 'var(--vermilion)',
          background: allowed
            ? 'color-mix(in oklab, var(--moss) 10%, transparent)'
            : 'color-mix(in oklab, var(--vermilion) 10%, transparent)',
        }}
        role="status"
        aria-live="polite"
      >
        {verdict}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-5">
        {parts.map((p) => (
          <div
            key={p.label}
            className={[
              'flex flex-col items-start gap-2 transition-opacity',
              hot && hot !== p.id ? 'opacity-45' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span
              className="h-[2px] w-10 transition-[width] duration-200"
              style={{
                background: toneToVar(p.tone),
                width: hot === p.id ? '4rem' : '2.5rem',
              }}
            />
            <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
              {p.label}
            </p>
            <p className="font-mono text-[0.72rem] leading-relaxed text-(--granite)">
              {legendFor(p.label)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function toneToVar(t: string): string {
  switch (t) {
    case 'cobalt':
      return 'var(--cobalt)'
    case 'vermilion':
      return 'var(--vermilion)'
    case 'cobalt-deep':
      return 'var(--cobalt-deep)'
    case 'ochre':
      return 'var(--ochre)'
    case 'moss':
      return 'var(--moss)'
    default:
      return 'var(--ink)'
  }
}

function legendFor(label: string): string {
  switch (label) {
    case 'MODULE':
      return 'Top-level product area. projects, billing, admin.'
    case 'RESOURCE':
      return 'What you act on. tasks, invoices, users.'
    case 'FIELD':
      return 'Optional. Column-level gate. revenue, salary.'
    case 'ACTION':
      return 'view · create · update · delete · manage.'
    case 'SCOPE':
      return 'all · own · team · department · self · public · admin.'
    default:
      return ''
  }
}

/* ------------------------------------------------------------------ */
/* SECTION WRAPPER w/ reveal + sheet label                              */
/* ------------------------------------------------------------------ */

function SectionShell({
  id,
  sheet,
  sheetName,
  children,
  className = '',
}: {
  id?: string
  sheet: number
  sheetName: string
  children: React.ReactNode
  className?: string
}) {
  const { ref, shown } = useReveal<HTMLElement>()
  return (
    <section
      id={id}
      ref={ref}
      className={`frame rule-h relative pt-16 pb-20 rise ${shown ? 'is-in' : ''} ${className}`}
    >
      <SheetLabel n={sheet} name={sheetName} />
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* MANIFESTO                                                           */
/* ------------------------------------------------------------------ */

function Manifesto() {
  return (
    <SectionShell sheet={2} sheetName="thesis">
      <div className="grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-20">
        <div>
          <span className="tag">§ 01 · thesis</span>
          <p className="font-mono mt-6 text-[0.7rem] uppercase tracking-[0.14em] text-(--granite)">
            why not a flat string?
          </p>
        </div>
        <div>
          <h2 className="display-lg text-(--ink)">
            Flat strings pretend authorization is{' '}
            <span className="italic-accent">a vocabulary problem.</span> It
            isn't. It's a coordinate problem.
          </h2>
          <p className="dropcap mt-8 max-w-[58ch] text-[1rem] leading-[1.7] text-(--ink-soft)">
            When your app has 300 permissions, <code className="key-chip">read:users</code>{' '}
            and <code className="key-chip">view_user</code> drift apart,
            middleware forgets, and the UI hardcodes its own rules. PermX fixes
            each permission at a point in the product — module, resource,
            field, action, scope — so backend checks and UI gates speak the
            same language, and a refactor renames it in one place.
          </p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              ['ABAC', 'Too abstract. Policy language per app.'],
              ['Flat RBAC', 'String soup. No UI contract.'],
              ['Proprietary SaaS', 'Vendor-locked. Your rules, their DB.'],
              ['PermX', 'Coordinates. Zero deps. Yours forever.'],
            ].map(([a, b], i) => (
              <li
                key={a}
                className={`marks relative border border-(--rule-strong) bg-(--paper) p-5 ${
                  i === 3 ? 'bg-(--ink) text-(--paper)' : ''
                }`}
              >
                <p className={`font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${i === 3 ? 'text-(--citrine)' : 'text-(--cobalt)'}`}>
                  {a}
                </p>
                <p className="mt-2 text-[0.92rem] leading-snug">{b}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* ANATOMY — five coordinates                                          */
/* ------------------------------------------------------------------ */

function Anatomy() {
  const coords = [
    {
      sym: 'M',
      name: 'Module',
      example: 'projects',
      body: 'Top-level product surface. Seeded once, referenced everywhere.',
    },
    {
      sym: 'R',
      name: 'Resource',
      example: 'tasks',
      body: 'The entity or collection being accessed. The noun of every check.',
    },
    {
      sym: 'F',
      name: 'Field',
      example: ':revenue',
      body: 'Optional column-level gate. Use for salaries, PII, payment data.',
    },
    {
      sym: 'A',
      name: 'Action',
      example: 'view',
      body: 'Fixed enum: view, create, update, delete, manage. No drift.',
    },
    {
      sym: 'S',
      name: 'Scope',
      example: 'own',
      body: 'Row-level boundary: all, own, team, department, self, public, admin.',
    },
  ]
  return (
    <SectionShell id="anatomy" sheet={3} sheetName="coordinates">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="tag">§ 02 · coordinates</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            Five coordinates. One{' '}
            <span className="italic-accent">permission key.</span>
          </h2>
        </div>
        <p className="font-mono hidden max-w-[32ch] text-[0.72rem] uppercase leading-relaxed tracking-[0.12em] text-(--granite) md:block">
          each field has a fixed grammar — typos fail at compile time when you
          use `definePermissions()`
        </p>
      </div>

      <div className="mt-12 grid gap-0 border border-(--rule-strong) md:grid-cols-3 lg:grid-cols-5">
        {coords.map((c, i) => (
          <div
            key={c.name}
            className={`group relative flex flex-col p-6 ${borderForGrid(i, coords.length)}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[3.5rem] leading-none text-(--cobalt)">
                {c.sym}
              </span>
              <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--granite)">
                0{i + 1}
              </span>
            </div>
            <p className="font-mono mt-5 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
              {c.name}
            </p>
            <code className="font-mono mt-2 text-[0.9rem] text-(--vermilion)">
              {c.example}
            </code>
            <p className="mt-4 text-[0.88rem] leading-[1.55] text-(--ink-soft)">
              {c.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
            definePermissions() · literal-string types preserved
          </p>
          <p className="mt-4 text-[1rem] leading-[1.65] text-(--ink-soft)">
            Declare your permissions once. TypeScript infers the literal key
            strings and hands you autocomplete across middleware, hooks, and
            gates. Rename a coordinate — the compiler finds every call site.
          </p>
        </div>
        <TypedKeysCode />
      </div>
    </SectionShell>
  )
}

function borderForGrid(i: number, _total: number): string {
  return i < _total - 1
    ? 'border-b border-(--rule-strong) lg:border-b-0 lg:border-r md:border-r md:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r'
    : ''
}

function TypedKeysCode() {
  const raw = `// permissions.ts — single source of truth
import { definePermissions, type PermissionKeyOf } from '@permx/core'

export const P = definePermissions({
  projectsView: { module: 'projects', resource: 'tasks', action: 'view', scope: 'all' },
  viewSalary:   { module: 'people', resource: 'employees', action: 'view', scope: 'own', field: 'salary' },
} as const);

// → "people.employees:salary.view.own" (literal type)
type AppPerm = PermissionKeyOf<typeof P>;`

  return (
    <CodeChrome filename="permissions.ts" value={raw}>
      <pre>
        <CodeLine n={1} text={[[`c`, `// permissions.ts — single source of truth`]]} />
        <CodeLine n={2} text={[[`k`, `import `], [`v`, `{ definePermissions, type PermissionKeyOf }`], [`k`, ` from `], [`s`, `'@permx/core'`]]} />
        <CodeLine n={3} text={[]} />
        <CodeLine n={4} text={[[`k`, `export const `], [`f`, `P`], [`v`, ` = `], [`f`, `definePermissions`], [`v`, `({`]]} />
        <CodeLine n={5} text={[[`v`, `  projectsView: `], [`v`, `{ module: `], [`s`, `'projects'`], [`v`, `, resource: `], [`s`, `'tasks'`], [`v`, `, action: `], [`s`, `'view'`], [`v`, `, scope: `], [`s`, `'all'`], [`v`, ` },`]]} />
        <CodeLine n={6} text={[[`v`, `  viewSalary:   `], [`v`, `{ module: `], [`s`, `'people'`], [`v`, `, resource: `], [`s`, `'employees'`], [`v`, `, action: `], [`s`, `'view'`], [`v`, `, scope: `], [`s`, `'own'`], [`v`, `, field: `], [`s`, `'salary'`], [`v`, ` },`]]} />
        <CodeLine n={7} text={[[`v`, `} `], [`k`, `as const`], [`v`, `);`]]} />
        <CodeLine n={8} text={[]} />
        <CodeLine n={9} text={[[`c`, `// → "people.employees:salary.view.own" (literal type)`]]} />
        <CodeLine n={10} text={[[`k`, `type `], [`n`, `AppPerm`], [`v`, ` = `], [`f`, `PermissionKeyOf`], [`v`, `<typeof P>;`]]} />
      </pre>
    </CodeChrome>
  )
}

function CodeLine({
  n,
  text,
}: {
  n: number
  text: Array<[string, string]>
}) {
  return (
    <span className="block">
      <span className="ln">{String(n).padStart(2, '0')}</span>
      {text.map(([cls, value], i) => (
        <span key={i} className={cls}>
          {value}
        </span>
      ))}
      {'\n'}
    </span>
  )
}

function CodeChrome({
  filename,
  value,
  children,
}: {
  filename: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="code-chrome">
      <div className="code-chrome__bar">
        <span className="inline-flex items-center gap-3">
          <span className="code-chrome__dots">
            <span className="code-chrome__dot" />
            <span className="code-chrome__dot" />
            <span className="code-chrome__dot" />
          </span>
          {filename}
        </span>
        <CopyButton value={value} />
      </div>
      <div className="code-block">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BEFORE/AFTER — kill flat strings                                     */
/* ------------------------------------------------------------------ */

function BeforeAfter() {
  return (
    <SectionShell sheet={4} sheetName="diff">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="tag">§ 03 · before · after</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            Delete string soup.
            <br />
            <span className="italic-accent">Keep the refactor.</span>
          </h2>
        </div>
        <p className="font-mono hidden max-w-[28ch] text-[0.72rem] uppercase tracking-[0.12em] text-(--granite) md:block">
          one renamed coordinate · compiler finds every call site
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
            BEFORE · flat-string rbac
          </p>
          <div className="code-chrome mt-3">
            <div className="code-chrome__bar">
              <span className="inline-flex items-center gap-3">
                <span className="code-chrome__dots">
                  <span className="code-chrome__dot" />
                  <span className="code-chrome__dot" />
                  <span className="code-chrome__dot" />
                </span>
                routes.ts
              </span>
              <span className="font-mono text-[0.62rem] text-(--vermilion)">
                drift · no types
              </span>
            </div>
            <div className="code-block">
              <pre>
                <DiffLine sign="-" cls="del">{`if (user.perms.includes('read:users'))`}</DiffLine>
                <DiffLine sign="-" cls="del">{`if (user.perms.includes('view_user'))`}</DiffLine>
                <DiffLine sign="-" cls="del">{`if (user.perms.includes('users.read'))`}</DiffLine>
                <DiffLine sign="-" cls="del">{`// UI layer hardcodes its own rules`}</DiffLine>
                <DiffLine sign="-" cls="del">{`if (role === 'admin' || role === 'adm')`}</DiffLine>
                <DiffLine sign="-" cls="del">{`// one rename = grep across 40 files`}</DiffLine>
              </pre>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
            AFTER · permx structured keys
          </p>
          <div className="code-chrome mt-3">
            <div className="code-chrome__bar">
              <span className="inline-flex items-center gap-3">
                <span className="code-chrome__dots">
                  <span className="code-chrome__dot" />
                  <span className="code-chrome__dot" />
                  <span className="code-chrome__dot" />
                </span>
                routes.ts
              </span>
              <span className="font-mono text-[0.62rem] text-(--moss)">
                typed · rename-safe
              </span>
            </div>
            <div className="code-block">
              <pre>
                <DiffLine sign="+" cls="add">{`auth.authorize(P.usersRead)`}</DiffLine>
                <DiffLine sign="+" cls="add">{`<Can componentId="users-table">`}</DiffLine>
                <DiffLine sign="+" cls="add">{`<CanField fieldId="salary" />`}</DiffLine>
                <DiffLine sign="+" cls="add">{`<RouteGuard routeId="/admin" />`}</DiffLine>
                <DiffLine sign="+" cls="add">{`// rename 'users' → 'members':`}</DiffLine>
                <DiffLine sign="+" cls="add">{`// every call site fails typecheck.`}</DiffLine>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

function DiffLine({
  sign,
  cls,
  children,
}: {
  sign: '+' | '-'
  cls: 'add' | 'del'
  children: string
}) {
  return (
    <span className={`diff-line diff-line--${cls}`}>
      <span className="diff-line__sign">{sign}</span>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* THREE-LAYER MODEL                                                   */
/* ------------------------------------------------------------------ */

function Layers() {
  return (
    <SectionShell id="layers" sheet={5} sheetName="effective-set">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <div>
          <span className="tag">§ 04 · effective-set</span>
          <h2 className="display-lg mt-5 max-w-[18ch] text-(--ink)">
            Three independent layers.{' '}
            <span className="italic-accent">One union.</span>
          </h2>
          <p className="mt-6 max-w-[46ch] text-[1rem] leading-[1.65] text-(--ink-soft)">
            Effective permissions = Regular Roles ∪ Subscription Plan ∪
            Feature Flags. Each layer flows from its own system of record — job
            function, Stripe webhook, rollout toggle — without a custom
            policy engine to glue them together.
          </p>
          <p className="font-mono mt-8 text-[0.72rem] uppercase tracking-[0.14em] text-(--granite)">
            resolver runs on every authorize() call
            <br />
            ttl cache keyed by tenantId::userId
          </p>
        </div>

        <div className="relative">
          <div className="absolute -top-6 right-0 font-display text-[6rem] leading-none text-(--cobalt)/20">
            ∪
          </div>
          <div className="space-y-4">
            <div className="layer layer--1">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
                  Layer 01 — Regular Roles
                </p>
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--granite)">
                  per-user
                </span>
              </div>
              <p className="mt-2 text-[0.9rem] leading-snug text-(--ink-soft)">
                Job-function assignments. Editor, Viewer, Admin. DFS
                inheritance with cycle protection, depth cap 10.
              </p>
            </div>
            <div className="layer layer--2">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
                  Layer 02 — Subscription
                </p>
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--ink-soft)">
                  per-tenant
                </span>
              </div>
              <p className="mt-2 text-[0.9rem] leading-snug text-(--ink-soft)">
                Plan tier features. Free, Pro, Enterprise. Resolver takes
                tenantId and returns role ids — Stripe webhooks update a
                single column.
              </p>
            </div>
            <div className="layer layer--3">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
                  Layer 03 — Feature Flags
                </p>
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--citrine)">
                  per-tenant
                </span>
              </div>
              <p className="mt-2 text-[0.9rem] leading-snug text-(--paper-line)">
                Gradual rollouts. Beta AI assistant, experimental UI. Same
                permission grammar — no separate flag SDK.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* INHERITANCE DIAMOND — SVG w/ abs-positioned nodes                   */
/* ------------------------------------------------------------------ */

function Inheritance() {
  /* Nodes defined in percentage coords — SVG draws lines to same points */
  const nodes = useMemo(
    () => [
      { id: 'owner', label: 'Owner', x: 50, y: 12, variant: 'cobalt' },
      { id: 'admin', label: 'Admin', x: 50, y: 38 },
      { id: 'editor', label: 'Editor', x: 24, y: 64 },
      { id: 'billing', label: 'Billing', x: 76, y: 64 },
      { id: 'viewer', label: 'Viewer', x: 50, y: 90, variant: 'vermilion' },
    ],
    [],
  )

  const edges: Array<[string, string, 'ink' | 'cobalt']> = [
    ['owner', 'admin', 'ink'],
    ['admin', 'editor', 'ink'],
    ['admin', 'billing', 'ink'],
    ['editor', 'viewer', 'cobalt'],
    ['billing', 'viewer', 'cobalt'],
  ]

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <SectionShell id="inheritance" sheet={6} sheetName="inheritance">
      <div className="flex items-end justify-between">
        <div>
          <span className="tag">§ 05 · inheritance</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            Diamond-safe DFS.
            <br />
            <span className="italic-accent">Cycles die quietly.</span>
          </h2>
        </div>
        <p className="font-mono hidden max-w-[30ch] text-[0.72rem] uppercase tracking-[0.14em] text-(--granite) md:block">
          depth cap 10 · visited-set dedupe · union merge
        </p>
      </div>

      <div className="diagram-wrap mt-12">
        <div className="diagram-stage">
          <svg
            className="wires"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {edges.map(([a, b, color], i) => {
              const na = nodeById[a]
              const nb = nodeById[b]
              return (
                <line
                  key={i}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={color === 'cobalt' ? 'var(--cobalt)' : 'var(--ink)'}
                  strokeWidth="0.3"
                  strokeDasharray="1.2 0.9"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            <circle
              cx={nodeById['viewer'].x}
              cy={nodeById['viewer'].y}
              r="4.5"
              fill="none"
              stroke="var(--vermilion)"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <p className="sr-only">
            Role inheritance graph. Owner inherits Admin, which splits into
            Editor and Billing. Both Editor and Billing inherit Viewer — a
            diamond topology that PermX resolves with a visited-set DFS.
          </p>

          {nodes.map((n) => (
            <div
              key={n.id}
              className="node-abs"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <div
                className={[
                  'node',
                  n.variant === 'cobalt' ? 'node--cobalt' : '',
                  n.variant === 'vermilion' ? 'node--vermilion' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {n.label}
              </div>
            </div>
          ))}

          <span
            className="absolute font-mono text-[0.62rem] uppercase tracking-[0.16em] text-(--vermilion)"
            style={{ left: `calc(${nodeById['viewer'].x}% + 3rem)`, top: `${nodeById['viewer'].y}%`, transform: 'translateY(-50%)' }}
          >
            DIAMOND
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Spec label="visited-set" value="Set<string> — O(n) dedupe" />
        <Spec label="depth cap" value="10 — DoS guard, emits warning" />
        <Spec label="merge strategy" value="Set union — order-independent" />
      </div>
    </SectionShell>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-(--rule-strong) pt-4">
      <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
        {label}
      </p>
      <p className="font-mono mt-1 text-[0.88rem] text-(--ink)">{value}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CODE SPLIT (backend + react)                                        */
/* ------------------------------------------------------------------ */

function CodeSplit() {
  const backend = `import { createPermXMiddleware } from '@permx/core/express'

const auth = createPermXMiddleware(permx, {
  extractUserId: (req) => req.user?.id,
});

app.get('/projects',
  auth.authorize(P.projectsView),
  listProjects);

// 403 auto-sent. typed permission key.
// swap for hono / fastify — same engine.`

  const frontend = `import { Can, CanField, RouteGuard } from '@permx/react'

<Can componentId="edit-project-btn">
  <EditButton />
</Can>

<CanField fieldId="salary">
  <SalaryInput />
</CanField>

<RouteGuard routeId="/admin" fallback={<NoAccess />}>
  <AdminPage />
</RouteGuard>`

  return (
    <SectionShell sheet={7} sheetName="implementation">
      <div className="flex items-end justify-between">
        <div>
          <span className="tag">§ 06 · implementation</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            One key.{' '}
            <span className="italic-accent">Two sides of the wire.</span>
          </h2>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <CodePanel
          label="01 — BACKEND · @permx/core/express"
          title="Protect the route."
          filename="server.ts"
          value={backend}
        >
          <CodeLine n={1} text={[[`k`, `import `], [`v`, `{ createPermXMiddleware }`], [`k`, ` from `], [`s`, `'@permx/core/express'`]]} />
          <CodeLine n={2} text={[]} />
          <CodeLine n={3} text={[[`k`, `const `], [`v`, `auth = `], [`f`, `createPermXMiddleware`], [`v`, `(permx, {`]]} />
          <CodeLine n={4} text={[[`v`, `  extractUserId: `], [`p`, `(req)`], [`v`, ` => req.user?.id,`]]} />
          <CodeLine n={5} text={[[`v`, `});`]]} />
          <CodeLine n={6} text={[]} />
          <CodeLine n={7} text={[[`v`, `app.`], [`f`, `get`], [`v`, `(`], [`s`, `'/projects'`], [`v`, `,`]]} />
          <CodeLine n={8} text={[[`v`, `  auth.`], [`f`, `authorize`], [`v`, `(`], [`n`, `P.projectsView`], [`v`, `),`]]} />
          <CodeLine n={9} text={[[`v`, `  listProjects);`]]} />
          <CodeLine n={10} text={[]} />
          <CodeLine n={11} text={[[`c`, `// 403 auto-sent. typed permission key.`]]} />
          <CodeLine n={12} text={[[`c`, `// swap for hono / fastify — same engine.`]]} />
        </CodePanel>

        <CodePanel
          label="02 — FRONTEND · @permx/react"
          title="Gate the UI."
          filename="App.tsx"
          value={frontend}
        >
          <CodeLine n={1} text={[[`k`, `import `], [`v`, `{ Can, CanField, RouteGuard }`], [`k`, ` from `], [`s`, `'@permx/react'`]]} />
          <CodeLine n={2} text={[]} />
          <CodeLine n={3} text={[[`v`, `<`], [`n`, `Can`], [`v`, ` componentId=`], [`s`, `"edit-project-btn"`], [`v`, `>`]]} />
          <CodeLine n={4} text={[[`v`, `  <`], [`n`, `EditButton`], [`v`, ` />`]]} />
          <CodeLine n={5} text={[[`v`, `</`], [`n`, `Can`], [`v`, `>`]]} />
          <CodeLine n={6} text={[]} />
          <CodeLine n={7} text={[[`v`, `<`], [`n`, `CanField`], [`v`, ` fieldId=`], [`s`, `"salary"`], [`v`, `>`]]} />
          <CodeLine n={8} text={[[`v`, `  <`], [`n`, `SalaryInput`], [`v`, ` />`]]} />
          <CodeLine n={9} text={[[`v`, `</`], [`n`, `CanField`], [`v`, `>`]]} />
          <CodeLine n={10} text={[]} />
          <CodeLine n={11} text={[[`v`, `<`], [`n`, `RouteGuard`], [`v`, ` routeId=`], [`s`, `"/admin"`], [`v`, ` fallback={<`], [`n`, `NoAccess`], [`v`, ` />}>`]]} />
          <CodeLine n={12} text={[[`v`, `  <`], [`n`, `AdminPage`], [`v`, ` />`]]} />
          <CodeLine n={13} text={[[`v`, `</`], [`n`, `RouteGuard`], [`v`, `>`]]} />
        </CodePanel>
      </div>

      <p className="font-mono mt-8 text-[0.72rem] uppercase tracking-[0.14em] text-(--granite)">
        same permission key on both sides · ui mappings ship from the db · no
        hardcoded rules in the app
      </p>
    </SectionShell>
  )
}

function CodePanel({
  label,
  title,
  filename,
  value,
  children,
}: {
  label: string
  title: string
  filename: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
        {label}
      </p>
      <p className="font-display mt-3 text-[1.6rem] leading-tight text-(--ink)">
        {title}
      </p>
      <CodeChrome filename={filename} value={value}>
        <pre>{children}</pre>
      </CodeChrome>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* COMPARE                                                             */
/* ------------------------------------------------------------------ */

function Compare() {
  type Cell = { yes: boolean; text: string }
  const rows: Array<{ cap: string; casl: Cell; casbin: Cell; permit: Cell; permx: Cell }> = [
    {
      cap: 'Structured keys (module.resource:field.action.scope)',
      casl: { yes: false, text: 'No' },
      casbin: { yes: false, text: 'No' },
      permit: { yes: false, text: 'No' },
      permx: { yes: true, text: 'First-class grammar' },
    },
    {
      cap: 'UI mappings (routes · components · fields)',
      casl: { yes: false, text: 'No' },
      casbin: { yes: false, text: 'No' },
      permit: { yes: false, text: 'No' },
      permx: { yes: true, text: 'Baked into each permission' },
    },
    {
      cap: '3-layer model (roles + subscription + flags)',
      casl: { yes: false, text: 'No' },
      casbin: { yes: false, text: 'No' },
      permit: { yes: false, text: 'Partial' },
      permx: { yes: true, text: 'Union-resolved per call' },
    },
    {
      cap: 'Role inheritance · DFS + cycle guard',
      casl: { yes: false, text: 'No' },
      casbin: { yes: true, text: 'Policy-based' },
      permit: { yes: true, text: 'Managed' },
      permx: { yes: true, text: 'DFS · depth 10' },
    },
    {
      cap: 'Framework-agnostic (Express · Hono · Fastify · Koa)',
      casl: { yes: false, text: 'Express' },
      casbin: { yes: true, text: 'Yes' },
      permit: { yes: false, text: 'SaaS only' },
      permx: { yes: true, text: 'Any HTTP layer' },
    },
    {
      cap: 'DB-agnostic (adapter pattern)',
      casl: { yes: false, text: 'No' },
      casbin: { yes: true, text: 'Yes' },
      permit: { yes: false, text: 'SaaS only' },
      permx: { yes: true, text: 'PermXDataProvider' },
    },
    {
      cap: 'React SDK — components + hooks + store',
      casl: { yes: false, text: '<Can> only' },
      casbin: { yes: false, text: 'None' },
      permit: { yes: false, text: 'None' },
      permx: { yes: true, text: 'Full suite · ~5 KB' },
    },
    {
      cap: 'Runtime deps (core)',
      casl: { yes: false, text: '—' },
      casbin: { yes: false, text: '—' },
      permit: { yes: false, text: '—' },
      permx: { yes: true, text: '0' },
    },
  ]
  return (
    <SectionShell id="compare" sheet={8} sheetName="spec sheet">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="tag">§ 07 · spec sheet</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            Read the spec.
            <br />
            <span className="italic-accent">Skip the sales deck.</span>
          </h2>
        </div>
        <p className="font-mono hidden text-[0.7rem] uppercase tracking-[0.14em] text-(--granite) md:block">
          compared: casl 6.x · casbin 5.x · permit.io · permx 0.4
        </p>
      </div>

      <div className="mt-10 overflow-x-auto border border-(--rule-strong)">
        <table className="spec-table min-w-[760px]">
          <thead>
            <tr>
              <th>Capability</th>
              <th>
                <Link
                  to="/vs/casl"
                  className="text-inherit underline decoration-(--rule) underline-offset-4 hover:decoration-(--ink)"
                >
                  CASL
                </Link>
              </th>
              <th>
                <Link
                  to="/vs/casbin"
                  className="text-inherit underline decoration-(--rule) underline-offset-4 hover:decoration-(--ink)"
                >
                  Casbin
                </Link>
              </th>
              <th>
                <Link
                  to="/vs/permit"
                  className="text-inherit underline decoration-(--rule) underline-offset-4 hover:decoration-(--ink)"
                >
                  Permit.io
                </Link>
              </th>
              <th>PermX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cap} className="highlight">
                <td className="font-medium text-(--ink)">{r.cap}</td>
                <td className={r.casl.yes ? 'has-yes' : 'has-no'}>
                  {r.casl.yes ? <span className="mark-check" /> : <span className="mark-dash" />}
                  {r.casl.text}
                </td>
                <td className={r.casbin.yes ? 'has-yes' : 'has-no'}>
                  {r.casbin.yes ? <span className="mark-check" /> : <span className="mark-dash" />}
                  {r.casbin.text}
                </td>
                <td className={r.permit.yes ? 'has-yes' : 'has-no'}>
                  {r.permit.yes ? <span className="mark-check" /> : <span className="mark-dash" />}
                  {r.permit.text}
                </td>
                <td className={r.permx.yes ? 'has-yes' : 'has-no'}>
                  {r.permx.yes ? <span className="mark-check" /> : <span className="mark-dash" />}
                  <strong>{r.permx.text}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* STATS                                                               */
/* ------------------------------------------------------------------ */

function Stats() {
  const stats: Array<[number, string, string, string]> = [
    [0, '', 'runtime dependencies', 'core engine · mongoose + express are optional peers'],
    [5, '~', 'kilobytes react sdk', 'gzipped · zero runtime deps · useSyncExternalStore backed'],
    [261, '', 'test cases · green', '204 core · 57 react · vitest 3 · jsdom + node'],
    [10, '', 'depth cap on DFS', 'diamond + cycle safe · depth warn event emitted'],
  ]
  const { ref, shown } = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`frame rule-h relative pt-16 pb-20 rise ${shown ? 'is-in' : ''}`}>
      <SheetLabel n={9} name="stats" />
      <span className="tag">§ 08 · by the numbers</span>
      <div className="mt-10 grid gap-0 border border-(--rule-strong) md:grid-cols-4">
        {stats.map(([n, prefix, label, sub], i) => (
          <StatCell
            key={label}
            n={n}
            prefix={prefix}
            label={label}
            sub={sub}
            start={shown}
            border={
              i < stats.length - 1
                ? 'border-b border-(--rule-strong) md:border-b-0 md:border-r'
                : ''
            }
          />
        ))}
      </div>

      <NpmBadges />
    </section>
  )
}

function NpmBadges() {
  const core = useNpmPackage('@permx/core')
  const react = useNpmPackage('@permx/react')
  return (
    <div className="mt-10">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
        live · fetched from registry.npmjs.org · downloads / week · month
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <NpmCard info={core} />
        <NpmCard info={react} />
      </div>
    </div>
  )
}

function NpmCard({ info }: { info: NpmInfo }) {
  const fmt = (n: number | null) =>
    n === null ? '—' : n.toLocaleString('en-US')
  const isNew =
    !info.loading && info.weekly === null && info.monthly === null
  return (
    <a
      href={info.url}
      target="_blank"
      rel="noreferrer"
      className="npm-card"
      aria-label={`View ${info.name} on npm`}
    >
      <div className="npm-card__head">
        <span className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
          {info.name}
        </span>
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--cobalt)">
          {info.loading ? '…' : info.version ? `v${info.version}` : 'unreleased'}
        </span>
      </div>
      <div className="npm-card__grid">
        <div>
          <p className="stat-num text-[clamp(1.9rem,4vw,2.75rem)] text-(--ink)">
            {info.loading ? '…' : isNew ? 'new' : fmt(info.weekly)}
          </p>
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
            downloads · 7d
          </p>
        </div>
        <div>
          <p className="stat-num text-[clamp(1.9rem,4vw,2.75rem)] text-(--ink)">
            {info.loading ? '…' : isNew ? '—' : fmt(info.monthly)}
          </p>
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
            downloads · 30d
          </p>
        </div>
      </div>
      <p className="font-mono mt-3 text-[0.62rem] uppercase tracking-[0.14em] text-(--cobalt)">
        view on npm ↗
      </p>
    </a>
  )
}

function StatCell({
  n,
  prefix,
  label,
  sub,
  start,
  border,
}: {
  n: number
  prefix: string
  label: string
  sub: string
  start: boolean
  border: string
}) {
  const value = useCountUp(n, 1400, start)
  return (
    <div className={`p-6 ${border}`}>
      <p className="stat-num text-[clamp(3rem,6vw,5.5rem)] text-(--ink)">
        {prefix}
        {value}
      </p>
      <p className="font-mono mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-(--cobalt)">
        {label}
      </p>
      <p className="mt-2 text-[0.84rem] leading-snug text-(--ink-soft)">
        {sub}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

function FAQ() {
  const items: Array<[string, React.ReactNode]> = [
    [
      'How is this different from CASL?',
      <>
        CASL reasons about abilities against subjects. PermX locks every
        permission to a fixed <code className="key-chip">module.resource:field.action.scope</code>{' '}
        coordinate, and ships those same coordinates to the UI as route /
        component / field ids. You get typed autocomplete, single-source renames,
        and no policy language on top.
      </>,
    ],
    [
      'Do I need MongoDB or Express?',
      <>
        No. The core is storage- and framework-agnostic. Mongoose and Express
        ship as <strong>optional peers</strong> — the engine runs anywhere you
        can call a function. Bring Postgres, Prisma, Hono, Fastify, Bun.serve —
        implement one <code className="key-chip">PermXDataProvider</code> and
        you are wired.
      </>,
    ],
    [
      'What about row-level / ABAC-style rules?',
      <>
        Scope covers the common cases: <code className="key-chip">all</code>,{' '}
        <code className="key-chip">own</code>, <code className="key-chip">team</code>,
        <code className="key-chip">department</code>, <code className="key-chip">self</code>.
        For arbitrary predicates, wrap the authorize call in your resolver — PermX
        stays out of your query builder.
      </>,
    ],
    [
      'Is it safe to put permissions in a database?',
      <>
        Yes — that's the point. Roles, role-permissions, and UI mappings live
        in your own DB behind your own auth. PermX caches the graph per tenant,
        invalidates on write, and bounds DFS to depth 10 so a malformed
        inheritance tree can't pin the event loop.
      </>,
    ],
    [
      'Coming from a flat-RBAC codebase. What is the migration like?',
      <>
        Start incremental. Map your existing permission strings to coordinates
        one module at a time with <code className="key-chip">definePermissions()</code>.
        PermX will happily coexist with flat checks until you are ready to flip
        the switch. Most teams migrate over two sprints.
      </>,
    ],
    [
      'Why zero runtime dependencies?',
      <>
        Supply-chain risk and bundle weight. Auth is in your hot path on every
        request and every render — it should not pull a transitive tree you
        haven't audited. Core is hand-written TypeScript with no imports outside
        the standard library.
      </>,
    ],
  ]
  return (
    <SectionShell id="faq" sheet={10} sheetName="faq">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="tag">§ 09 · frequently asked</span>
          <h2 className="display-lg mt-5 max-w-[22ch] text-(--ink)">
            Objections,
            <br />
            <span className="italic-accent">addressed.</span>
          </h2>
        </div>
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div>
          {items.slice(0, 3).map(([q, a], i) => (
            <details key={q} className="faq-item" open={i === 0}>
              <summary>{q}</summary>
              <div className="faq-item__body">{a}</div>
            </details>
          ))}
        </div>
        <div>
          {items.slice(3).map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <div className="faq-item__body">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* CONTRIBUTORS                                                        */
/* ------------------------------------------------------------------ */

function Contributors() {
  const people: Array<{
    login: string
    name: string
    role: string
    bio: string
    avatar: string
    url: string
    focus: string
  }> = [
    {
      login: 'Umair-N',
      name: 'Sheikh Umair Bin Najeeb',
      role: 'Co-author · Maintainer',
      bio: 'Works across the core engine, inheritance resolver, adapters, and the React SDK. Drives the 0.x roadmap toward a stable 1.0.',
      avatar: 'https://avatars.githubusercontent.com/u/73377852?v=4',
      url: 'https://github.com/Umair-N',
      focus: 'core · react · adapters',
    },
    {
      login: 'incmak',
      name: 'Mueen Ahmed',
      role: 'Co-author · Maintainer',
      bio: 'Works across the permission grammar, three-layer resolver, DX surface, and the React SDK. Drives the 0.x roadmap toward a stable 1.0.',
      avatar: 'https://avatars.githubusercontent.com/u/16060763?v=4',
      url: 'https://github.com/incmak',
      focus: 'core · react · types',
    },
  ]

  return (
    <SectionShell sheet={11} sheetName="contributors">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="tag">§ 10 · humans</span>
          <h2 className="display-lg mt-5 max-w-[24ch] text-(--ink)">
            Built in the open.
            <br />
            <span className="italic-accent">By hand.</span>
          </h2>
          <p className="mt-6 max-w-[52ch] text-[1rem] leading-[1.65] text-(--ink-soft)">
            PermX is independent, MIT-licensed, and open to contributions.
            Issues, PRs, and architectural debates are welcome on GitHub — the
            core stays zero-dep on purpose, and we'd rather ship a small thing
            well than a big thing badly.
          </p>
        </div>
        <a
          href={`${REPO}/graphs/contributors`}
          target="_blank"
          rel="noreferrer"
          className="font-mono hidden text-[0.7rem] uppercase tracking-[0.14em] text-(--cobalt) underline decoration-(--cobalt) underline-offset-4 md:inline"
        >
          full contributor graph ↗
        </a>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <a
            key={p.login}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="contributor-card"
          >
            <img
              src={p.avatar}
              alt={`${p.name} avatar`}
              className="contributor-avatar"
              width={56}
              height={56}
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.15rem] leading-tight text-(--ink)">
                {p.name}
              </p>
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-(--cobalt)">
                @{p.login} · {p.role}
              </p>
              <p className="mt-2 text-[0.82rem] leading-snug text-(--ink-soft)">
                {p.bio}
              </p>
              <p className="font-mono mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-(--granite)">
                {p.focus}
              </p>
            </div>
          </a>
        ))}
        <a
          href={`${REPO}/issues`}
          target="_blank"
          rel="noreferrer"
          className="contributor-card border-dashed"
          style={{ borderStyle: 'dashed' }}
        >
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center border border-(--rule-strong) font-display text-[2rem] leading-none text-(--cobalt)">
            +
          </div>
          <div className="min-w-0">
            <p className="font-display text-[1.15rem] leading-tight text-(--ink)">
              Your name here.
            </p>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-(--granite)">
              good first issues labelled
            </p>
            <p className="mt-2 text-[0.82rem] leading-snug text-(--ink-soft)">
              Docs, adapters, typing, examples. Open a draft PR — we review
              quickly.
            </p>
          </div>
        </a>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* INSTALL · QUICK START                                               */
/* ------------------------------------------------------------------ */

function Install() {
  return (
    <SectionShell id="install" sheet={12} sheetName="ship" className="pb-24">
      <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="tag tag--red">§ 11 · ship</span>
          <h2 className="display-lg mt-5 text-(--ink)">
            Install.
            <br />
            <span className="italic-accent">Seed. Authorize.</span>
          </h2>
          <p className="mt-6 max-w-[40ch] text-[1rem] leading-[1.65] text-(--ink-soft)">
            Works with any Node.js ≥ 18. Bun-first but npm / pnpm / yarn fine.
            Bring your own auth — PermX only needs a{' '}
            <code className="key-chip">userId</code>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <InstallBlock label="BACKEND" cmd="bun add @permx/core mongoose express" />
          <InstallBlock label="FRONTEND" cmd="bun add @permx/react" />
          <InstallBlock label="NPM USERS" cmd="npm install @permx/core @permx/react" />
        </div>
      </div>

      {/* quick start 3 steps */}
      <div className="mt-14">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-(--granite)">
          quick start · three calls to first authorize()
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="step" data-step="01">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
              Define permissions
            </p>
            <p className="mt-2 text-[0.88rem] leading-snug text-(--ink-soft)">
              One call to <code className="key-chip">definePermissions()</code>.
              TypeScript captures every literal key — no runtime cost.
            </p>
            <code className="font-mono mt-3 block text-[0.76rem] text-(--cobalt)">
              const P = definePermissions({'{…}'})
            </code>
          </div>
          <div className="step" data-step="02">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
              Spin up the engine
            </p>
            <p className="mt-2 text-[0.88rem] leading-snug text-(--ink-soft)">
              Pass your data provider (Mongo, Postgres, in-memory). The engine
              returns the resolver used by both server and client.
            </p>
            <code className="font-mono mt-3 block text-[0.76rem] text-(--cobalt)">
              createPermXEngine({'{ dataProvider }'})
            </code>
          </div>
          <div className="step" data-step="03">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-(--ink)">
              Gate server + UI
            </p>
            <p className="mt-2 text-[0.88rem] leading-snug text-(--ink-soft)">
              Middleware on the route, <code className="key-chip">&lt;Can&gt;</code>{' '}
              in the component. Same key on both sides of the wire.
            </p>
            <code className="font-mono mt-3 block text-[0.76rem] text-(--cobalt)">
              auth.authorize(P.projectsView)
            </code>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-3">
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="btn btn--cobalt"
        >
          <span aria-hidden>→</span>
          open on github
        </a>
        <a
          href="https://www.npmjs.com/package/@permx/core"
          target="_blank"
          rel="noreferrer"
          className="btn btn--ghost"
        >
          @permx/core on npm
        </a>
        <a
          href="https://www.npmjs.com/package/@permx/react"
          target="_blank"
          rel="noreferrer"
          className="btn btn--ghost"
        >
          @permx/react on npm
        </a>
        <a
          href={`${REPO}/issues`}
          target="_blank"
          rel="noreferrer"
          className="btn btn--ghost"
        >
          file an issue
        </a>
      </div>
    </SectionShell>
  )
}

function InstallBlock({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div className="marks relative border border-(--rule-strong) bg-(--ink) p-5 text-(--paper)">
      <span className="mark-tr" />
      <span className="mark-bl" />
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--citrine)">
          {label}
        </p>
        <CopyButton value={cmd} label="copy" />
      </div>
      <p className="font-mono mt-2 break-all text-[0.95rem] leading-snug">
        <span className="mr-2 text-(--vermilion)">$</span>
        {cmd}
      </p>
    </div>
  )
}
