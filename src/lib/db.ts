import postgres from 'postgres'

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined
}

export const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
})

// Reuse connection across Next.js hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  globalForDb.sql = sql
}
