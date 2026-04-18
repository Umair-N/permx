import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_URL, siteUrl } from '#/lib/site'

const PAGE_URL = siteUrl('vs/casl')

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Comparisons', item: PAGE_URL },
    { '@type': 'ListItem', position: 3, name: 'PermX vs CASL', item: PAGE_URL },
  ],
})

export const Route = createFileRoute('/vs/casl')({
  head: () => ({
    meta: [
      {
        title: 'PermX vs CASL — Structured RBAC Alternative for Node.js',
      },
      {
        name: 'description',
        content:
          'Compare PermX and CASL for role-based access control in Node.js and React. Structured permission keys vs ability-based checks, UI gates, inheritance, and bundle size.',
      },
      {
        property: 'og:title',
        content: 'PermX vs CASL — Structured RBAC Alternative',
      },
      {
        property: 'og:description',
        content:
          'Compare PermX and CASL for RBAC in Node.js and React. Structured keys, UI gates, zero deps.',
      },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
    ],
  }),
  component: VsCasl,
})

function VsCasl() {
  return (
    <>
      <section className="frame pt-16 pb-12">
        <nav aria-label="Breadcrumb">
          <ol className="font-mono flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
            <li>
              <Link to="/" className="hover:text-(--ink)">permx</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>vs</li>
            <li aria-hidden="true">/</li>
            <li className="text-(--ink)">casl</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          PermX vs{' '}
          <span className="italic-accent">CASL.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          CASL is a popular isomorphic authorization library. PermX takes a
          different approach — structured permission keys instead of
          ability-based checks, with UI mappings baked into every permission.
          Here is how they compare.
        </p>
      </section>

      <ComparisonTable
        rows={[
          {
            cap: 'Permission model',
            casl: 'Ability-based: define what a user can do on a subject',
            permx: 'Coordinate-based: module.resource:field.action.scope',
          },
          {
            cap: 'Type safety',
            casl: 'Requires manual typing of abilities and subjects',
            permx: 'definePermissions() infers literal string types — rename a coordinate and the compiler finds every call site',
          },
          {
            cap: 'UI integration',
            casl: '<Can> component only — no field-level gates, route guards, or feature gates',
            permx: '<Can>, <CanField>, <RouteGuard>, <FeatureGate> — headless gates + hooks + useSyncExternalStore-backed store',
          },
          {
            cap: 'Role inheritance',
            casl: 'Not built-in — must compose abilities manually',
            permx: 'DFS with visited-set dedupe, cycle detection, depth cap 10',
          },
          {
            cap: 'Multi-tenancy',
            casl: 'Not built-in',
            permx: 'Built-in — cache keyed by tenantId::userId, tenant-scoped data provider',
          },
          {
            cap: 'Database adapter',
            casl: 'Mongoose conditions via @casl/mongoose — tightly coupled',
            permx: 'PermXDataProvider interface — Mongoose, Prisma, or any custom adapter',
          },
          {
            cap: 'Runtime dependencies',
            casl: '@casl/ability + framework-specific packages',
            permx: 'Zero runtime dependencies in core',
          },
          {
            cap: 'React SDK size',
            casl: '~12 KB (ability + react)',
            permx: '~5 KB gzipped — full suite of gates, hooks, and store',
          },
          {
            cap: 'Framework support',
            casl: 'Primarily Express, adapters for others',
            permx: 'Framework-agnostic — Express, Hono, Fastify, Koa, or raw HTTP',
          },
          {
            cap: 'Field-level permissions',
            casl: 'Via conditions on subject fields',
            permx: 'First-class — field coordinate in the permission key, CanField gate in React',
          },
        ]}
      />

      <section className="frame rule-h pt-12 pb-12">
        <h2 className="display-lg text-(--ink)">
          When to choose CASL
        </h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>You need ABAC-style attribute-based conditions on every check</li>
          <li>Your permission model is subject-oriented rather than module/resource-oriented</li>
          <li>You want to evaluate complex conditional rules (e.g., "can edit Post where authorId matches userId")</li>
        </ul>
      </section>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">
          When to choose PermX
        </h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>You want structured, refactor-safe permission keys across backend and UI</li>
          <li>You need field-level, route-level, and component-level gates in React</li>
          <li>You need role inheritance with cycle protection</li>
          <li>You want multi-tenant support built-in</li>
          <li>Zero runtime dependencies matter for your supply-chain security</li>
          <li>You are building a SaaS with roles + subscription tiers + feature flags</li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="/#compare" className="btn btn--ghost">
            Full comparison table →
          </a>
          <Link to="/docs/getting-started" className="btn btn--cobalt">
            Get started with PermX →
          </Link>
        </div>

        <div className="mt-12 border-t border-(--rule) pt-8">
          <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--granite)">
            related comparisons
          </p>
          <ul className="mt-3 flex flex-wrap gap-4 text-[0.9rem]">
            <li>
              <Link to="/vs/casbin" className="text-(--cobalt) underline underline-offset-4">
                PermX vs Casbin →
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}

function ComparisonTable({
  rows,
}: {
  rows: Array<{ cap: string; casl: string; permx: string }>
}) {
  return (
    <section className="frame rule-h pt-12 pb-12">
      <div className="overflow-x-auto border border-(--rule-strong)">
        <table className="spec-table min-w-[640px]">
          <thead>
            <tr>
              <th>Capability</th>
              <th>CASL</th>
              <th>PermX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cap} className="highlight">
                <td className="font-medium text-(--ink)">{r.cap}</td>
                <td className="text-(--ink-soft)">{r.casl}</td>
                <td className="text-(--ink)">
                  <strong>{r.permx}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
