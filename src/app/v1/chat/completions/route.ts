import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticate } from '@/lib/auth'
import { checkQuota } from '@/lib/quota'
import { route, logRequest } from '@/lib/router'
import { cacheKey, cacheTtlSeconds, getCachedResponse, setCachedResponse } from '@/lib/cache'
import { GatewayError } from '@/lib/errors'

const RequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const project = await authenticate(request.headers.get('authorization'))

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse(400, 'invalid_request_error', 'Request body must be valid JSON')
    }

    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(400, 'invalid_request_error', parsed.error.issues[0]?.message ?? 'Invalid request')
    }

    const { model, messages, temperature, max_tokens, stream } = parsed.data

    if (stream) {
      return errorResponse(400, 'invalid_request_error', 'Streaming is not yet supported. Omit stream or set stream: false.')
    }

    await checkQuota(project.id, project.daily_quota)

    const key = cacheKey(model, messages, temperature)
    const cached = await getCachedResponse(key)

    let response
    if (cached) {
      await logRequest({
        projectId: project.id,
        providerId: cached.provider,
        model: cached.model,
        promptTokens: cached.promptTokens,
        completionTokens: cached.completionTokens,
        latencyMs: 0,
        status: 'cached',
      })
      response = cached
    } else {
      response = await route(project.id, messages, { model, temperature, max_tokens })
      await setCachedResponse(key, response, cacheTtlSeconds(temperature))
    }

    return NextResponse.json({
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: response.content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.promptTokens,
        completion_tokens: response.completionTokens,
        total_tokens: response.promptTokens + response.completionTokens,
      },
    })
  } catch (err) {
    if (err instanceof GatewayError) {
      return NextResponse.json(
        { error: { message: err.message, code: err.code, type: 'gateway_error' } },
        { status: err.statusCode }
      )
    }
    console.error('[Gateway] Unexpected error:', err)
    return errorResponse(500, 'internal_error', 'Internal server error')
  }
}

function errorResponse(status: number, type: string, message: string) {
  return NextResponse.json({ error: { message, type } }, { status })
}
