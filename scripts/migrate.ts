import postgres from 'postgres'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'migrations')

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url)
  try {
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), 'utf-8')
      await sql.unsafe(content)
      console.log(`✓ ${file}`)
    }

    console.log('Migration complete')
  } finally {
    await sql.end()
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
