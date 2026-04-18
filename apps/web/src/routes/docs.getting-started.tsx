import { createFileRoute, Link } from '@tanstack/react-router'
import CopyButton from '#/components/CopyButton'
import { SITE_URL, siteUrl } from '#/lib/site'

const DOCS_URL = siteUrl('docs/getting-started')

const BREADCRUMB_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'PermX', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: DOCS_URL },
    { '@type': 'ListItem', position: 3, name: 'Getting Started', item: DOCS_URL },
  ],
})

const HOWTO_JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Get Started with PermX — Structured RBAC for Node.js and React',
  description:
    'Step-by-step guide to adding structured RBAC to a Node.js and React app with PermX.',
  totalTime: 'PT15M',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Install', text: 'Add @permx/core and @permx/react via bun, npm, pnpm, or yarn.' },
    { '@type': 'HowToStep', position: 2, name: 'Define permissions', text: 'Declare your permission schema with definePermissions() to get typed keys.' },
    { '@type': 'HowToStep', position: 3, name: 'Create the engine', text: 'Pass your data provider (Mongoose, Prisma, or custom) to createPermX().' },
    { '@type': 'HowToStep', position: 4, name: 'Protect routes', text: 'Wrap your Express, Hono, Fastify, or Koa routes with createPermXMiddleware.' },
    { '@type': 'HowToStep', position: 5, name: 'Gate the UI', text: 'Wrap React components with <Can>, <CanField>, and <RouteGuard>.' },
  ],
})

export const Route = createFileRoute('/docs/getting-started')({
  head: () => ({
    meta: [
      {
        title:
          'Getting Started with PermX — RBAC for Node.js and React Tutorial',
      },
      {
        name: 'description',
        content:
          'Step-by-step guide to adding structured RBAC to your Node.js and React app with PermX. Install, define permissions, wire middleware, gate UI components.',
      },
      {
        property: 'og:title',
        content: 'Getting Started with PermX — Structured RBAC Tutorial',
      },
      {
        property: 'og:description',
        content:
          'Step-by-step guide to adding structured RBAC to your Node.js and React app with PermX.',
      },
    ],
    links: [{ rel: 'canonical', href: DOCS_URL }],
    scripts: [
      { type: 'application/ld+json', children: BREADCRUMB_JSON_LD },
      { type: 'application/ld+json', children: HOWTO_JSON_LD },
    ],
  }),
  component: GettingStarted,
})

function GettingStarted() {
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
            <li>docs</li>
            <li aria-hidden="true">/</li>
            <li className="text-(--ink)">getting-started</li>
          </ol>
        </nav>
        <h1 className="display-xl mt-4 max-w-[22ch] text-(--ink)">
          Get started with{' '}
          <span className="italic-accent">PermX.</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[1.05rem] leading-[1.65] text-(--ink-soft)">
          From zero to a working RBAC system in three steps. Define permissions
          with typed keys, wire middleware on the backend, and gate UI
          components on the frontend — all sharing the same permission
          vocabulary.
        </p>
      </section>

      <Step
        n={1}
        title="Install"
        description="Add the core engine and optionally the React SDK. PermX has zero runtime dependencies — mongoose and express are optional peers."
      >
        <InstallBlock label="backend" cmd="bun add @permx/core" />
        <InstallBlock label="frontend" cmd="bun add @permx/react" />
        <InstallBlock
          label="with mongoose + express"
          cmd="bun add @permx/core mongoose express"
        />
      </Step>

      <Step
        n={2}
        title="Define permissions"
        description="Declare your permission schema once with definePermissions(). TypeScript infers literal key strings — every rename propagates to middleware and UI gates at compile time."
      >
        <CodeBlock
          filename="permissions.ts"
          code={`import { definePermissions } from '@permx/core'

export const P = definePermissions({
  projectsView: {
    module: 'projects',
    resource: 'tasks',
    action: 'view',
    scope: 'all',
  },
  projectsEdit: {
    module: 'projects',
    resource: 'tasks',
    action: 'update',
    scope: 'own',
  },
  viewSalary: {
    module: 'people',
    resource: 'employees',
    action: 'view',
    scope: 'own',
    field: 'salary',
  },
} as const)`}
        />
      </Step>

      <Step
        n={3}
        title="Create the engine"
        description="Pass your data provider — Mongoose, Prisma, or a custom PermXDataProvider implementation. The engine returns the authorize function used by both server middleware and client SDK."
      >
        <CodeBlock
          filename="server.ts"
          code={`import { createPermX } from '@permx/core/mongoose'
import mongoose from 'mongoose'

const permx = createPermX({
  connection: mongoose.connection,
  cache: { ttl: 300_000 },
})

// Seed on first run
await permx.syncFromConfig({
  modules: [{ key: 'projects', name: 'Projects' }],
  permissions: [
    {
      key: P.projectsView,
      name: 'View Projects',
      moduleKey: 'projects',
    },
  ],
  roles: [
    {
      key: 'editor',
      name: 'Editor',
      permissionKeys: [P.projectsView],
    },
  ],
})`}
        />
      </Step>

      <Step
        n={4}
        title="Protect routes"
        description="Wrap your Express (or Hono, Fastify, Koa) routes with the middleware. The engine resolves role inheritance, checks the permission key, and returns 403 on denial."
      >
        <CodeBlock
          filename="routes.ts"
          code={`import { createPermXMiddleware } from '@permx/core/express'
import { P } from './permissions'

const auth = createPermXMiddleware(permx, {
  extractUserId: (req) => req.user?.id,
  extractTenantId: (req) => req.headers['x-tenant-id'],
})

app.get('/projects', auth.authorize(P.projectsView), listProjects)
app.put('/projects/:id', auth.authorize(P.projectsEdit), updateProject)`}
        />
      </Step>

      <Step
        n={5}
        title="Gate the UI"
        description="Wrap React components with headless gates. Same permission keys on both sides of the wire — the backend and frontend always agree."
      >
        <CodeBlock
          filename="App.tsx"
          code={`import { PermXProvider, Can, CanField, RouteGuard } from '@permx/react'

function App() {
  return (
    <PermXProvider fetchPermissions={fetchUserPermissions}>
      <Can componentId="edit-project-btn">
        <EditButton />
      </Can>

      <CanField fieldId="salary">
        <SalaryColumn />
      </CanField>

      <RouteGuard routeId="/admin" fallback={<NoAccess />}>
        <AdminPanel />
      </RouteGuard>
    </PermXProvider>
  )
}`}
        />
      </Step>

      <section className="frame rule-h pt-12 pb-20">
        <h2 className="display-lg text-(--ink)">
          Next steps
        </h2>
        <ul className="mt-6 space-y-3 text-[1rem] leading-[1.6] text-(--ink-soft)">
          <li>
            <a href="https://github.com/Umair-N/permx" target="_blank" rel="noreferrer" className="text-(--cobalt) underline underline-offset-4">
              Browse the source
            </a>{' '}
            — full API in the README
          </li>
          <li>
            <a href="https://github.com/Umair-N/permx/tree/main/examples" target="_blank" rel="noreferrer" className="text-(--cobalt) underline underline-offset-4">
              Examples directory
            </a>{' '}
            — Express, Hono, Next.js App Router, React demo
          </li>
          <li>
            <a href="/#compare" className="text-(--cobalt) underline underline-offset-4">
              Compare with CASL, Casbin, Permit.io
            </a>{' '}
            — spec sheet on the homepage
          </li>
        </ul>
      </section>
    </>
  )
}

function Step({
  n,
  title,
  description,
  children,
}: {
  n: number
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="frame rule-h pt-12 pb-12">
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div>
          <span className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-(--cobalt)">
            step {String(n).padStart(2, '0')}
          </span>
          <h2 className="display-md mt-3 text-(--ink)">{title}</h2>
          <p className="mt-4 max-w-[42ch] text-[0.95rem] leading-[1.6] text-(--ink-soft)">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </section>
  )
}

function InstallBlock({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div className="marks relative border border-(--rule-strong) bg-(--ink) p-5 text-(--paper)">
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

function CodeBlock({ filename, code }: { filename: string; code: string }) {
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
        <CopyButton value={code} />
      </div>
      <div className="code-block">
        <pre className="text-[0.82rem] leading-relaxed">{code}</pre>
      </div>
    </div>
  )
}
