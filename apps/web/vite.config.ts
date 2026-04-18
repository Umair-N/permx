import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BASE = process.env.PERMX_BASE ?? '/'

const config = defineConfig({
  base: BASE,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      router: {
        basepath: BASE.replace(/\/$/, '') || '/',
      },
      pages: [
        { path: '/' },
        { path: '/docs/getting-started' },
        { path: '/vs/casl' },
        { path: '/vs/casbin' },
      ],
      sitemap: {
        enabled: false,
      },
    }),
    viteReact(),
  ],
})

export default config
