import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '../public')

const SITE_ORIGIN = (process.env.VITE_SITE_ORIGIN ?? 'https://permx.nuvaynlabs.com').replace(/\/$/, '')
const BASE_PATH = (process.env.PERMX_BASE ?? '/').replace(/\/?$/, '/')
const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`
const LASTMOD = new Date().toISOString().slice(0, 10)

const PAGES = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'docs/getting-started/', priority: '0.9', changefreq: 'monthly' },
  { path: 'vs/casl/', priority: '0.8', changefreq: 'monthly' },
  { path: 'vs/casbin/', priority: '0.8', changefreq: 'monthly' },
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
).join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}sitemap.xml
`

await writeFile(resolve(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(resolve(PUBLIC_DIR, 'robots.txt'), robots, 'utf8')

console.log(`[gen-seo-assets] wrote sitemap.xml + robots.txt for ${SITE_URL}`)
