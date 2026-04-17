import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const THEME_INIT = `(function(){try{var t=localStorage.getItem('permx-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'PermX — Structured RBAC for Node.js and React' },
      {
        name: 'description',
        content:
          'Permission keys with meaning, role inheritance that handles diamonds and cycles, UI-aware mappings, multi-tenant, framework-agnostic. Zero-dep core.',
      },
      { name: 'theme-color', content: '#f2efe7' },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#0a1628',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
      { rel: 'alternate icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
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
    scripts: [{ children: THEME_INIT }],
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
        <div id="main">{children}</div>
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
