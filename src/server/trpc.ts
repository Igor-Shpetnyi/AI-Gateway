import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export async function createTRPCContext() {
  return {}
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
})

export const router = t.router

// middleware.ts already blocks unauthenticated requests to /admin/*, this is
// defense in depth for the tRPC layer itself.
const isAdmin = t.middleware(async ({ next }) => {
  const store = await cookies()
  const token = store.get(ADMIN_SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next()
})

export const adminProcedure = t.procedure.use(isAdmin)
