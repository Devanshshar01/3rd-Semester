import './env.ts'
import { createServer as createViteServer } from 'vite'
import app from './app'
import { pool } from './db'

const start = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
    app.use(vite.middlewares)
  }
  const port = Number(process.env.PORT) || 3000
  app.listen(port, () => console.log(`studyspace server listening on http://localhost:${port}`))
}

void start().catch(error => {
  console.error('Server startup failed', error)
  process.exitCode = 1
})

process.on('SIGTERM', () => { void pool?.end() })
