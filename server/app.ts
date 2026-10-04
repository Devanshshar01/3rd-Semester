import express from 'express'
import path from 'node:path'
import { clerkMiddleware } from '@clerk/express'
import { api } from './api'

const app = express()
app.disable('x-powered-by')

if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
  app.use(clerkMiddleware({
    proxyUrl: process.env.CLERK_PROXY_URL || (process.env.NODE_ENV === 'production'
      ? 'https://studywithatea.vercel.app/__clerk'
      : undefined),
    // Keep local development on Clerk's normal development frontend API.
    frontendApiProxy: { enabled: () => process.env.NODE_ENV === 'production' },
    debug: process.env.CLERK_DEBUG === 'true',
  }))
}

app.use(express.json({ limit: '32kb' }))
app.use('/api', api)
app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'The requested API endpoint does not exist.', details: {} } }))

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(process.cwd(), 'dist')
  app.use(express.static(dist, { index: false, immutable: true, maxAge: '1y' }))
  app.get('*path', (_req, res) => res.sendFile('index.html', { root: dist }))
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const err = error as { status?: number }
  const status = err.status === 503 ? 503 : 500
  if (status === 500) console.error('Request failed')
  res.status(status).json({ error: { code: status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR', message: status === 503 ? 'A required service is not configured.' : 'An unexpected error occurred.', details: {} } })
})

export default app
