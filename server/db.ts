import pg from 'pg'

export const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined, max: 10 }) : null
export function database() {
  if (!pool) throw Object.assign(new Error('Database is not configured'), { status: 503, code: 'DATABASE_UNAVAILABLE' })
  return pool
}
