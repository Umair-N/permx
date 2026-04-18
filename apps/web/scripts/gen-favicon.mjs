import { readFile, writeFile, unlink } from 'node:fs/promises'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const PUB = new URL('../public/', import.meta.url)
const svg = await readFile(new URL('logo.svg', PUB))

const sizes = [16, 32, 48, 192, 512]
const tmp = []

for (const size of sizes) {
  const out = new URL(`logo${size}.png`, PUB)
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out.pathname)
  tmp.push(out.pathname)
  console.log('wrote', out.pathname)
}

const icoSources = tmp.filter((p) => /logo(16|32|48)\.png$/.test(p))
const ico = await pngToIco(icoSources)
await writeFile(new URL('favicon.ico', PUB), ico)
console.log('wrote favicon.ico')

for (const p of icoSources) await unlink(p)
console.log('cleaned intermediate 16/32/48 PNGs')

const OG_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f2efe7"/>
  <g transform="translate(80 80)" stroke="#0e0e10" stroke-width="2">
    <line x1="0" y1="0" x2="40" y2="0"/><line x1="0" y1="0" x2="0" y2="40"/>
    <line x1="1040" y1="0" x2="1040" y2="40"/><line x1="1040" y1="0" x2="1000" y2="0"/>
    <line x1="0" y1="470" x2="40" y2="470"/><line x1="0" y1="470" x2="0" y2="430"/>
    <line x1="1040" y1="470" x2="1000" y2="470"/><line x1="1040" y1="470" x2="1040" y2="430"/>
  </g>
  <g transform="translate(120 170)">
    <rect x="0" y="0" width="220" height="220" fill="none" stroke="#0e0e10" stroke-width="6"/>
    <path d="M40 40 H160 V136 H72 V180 H40 Z" fill="#0e0e10"/>
    <rect x="92" y="68" width="44" height="44" fill="#0b4fff"/>
  </g>
  <g transform="translate(400 170)" font-family="Georgia, 'Instrument Serif', serif" fill="#0e0e10">
    <text x="0" y="80" font-size="96" font-weight="400">PermX</text>
    <text x="0" y="150" font-size="34" fill="#29282b">Structured RBAC for Node.js and React</text>
    <g font-family="monospace" font-size="22" fill="#6e6a60">
      <text x="0" y="220">module.resource:field.action.scope</text>
      <text x="0" y="260">zero-dep core · multi-tenant · typed keys</text>
    </g>
  </g>
  <g transform="translate(80 560)" font-family="monospace" font-size="20" fill="#6e6a60">
    <text x="0" y="0">github.com/Umair-N/permx</text>
    <text x="1040" y="0" text-anchor="end">@permx/core · @permx/react · @permx/prisma</text>
  </g>
</svg>`)

await sharp(OG_SVG).png().toFile(new URL('og.png', PUB).pathname)
console.log('wrote og.png (1200x630)')
