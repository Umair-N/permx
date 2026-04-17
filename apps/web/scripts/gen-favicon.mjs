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
