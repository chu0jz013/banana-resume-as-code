import { mkdir, stat } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser } from 'playwright'
import { preview } from 'vite'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outputPath = resolve(repoRoot, 'dist/resume.pdf')

type PreviewServer = Awaited<ReturnType<typeof preview>>

function resolvePreviewUrl(server: PreviewServer) {
  const resolvedUrl = server.resolvedUrls?.local[0]
  if (resolvedUrl) return resolvedUrl

  const address = server.httpServer.address() as AddressInfo | null
  if (address) return `http://127.0.0.1:${address.port}/`

  throw new Error('Could not resolve Vite preview URL')
}

function closePreview(server: PreviewServer) {
  return new Promise<void>((resolveClose, rejectClose) => {
    server.httpServer.close((error) => {
      if (error) rejectClose(error)
      else resolveClose()
    })
  })
}

async function main() {
  await mkdir(dirname(outputPath), { recursive: true })

  const server = await preview({
    root: repoRoot,
    preview: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
    },
  })

  let browser: Browser | undefined

  try {
    const url = resolvePreviewUrl(server)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 1,
    })

    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate('document.fonts ? document.fonts.ready : Promise.resolve()')
    await page.evaluate('window.resumeAsCode?.resetZoom?.()')

    await page.pdf({
      path: outputPath,
      width: '210mm',
      height: '297mm',
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      printBackground: true,
      preferCSSPageSize: true,
    })

    const pdfStat = await stat(outputPath)
    console.log(`Exported ${relative(repoRoot, outputPath)} (${pdfStat.size} bytes, print scale 100%)`)
  } finally {
    await browser?.close()
    await closePreview(server)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)

  if (message.includes("Executable doesn't exist") || message.includes('browserType.launch')) {
    console.error('Install Chromium with: npx playwright install chromium')
  }

  process.exit(1)
})
