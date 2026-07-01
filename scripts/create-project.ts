import postgres from 'postgres'
import crypto from 'crypto'

async function createProject(name: string) {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = postgres(url)
  try {
    const key = `gw_live_${crypto.randomBytes(16).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')
    const id = crypto.randomUUID()

    await sql`
      INSERT INTO projects (id, name, api_key_hash, is_active)
      VALUES (${id}, ${name}, ${keyHash}, true)
    `

    console.log(`✓ Project created`)
    console.log(`  Name:    ${name}`)
    console.log(`  ID:      ${id}`)
    console.log(`  API Key: ${key}`)
    console.log(``)
    console.log(`  ⚠ Save this key — it will not be shown again`)
  } finally {
    await sql.end()
  }
}

const name = process.argv[2]
if (!name) {
  console.error('Usage: pnpm db:create-project <project-name>')
  process.exit(1)
}

createProject(name).catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
