import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url)
  try {
    const migration = readFileSync(join(__dirname, '..', 'migrations', '001_initial.sql'), 'utf-8')
    await sql.unsafe(migration)
    console.log('✓ Migration complete')
  } finally {
    await sql.end()
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
