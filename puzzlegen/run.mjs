import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const requireFromApp = createRequire(new URL('../app/package.json', import.meta.url))
const viteUrl = pathToFileURL(requireFromApp.resolve('vite')).href
const { createServer } = await import(viteUrl)
const server = await createServer({
  configFile: false,
  server: {
    middlewareMode: true,
    fs: { allow: ['..'] },
  },
  appType: 'custom',
  logLevel: 'error',
})

try {
  await server.ssrLoadModule('/../puzzlegen/generate.ts')
} finally {
  await server.close()
}
