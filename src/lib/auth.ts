import crypto from 'crypto'
import { sql } from './db'
import { GatewayError } from './errors'

interface Project {
  id: string
  name: string
  daily_quota: number | null
  monthly_quota: number | null
  allowed_models: string[] | null
  api_key_hash: string
}

export async function authenticate(authHeader: string | null): Promise<Project> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new GatewayError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401)
  }

  const key = authHeader.slice(7)

  if (!/^gw_live_[0-9a-f]{32}$/.test(key)) {
    throw new GatewayError('UNAUTHORIZED', 'Invalid API key format', 401)
  }

  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  const rows = await sql<Project[]>`
    SELECT id, name, daily_quota, monthly_quota, allowed_models, api_key_hash
    FROM projects
    WHERE api_key_hash = ${keyHash}
    AND is_active = true
  `

  const project = rows[0]
  if (!project) {
    throw new GatewayError('UNAUTHORIZED', 'Invalid API key', 401)
  }

  // Defense-in-depth: constant-time comparison of the hashes
  const storedHash = Buffer.from(project.api_key_hash, 'hex')
  const computedHash = Buffer.from(keyHash, 'hex')
  if (!crypto.timingSafeEqual(storedHash, computedHash)) {
    throw new GatewayError('UNAUTHORIZED', 'Invalid API key', 401)
  }

  return project
}
