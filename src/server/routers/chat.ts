import crypto from 'crypto'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, adminProcedure } from '../trpc'
import { sql } from '@/lib/db'
import { route, logRequest } from '@/lib/router'
import { cacheKey, cacheTtlSeconds, getCachedResponse, setCachedResponse } from '@/lib/cache'
import { GatewayError } from '@/lib/errors'
import type { ChatMessage } from '@/lib/providers/types'

// Must match the id seeded by migrations/007_chat_playground.sql
const ADMIN_PLAYGROUND_PROJECT_ID = 'admin-playground'

export const chatRouter = router({
  listConversations: adminProcedure.query(async () => {
    return sql<
      { id: string; title: string | null; created_at: Date; updated_at: Date }[]
    >`
      SELECT id, title, created_at, updated_at
      FROM chat_conversations
      ORDER BY updated_at DESC
    `
  }),

  createConversation: adminProcedure.mutation(async () => {
    const id = crypto.randomUUID()
    await sql`INSERT INTO chat_conversations (id, title) VALUES (${id}, NULL)`
    return { id }
  }),

  deleteConversation: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await sql`DELETE FROM chat_conversations WHERE id = ${input.id}`
    }),

  getMessages: adminProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ input }) => {
      return sql<
        {
          id: string
          role: 'user' | 'assistant'
          content: string
          provider_id: string | null
          model: string | null
          created_at: Date
        }[]
      >`
        SELECT id, role, content, provider_id, model, created_at
        FROM chat_messages
        WHERE conversation_id = ${input.conversationId}
        ORDER BY created_at
      `
    }),

  send: adminProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
        providerId: z.string().optional(),
        model: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { conversationId, content, providerId, model } = input

      await sql`
        INSERT INTO chat_messages (id, conversation_id, role, content)
        VALUES (${crypto.randomUUID()}, ${conversationId}, 'user', ${content})
      `

      const [conversation] = await sql<{ title: string | null }[]>`
        SELECT title FROM chat_conversations WHERE id = ${conversationId}
      `
      if (conversation && conversation.title === null) {
        const title = content.length > 60 ? `${content.slice(0, 60)}…` : content
        await sql`UPDATE chat_conversations SET title = ${title} WHERE id = ${conversationId}`
      }

      const history = await sql<{ role: 'user' | 'assistant'; content: string }[]>`
        SELECT role, content FROM chat_messages
        WHERE conversation_id = ${conversationId}
        ORDER BY created_at
      `
      const messages: ChatMessage[] = history.map((m) => ({ role: m.role, content: m.content }))

      const key = cacheKey(model ?? 'auto', messages)
      const cached = await getCachedResponse(key)

      let response
      try {
        if (cached) {
          await logRequest({
            projectId: ADMIN_PLAYGROUND_PROJECT_ID,
            providerId: cached.provider,
            model: cached.model,
            promptTokens: cached.promptTokens,
            completionTokens: cached.completionTokens,
            latencyMs: 0,
            status: 'cached',
          })
          response = cached
        } else {
          response = await route(ADMIN_PLAYGROUND_PROJECT_ID, messages, { model: model ?? 'auto' }, providerId)
          await setCachedResponse(key, response, cacheTtlSeconds())
        }
      } catch (err) {
        if (err instanceof GatewayError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message })
        }
        throw err
      }

      const messageId = crypto.randomUUID()
      await sql`
        INSERT INTO chat_messages (id, conversation_id, role, content, provider_id, model)
        VALUES (${messageId}, ${conversationId}, 'assistant', ${response.content}, ${response.provider}, ${response.model})
      `
      await sql`UPDATE chat_conversations SET updated_at = now() WHERE id = ${conversationId}`

      return {
        id: messageId,
        role: 'assistant' as const,
        content: response.content,
        provider_id: response.provider,
        model: response.model,
      }
    }),
})
