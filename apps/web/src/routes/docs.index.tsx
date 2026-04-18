import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_URL, siteUrl } from '#/lib/site'

const PAGE_URL = siteUrl('docs')
const GETTING_STARTED_URL = siteUrl('docs/getting-started')

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: PAGE_URL },
  ],
})

const COLLECTION_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'PermX Documentation',
  url: PAGE_URL,
  description:
    'Guides, tutorials, and API reference for PermX — structured RBAC for Node.js and React.',
  hasPart: [
    {
      '@type': 'TechArticle',
      name: 'Getting Started with PermX',
      url: GETTING_STARTED_URL,
      description:
        'Install @permx/core and @permx/react, define permissions with typed keys, and gate your UI.',
    },
  ],
})

export const Route = createFileRoute('/docs/')({
  head: () => ({
    meta: [
      {
        title: 'PermX Documentation — RBAC for Node.js and React',
      },
      {
        name: 'description',
        content:
          'Guides, tutorials, and reference for PermX. Learn how to add structured role-based access control to Node.js backends and React applications.',
      },
      {
        property: 'og:title',
        content: 'PermX Documentation — Structured RBAC Guides',
      },
      {
        property: 'og:description',
        content:
          'Guides and tutorials for structured RBAC in Node.js and React with PermX.',
      },
      { property: 'og:url', content: PAGE_URL },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'canonical', href: PAGE_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
      { type: 'application/ld+json', children: COLLECTION_JSON_LD },
    ],
  }),
  component: DocsIndex,
})

const DOCS = [
  {
    to: '/docs/getting-started',
    title: 'Getting Started',
    blurb:
      'From zero to a working RBAC system in five steps. Install, define typed permissions, create the engine, protect routes, gate the UI.',
    tag: 'tutorial · 15 min',
  },
]

function DocsIndex() {
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
            <li className="text-(--ink)">docs</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          <span className="italic-accent">Documentation.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          Guides and reference for PermX — structured RBAC for Node.js and
          React. Permission keys carry meaning, roles inherit with cycle
          protection, and UI mappings ship on every permission so your backend
          and frontend share one vocabulary.
        </p>
      </section>

      <section className="frame rule-h pt-12 pb-12">
        <h2 className="display-lg text-(--ink)">Guides</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {DOCS.map((d) => (
            <li key={d.to} className="border border-(--rule-strong) p-6">
              <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--cobalt)">
                {d.tag}
              </p>
              <h3 className="display-sm mt-2 text-(--ink)">
                <Link
                  to={d.to}
                  className="hover:text-(--cobalt) underline-offset-4 hover:underline"
                >
                  {d.title}
                </Link>
              </h3>
              <p className="mt-3 text-[0.95rem] leading-[1.6] text-(--ink-soft)">
                {d.blurb}
              </p>
              <Link
                to={d.to}
                className="mt-5 inline-block text-(--cobalt) underline underline-offset-4"
              >
                Read guide →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">API reference</h2>
        <p className="mt-6 max-w-[62ch] text-[1rem] leading-[1.6] text-(--ink-soft)">
          Full API documentation lives in the repository README alongside the
          source. Both packages publish TypeScript types — install and your
          editor resolves signatures, JSDoc, and inline examples.
        </p>
        <ul className="mt-6 space-y-3 text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>
            <a
              href="https://github.com/Umair-N/permx/tree/main/packages/core"
              target="_blank"
              rel="noreferrer"
              className="text-(--cobalt) underline underline-offset-4"
            >
              @permx/core README
            </a>{' '}
            — engine, mongoose adapter, express middleware, DataProvider
            interface
          </li>
          <li>
            <a
              href="https://github.com/Umair-N/permx/tree/main/packages/react"
              target="_blank"
              rel="noreferrer"
              className="text-(--cobalt) underline underline-offset-4"
            >
              @permx/react README
            </a>{' '}
            — provider, gates, hooks, and store
          </li>
          <li>
            <a
              href="https://github.com/Umair-N/permx/tree/main/examples"
              target="_blank"
              rel="noreferrer"
              className="text-(--cobalt) underline underline-offset-4"
            >
              Examples directory
            </a>{' '}
            — Express, Hono, Next.js App Router, and a full React demo
          </li>
        </ul>
      </section>
    </>
  )
}
