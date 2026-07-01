# AI Gateway

Multi-tenant OpenAI-compatible gateway to free LLM providers. One Next.js app serves both the gateway API (`/v1/*`) and admin panel (`/admin/*`, Phase 4).

## Core invariants — never violate without explicit request
- Every `/v1/*` route must follow: `authenticate` → `checkQuota` → `route` → _(logging is inside router)_
- Errors: always `throw new GatewayError(code, message, statusCode)` — never bare `new Error`
- API keys: format `gw_live_<32 hex>`, stored as SHA-256 hash only, compared with `timingSafeEqual`
- Provider secrets: env vars only (`GROQ_API_KEY` etc.) — never hardcoded, never plaintext in DB
- New provider: implement `ProviderAdapter` in `src/lib/providers/<name>.ts`, add to `src/lib/providers/index.ts`
- Architecture decisions in `AI-GATEWAY-PROJECT.md §6` are final — don't re-propose alternatives

## Stack
TypeScript · Next.js 16 (App Router) · postgres.js (raw SQL, no ORM) · Zod · pnpm

## Commands
```bash
pnpm dev                              # dev server :3000
docker compose up -d db               # local PostgreSQL
pnpm db:migrate                       # run migrations (needs .env.local)
pnpm db:create-project <name>         # create project + print API key
```

## Source layout
```
src/lib/
  db.ts           postgres.js client — global singleton (hot-reload safe)
  errors.ts       GatewayError with typed codes
  auth.ts         Bearer token → project row (timingSafeEqual)
  quota.ts        daily quota check via COUNT(request_logs)
  router.ts       provider selection loop + request logging
  providers/
    types.ts      ProviderAdapter interface + ChatMessage/ChatOptions/ChatResponse
    groq.ts       Groq adapter (model:"auto" → llama-3.1-8b-instant)
    index.ts      active provider registry

src/app/v1/chat/completions/route.ts  — POST /v1/chat/completions (main endpoint)
migrations/001_initial.sql            — full schema DDL + Groq seed
scripts/migrate.ts                    — migration runner
scripts/create-project.ts             — project creation CLI
```

## DB tables
`projects` · `providers` · `request_logs` · `daily_stats` · `response_cache` · `rate_limit_state`
Full DDL → `migrations/001_initial.sql`

## Development phases
- **1 ✅ Core Gateway** — auth, Groq adapter, logging
- **2 ✅ Provider Pool** — Gemini + OpenRouter, circuit breaker, sliding-window rate limiter
- **3** Cache — response cache with TTL strategy
- **4** Admin Panel — tRPC + Next.js UI (dashboard, projects CRUD, logs)
- **5** Deploy — Northflank + Cloudflare, AES-256-GCM provider key encryption
- **6** Connect pet-projects

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
