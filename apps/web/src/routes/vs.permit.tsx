import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_URL, siteUrl } from '#/lib/site'

const PAGE_URL = siteUrl('vs/permit')
const VS_INDEX_URL = siteUrl('vs')

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Comparisons', item: VS_INDEX_URL },
    { '@type': 'ListItem', position: 3, name: 'PermX vs Permit.io', item: PAGE_URL },
  ],
})

const WEBPAGE_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PermX vs Permit.io — Open-Source, Self-Hosted RBAC Alternative',
  url: PAGE_URL,
  description:
    'Side-by-side comparison of PermX and Permit.io: deployment model, policy authoring, latency, vendor dependency, and React SDK.',
  primaryImageOfPage: `${SITE_URL}og.png`,
  inLanguage: 'en',
  about: [
    { '@type': 'SoftwareApplication', name: 'PermX', url: SITE_URL },
    { '@type': 'SoftwareApplication', name: 'Permit.io', url: 'https://www.permit.io' },
  ],
})

export const Route = createFileRoute('/vs/permit')({
  head: () => ({
    meta: [
      {
        title:
          'PermX vs Permit.io — Open-Source, Self-Hosted RBAC Alternative',
      },
      {
        name: 'description',
        content:
          'Compare PermX and Permit.io for access control. Code-first, zero-dep library you own end-to-end vs managed policy decision platform with dashboard and hosted PDP.',
      },
      {
        property: 'og:title',
        content: 'PermX vs Permit.io — Self-Hosted RBAC Alternative',
      },
      {
        property: 'og:description',
        content:
          'Compare PermX and Permit.io. Code-first library vs managed IAM platform. Self-host vs vendor PDP. Zero deps vs SDK + cloud runtime.',
      },
      { property: 'og:url', content: PAGE_URL },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
      { type: 'application/ld+json', children: WEBPAGE_JSON_LD },
    ],
  }),
  component: VsPermit,
})

function VsPermit() {
  return (
    <>
      <section className="frame pt-16 pb-12">
        <nav aria-label="Breadcrumb">
          <ol className="font-mono flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-(--granite)">
            <li>
              <Link to="/" className="hover:text-(--ink)">permx</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/vs" className="hover:text-(--ink)">vs</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-(--ink)">permit</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          PermX vs{' '}
          <span className="italic-accent">Permit.io.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          Permit.io is a managed IAM platform: a dashboard, a policy editor, a
          hosted Policy Decision Point, and an SDK that talks to it. PermX is
          the opposite shape — a library you own end to end, code-first, with
          no vendor runtime in your hot path. Here is how they compare.
        </p>
      </section>

      <ComparisonTable
        rows={[
          {
            cap: 'Deployment model',
            permit:
              'Managed SaaS PDP (or self-host the OPA-based PDP in your cluster)',
            permx:
              'Library embedded in your Node.js process — no PDP, no sidecar, no network hop',
          },
          {
            cap: 'Policy authoring',
            permit:
              'Dashboard + policy editor UI with ReBAC/RBAC/ABAC builders',
            permx:
              'Code-first with definePermissions() — typed permission objects live next to your source',
          },
          {
            cap: 'Type safety',
            permit:
              'String-based resource/action keys in SDK calls — no compile-time validation',
            permx:
              'Literal string types inferred from definePermissions() — renames propagate at compile time',
          },
          {
            cap: 'React / UI integration',
            permit:
              'React SDK in beta — checkPermissions hook, manual gate composition',
            permx:
              'First-class React SDK: <Can>, <CanField>, <RouteGuard>, <FeatureGate>, hooks, store (~5 KB)',
          },
          {
            cap: 'Data sync',
            permit:
              'Your user and role data must sync to Permit via API/webhook — second source of truth',
            permx:
              'Roles and permissions live in your own database behind your own auth — one source of truth',
          },
          {
            cap: 'Runtime dependencies',
            permit:
              'permit SDK + HTTP client; PDP binary if self-hosting OPA',
            permx:
              'Zero runtime dependencies in @permx/core',
          },
          {
            cap: 'Pricing model',
            permit:
              'Free tier + paid tiers metered by users, tenants, and policy evaluations',
            permx: 'MIT-licensed, free, no metering, no vendor lock-in',
          },
          {
            cap: 'Latency',
            permit:
              'HTTP hop to PDP (managed) or localhost PDP (self-hosted) per authorize call',
            permx:
              'In-process function call — TTL-cached permissions, microsecond-grade lookups',
          },
          {
            cap: 'Multi-tenancy',
            permit:
              'First-class — tenant objects, per-tenant policies, multi-tenant dashboard',
            permx:
              'Built-in — cache keyed by tenantId::userId, tenant-scoped data provider',
          },
          {
            cap: 'Vendor dependency',
            permit:
              'Requires Permit account (or running their PDP binary) to authorize requests',
            permx:
              'No external service required — the engine runs wherever you run Node.js',
          },
        ]}
      />

      <section className="frame rule-h pt-12 pb-12">
        <h2 className="display-lg text-(--ink)">When to choose Permit.io</h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>
            You want a dashboard for non-engineers to edit policies without a
            deploy
          </li>
          <li>
            Your authorization model is broader than RBAC — ReBAC, ABAC, or
            attribute-heavy
          </li>
          <li>
            You need a policy editor with approval workflows, audit logs, and a
            policy-as-data UI
          </li>
          <li>
            You prefer a managed service over owning another library in your
            codebase
          </li>
          <li>
            You are in an OPA/Rego shop and want policy reuse across
            heterogeneous services
          </li>
        </ul>
      </section>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">When to choose PermX</h2>
        <ul className="mt-6 space-y-3 max-w-[60ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>
            Structured RBAC with scopes covers your needs — no need for a full
            policy language
          </li>
          <li>
            You want authorization decisions in the hot path without a network
            hop
          </li>
          <li>
            You want to own the data — roles, permissions, and audit live in
            your own database
          </li>
          <li>
            You need a first-class React SDK with field/route/component gates
          </li>
          <li>
            You cannot — or will not — add a vendor dependency to your auth path
          </li>
          <li>
            You want typed permission keys that refactor safely across backend
            and frontend
          </li>
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
              <Link
                to="/vs/casl"
                className="text-(--cobalt) underline underline-offset-4"
              >
                PermX vs CASL →
              </Link>
            </li>
            <li>
              <Link
                to="/vs/casbin"
                className="text-(--cobalt) underline underline-offset-4"
              >
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
  rows: Array<{ cap: string; permit: string; permx: string }>
}) {
  return (
    <section className="frame rule-h pt-12 pb-12" aria-labelledby="comparison-table">
      <h2 id="comparison-table" className="display-md text-(--ink)">
        Capability comparison
      </h2>
      <p className="mt-3 max-w-[60ch] text-[0.95rem] leading-[1.6] text-(--ink-soft)">
        Ten dimensions scored head-to-head. Rows favouring PermX are bolded in
        the right column.
      </p>
      <div className="mt-6 overflow-x-auto border border-(--rule-strong)">
        <table className="spec-table min-w-[640px]">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Permit.io</th>
              <th>PermX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cap} className="highlight">
                <td className="font-medium text-(--ink)">{r.cap}</td>
                <td className="text-(--ink-soft)">{r.permit}</td>
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
