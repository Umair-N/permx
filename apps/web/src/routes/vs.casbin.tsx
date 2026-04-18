import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_URL, siteUrl } from '#/lib/site'

const PAGE_URL = siteUrl('vs/casbin')

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Comparisons', item: PAGE_URL },
    { '@type': 'ListItem', position: 3, name: 'PermX vs Casbin', item: PAGE_URL },
  ],
})

export const Route = createFileRoute('/vs/casbin')({
  head: () => ({
    meta: [
      {
        title:
          'PermX vs Casbin — Lightweight RBAC Alternative for Node.js',
      },
      {
        name: 'description',
        content:
          'Compare PermX and Casbin for access control in Node.js. Structured permission keys vs policy models, React SDK, zero dependencies, and role inheritance.',
      },
      {
        property: 'og:title',
        content: 'PermX vs Casbin — Lightweight RBAC Alternative',
      },
      {
        property: 'og:description',
        content:
          'Compare PermX and Casbin for access control in Node.js. Structured keys, React SDK, zero deps.',
      },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
    ],
  }),
  component: VsCasbin,
})

function VsCasbin() {
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
            <li className="text-(--ink)">casbin</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          PermX vs{' '}
          <span className="italic-accent">Casbin.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          Casbin is a powerful, policy-driven authorization library with
          support for ACL, RBAC, ABAC, and custom models. PermX is narrowly
          focused on structured RBAC with zero dependencies and a React SDK.
          Different tools for different needs.
        </p>
      </section>

      <ComparisonTable
        rows={[
          {
            cap: 'Authorization model',
            casbin: 'Policy-file driven — supports ACL, RBAC, ABAC, RESTful, and custom models via Casbin model language',
            permx: 'Structured RBAC only — permission keys carry meaning: module.resource:field.action.scope',
          },
          {
            cap: 'Configuration',
            casbin: 'Requires model file (.conf) + policy file (.csv) or adapter',
            permx: 'Code-first with definePermissions() — no separate config files',
          },
          {
            cap: 'Type safety',
            casbin: 'String-based enforcement — no compile-time key validation',
            permx: 'Literal string types inferred from definePermissions() — compiler catches stale keys',
          },
          {
            cap: 'React / UI integration',
            casbin: 'No official React SDK',
            permx: 'Full React SDK: <Can>, <CanField>, <RouteGuard>, <FeatureGate>, hooks, store (~5 KB)',
          },
          {
            cap: 'Role inheritance',
            casbin: 'Via g (grouping) function in policy — powerful but policy-language dependent',
            permx: 'Built-in DFS with visited-set, cycle detection, depth cap 10 — no policy language',
          },
          {
            cap: 'Database adapters',
            casbin: 'Large ecosystem of adapters (MySQL, PostgreSQL, MongoDB, Redis, etc.)',
            permx: 'PermXDataProvider interface — Mongoose and Prisma built-in, custom adapters via single interface',
          },
          {
            cap: 'Multi-tenancy',
            casbin: 'Via domain-based RBAC model (requires model configuration)',
            permx: 'Built-in — cache keyed by tenantId::userId, tenant-scoped data provider',
          },
          {
            cap: 'Runtime dependencies',
            casbin: 'casbin package + adapter packages',
            permx: 'Zero runtime dependencies in core',
          },
          {
            cap: 'Learning curve',
            casbin: 'Steeper — requires understanding Casbin model language, matchers, and policy syntax',
            permx: 'Minimal — define permissions as objects, call authorize() with typed keys',
          },
          {
            cap: 'Flexibility',
            casbin: 'Very high — can model almost any access control pattern',
            permx: 'Focused — structured RBAC with scopes. Custom ABAC logic wraps authorize() calls',
          },
        ]}
      />

      <section className="frame rule-h pt-12 pb-12">
        <h2 className="display-lg text-(--ink)">
          When to choose Casbin
        </h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>You need ABAC, ACL, or custom authorization models beyond RBAC</li>
          <li>Your authorization rules are complex enough to warrant a policy language</li>
          <li>You need to share authorization models across multiple languages (Go, Java, Python, etc.)</li>
          <li>You want the largest ecosystem of database adapters</li>
        </ul>
      </section>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">
          When to choose PermX
        </h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>RBAC with structured keys is sufficient for your access control needs</li>
          <li>You want typed permission keys that refactor safely across backend and frontend</li>
          <li>You need a React SDK with field-level, route-level, and component-level gates</li>
          <li>You prefer code-first configuration over policy files</li>
          <li>Zero runtime dependencies matter for supply-chain security and bundle weight</li>
          <li>You want built-in multi-tenant support without model configuration</li>
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
              <Link to="/vs/casl" className="text-(--cobalt) underline underline-offset-4">
                PermX vs CASL →
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
  rows: Array<{ cap: string; casbin: string; permx: string }>
}) {
  return (
    <section className="frame rule-h pt-12 pb-12">
      <div className="overflow-x-auto border border-(--rule-strong)">
        <table className="spec-table min-w-[640px]">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Casbin</th>
              <th>PermX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cap} className="highlight">
                <td className="font-medium text-(--ink)">{r.cap}</td>
                <td className="text-(--ink-soft)">{r.casbin}</td>
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
