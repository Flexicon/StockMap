import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'public/icon-source.svg')

const icons = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/icon-maskable-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

for (const [target, size] of icons) {
  const output = resolve(root, target)
  await mkdir(dirname(output), { recursive: true })

  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(output)
}
