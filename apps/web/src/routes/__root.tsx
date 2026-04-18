import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { BASE_PATH, SITE_URL } from '../lib/site'

import appCss from '../styles.css?url'

const THEME_INIT = `(function(){try{var t=localStorage.getItem('permx-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`

const SITE_TITLE = 'PermX — Structured RBAC for Node.js and React'
const SITE_DESC =
  'Permission keys with meaning, role inheritance that handles diamonds and cycles, UI-aware mappings, multi-tenant, framework-agnostic. Zero-dep core.'
const OG_IMAGE = `${SITE_URL}og.png`

const JSON_LD_APP = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PermX',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Node.js, Browser',
  description: SITE_DESC,
  url: SITE_URL,
  image: OG_IMAGE,
  softwareVersion: '0.4.0',
  programmingLanguage: 'TypeScript',
  author: [
    { '@type': 'Person', name: 'Umair N', url: 'https://github.com/Umair-N' },
    { '@type': 'Person', name: 'incmak', url: 'https://github.com/incmak' },
  ],
  codeRepository: 'https://github.com/Umair-N/permx',
  license: 'https://opensource.org/licenses/MIT',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
})

const JSON_LD_FAQ = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How is PermX different from CASL?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CASL reasons about abilities against subjects. PermX locks every permission to a fixed module.resource:field.action.scope coordinate, and ships those same coordinates to the UI as route / component / field ids. You get typed autocomplete, single-source renames, and no policy language on top.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need MongoDB or Express to use PermX?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The core is storage- and framework-agnostic. Mongoose and Express ship as optional peers — the engine runs anywhere you can call a function. Bring Postgres, Prisma, Hono, Fastify, Bun.serve — implement one PermXDataProvider and you are wired.',
      },
    },
    {
      '@type': 'Question',
      name: 'What about row-level or ABAC-style rules?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Scope covers the common cases: all, own, team, department, self. For arbitrary predicates, wrap the authorize call in your resolver — PermX stays out of your query builder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it safe to put permissions in a database?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — that is the point. Roles, role-permissions, and UI mappings live in your own DB behind your own auth. PermX caches the graph per tenant, invalidates on write, and bounds DFS to depth 10 so a malformed inheritance tree cannot pin the event loop.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the migration path from flat-RBAC?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start incremental. Map your existing permission strings to coordinates one module at a time with definePermissions(). PermX will coexist with flat checks until you are ready to flip the switch. Most teams migrate over two sprints.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does PermX have zero runtime dependencies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Supply-chain risk and bundle weight. Auth is in your hot path on every request and every render — it should not pull a transitive tree you have not audited. Core is hand-written TypeScript with no imports outside the standard library.',
      },
    },
  ],
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESC },
      {
        name: 'keywords',
        content:
          'rbac, permissions, access control, nodejs, react, typescript, mongoose, prisma, express, multi-tenant, authorization',
      },
      { name: 'author', content: 'Umair N, incmak' },
      { name: 'theme-color', content: '#f2efe7' },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#0a1628',
      },
      { name: 'color-scheme', content: 'light dark' },

      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'PermX' },
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESC },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'PermX — Structured RBAC' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESC },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: `${BASE_PATH}logo.svg` },
      { rel: 'alternate icon', href: `${BASE_PATH}favicon.ico` },
      { rel: 'apple-touch-icon', href: `${BASE_PATH}logo192.png` },
      { rel: 'manifest', href: `${BASE_PATH}manifest.json` },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'style',
        href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@300;400;500;600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@300;400;500;600;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [
      { children: THEME_INIT },
      { type: 'application/ld+json', children: JSON_LD_APP },
      { type: 'application/ld+json', children: JSON_LD_FAQ },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
