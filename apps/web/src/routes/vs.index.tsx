import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_URL, siteUrl } from '#/lib/site'

const PAGE_URL = siteUrl('vs')

const COMPARISONS = [
  {
    to: '/vs/casl',
    url: siteUrl('vs/casl'),
    competitor: 'CASL',
    tagline: 'Ability-based vs coordinate-based permissions',
    blurb:
      'CASL is a popular isomorphic library built around abilities and subjects. PermX takes a different path: structured permission keys with UI mappings baked in. See the 10-row capability matrix.',
  },
  {
    to: '/vs/casbin',
    url: siteUrl('vs/casbin'),
    competitor: 'Casbin',
    tagline: 'Policy-file driven vs code-first RBAC',
    blurb:
      'Casbin models almost any authorization pattern via policy files and matchers. PermX is narrowly focused on structured RBAC with zero dependencies and a React SDK out of the box.',
  },
  {
    to: '/vs/permit',
    url: siteUrl('vs/permit'),
    competitor: 'Permit.io',
    tagline: 'Managed IAM platform vs self-hosted library',
    blurb:
      'Permit.io is a hosted policy decision platform with a dashboard, policy editor, and PDP. PermX is a library you own end to end — code-first, self-hosted, no vendor runtime in your hot path.',
  },
] as const

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Comparisons', item: PAGE_URL },
  ],
})

const ITEMLIST_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PermX alternatives and comparisons',
  url: PAGE_URL,
  numberOfItems: COMPARISONS.length,
  itemListElement: COMPARISONS.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: c.url,
    name: `PermX vs ${c.competitor}`,
  })),
})

export const Route = createFileRoute('/vs/')({
  head: () => ({
    meta: [
      {
        title: 'PermX Alternatives — RBAC Library Comparisons for Node.js',
      },
      {
        name: 'description',
        content:
          'Side-by-side comparisons of PermX with CASL, Casbin, and Permit.io. Permission model, type safety, UI gates, inheritance, multi-tenancy, and bundle size.',
      },
      {
        property: 'og:title',
        content: 'PermX vs CASL, Casbin, Permit.io — RBAC Comparisons',
      },
      {
        property: 'og:description',
        content:
          'Side-by-side comparisons of PermX with the RBAC libraries Node.js and React teams actually evaluate.',
      },
      { property: 'og:url', content: PAGE_URL },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
      { type: 'application/ld+json', children: ITEMLIST_JSON_LD },
    ],
  }),
  component: VsIndex,
})

function VsIndex() {
  return (
    <>
      <section className="frame pt-16 pb-12">
        <nav aria-label="Breadcrumb">
          <ol className="font-mono flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
            <li>
              <Link to="/" className="hover:text-(--ink)">
                permx
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-(--ink)">vs</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          PermX{' '}
          <span className="italic-accent">compared.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          Pick the library that matches how you think about authorization. Each
          comparison below is a side-by-side capability matrix — the same rows
          scored the same way — so you can audit trade-offs without rereading
          three different docs sites.
        </p>
      </section>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">Head-to-head comparisons</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {COMPARISONS.map((c) => (
            <li key={c.to} className="border border-(--rule-strong) p-6">
              <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--cobalt)">
                permx · vs · {c.competitor.toLowerCase()}
              </p>
              <h3 className="display-sm mt-2 text-(--ink)">
                <Link
                  to={c.to}
                  className="hover:text-(--cobalt) underline-offset-4 hover:underline"
                >
                  PermX vs {c.competitor}
                </Link>
              </h3>
              <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-(--granite)">
                {c.tagline}
              </p>
              <p className="mt-4 text-[0.95rem] leading-[1.6] text-(--ink-soft)">
                {c.blurb}
              </p>
              <Link
                to={c.to}
                className="mt-5 inline-block text-(--cobalt) underline underline-offset-4"
              >
                Read comparison →
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 border-t border-(--rule) pt-8">
          <h2 className="display-md text-(--ink)">Not sure which to pick?</h2>
          <p className="mt-4 max-w-[62ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
            The homepage comparison matrix scores all three at once on ten
            dimensions — permission model, type safety, UI integration,
            inheritance, multi-tenancy, database adapters, runtime
            dependencies, React SDK size, framework support, and field-level
            permissions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/#compare" className="btn btn--ghost">
              Homepage comparison table →
            </a>
            <Link to="/docs/getting-started" className="btn btn--cobalt">
              Get started with PermX →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
