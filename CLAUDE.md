# AI Gateway

Multi-tenant OpenAI-compatible gateway to free LLM providers. One Next.js app serves both the gateway API (`/v1/*`) and admin panel (`/admin/*`, Phase 4).

## Core invariants — never violate without explicit request
- Every `/v1/*` route must follow: `authenticate` → `checkQuota` → check cache → `route` (on miss) → _(logging is inside router / cache path)_
- Errors: always `throw new GatewayError(code, message, statusCode)` — never bare `new Error`
- API keys: format `gw_live_<32 hex>`, stored as SHA-256 hash only, compared with `timingSafeEqual`
- Provider secrets: either env vars (`GROQ_API_KEY` etc., built-in providers only) or AES-256-GCM-encrypted rows in `provider_api_keys` (`src/lib/crypto.ts`) — never hardcoded, never plaintext in DB
- New provider with a bespoke API shape (non-OpenAI-compatible, e.g. Gemini): implement `ProviderAdapter` in `src/lib/providers/<name>.ts`, add to `src/lib/providers/index.ts` registry, add a `providers` DB row. New OpenAI-compatible provider (most free-tier services): just add it through the admin panel (Providers → Add provider) — no code needed, it's served by the generic adapter in `providers/openai-compatible.ts`
- A provider can have multiple API keys (`provider_api_keys`, admin-managed); router.ts round-robins across them and retries the next key on failure before moving to the next provider
- `requests_per_minute` is enforced per (provider, key) — each key gets its own rate-limit bucket. `provider_api_keys.requests_per_minute` optionally overrides `providers.requests_per_minute` for that one key (NULL = inherit); this is what actually lets N keys multiply a provider's throughput instead of sharing one shared budget. `requests_per_day` exists on both tables but isn't enforced anywhere yet (pre-existing gap)
- Only custom (admin-added) providers can be deleted (`providers.remove`, guarded server-side against built-in ids) — built-in providers can only be deactivated. Deleting a provider cascades its keys and nulls `request_logs.provider_id` (`ON DELETE SET NULL`) rather than deleting historical logs
- `/admin/*` routes require a valid `admin_session` cookie (checked in `middleware.ts` and again in every `adminProcedure`) — never add an `/admin/*` page or tRPC procedure that skips this
- Admin panel UI/design work must follow `Resources/inventory_sync_design_guideline.md` (dark B2B theme, `#F26E21` accent — tokens live in `globals.css` under `.admin-theme`)
- Architecture decisions in `AI-GATEWAY-PROJECT.md §6` are final — don't re-propose alternatives

## Stack
TypeScript · Next.js 16 (App Router) · postgres.js (raw SQL, no ORM) · Zod · pnpm · tRPC v11 + React Query (admin API)

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
  cache.ts        response cache — key(model+messages+temperature) → response_cache, temperature-bucketed TTL
  crypto.ts       AES-256-GCM encrypt/decrypt/mask for provider_api_keys (key: ENCRYPTION_KEY env)
  router.ts       provider selection loop, per-key rotation + rate limiting + request logging (exports logRequest)
  providers/
    types.ts      ProviderAdapter interface (id, name, isConfigured, chat(msgs, opts, apiKey?)) + ChatMessage/ChatOptions/ChatResponse
    groq.ts       Groq adapter (model:"auto" → llama-3.1-8b-instant)
    openai-compatible.ts  generic adapter factory for admin-added custom providers (base_url + DB key)
    index.ts      code adapter registry, keyed by id — routing order/active/limits come from DB `providers` table, not here

src/lib/admin-auth.ts  Web-Crypto-only (Edge-safe) admin password check + signed session token
src/middleware.ts       gates all /admin/* behind admin_session cookie

src/server/
  trpc.ts               tRPC init + adminProcedure (session check, defense in depth vs middleware)
  routers/_app.ts        root router: projects, providers, logs, stats
  routers/projects.ts     project CRUD, generates gw_live_ keys
  routers/providers.ts    live provider config (priority/active/limits), create custom provider, circuit breaker reset
  routers/providerKeys.ts add/remove/toggle/updateLimit API keys per provider (masked in responses, never returns plaintext)
  routers/logs.ts         paginated request_logs with filters
  routers/stats.ts        dashboard aggregates

src/app/admin/
  login/page.tsx          password form (Server Action in actions.ts sets the session cookie)
  (dashboard)/layout.tsx   nav + logout, wraps dashboard/projects/providers/logs (route group, no URL segment)
  api/trpc/[trpc]/route.ts  tRPC fetch adapter

src/app/v1/chat/completions/route.ts  — POST /v1/chat/completions (main endpoint)
migrations/001_initial.sql            — full schema DDL + Groq seed
scripts/migrate.ts                    — migration runner
scripts/create-project.ts             — project creation CLI
```

## DB tables
`projects` · `providers` · `provider_api_keys` · `request_logs` · `daily_stats` · `response_cache` · `rate_limit_state`
Full DDL → `migrations/001_initial.sql` (+ `002_add_providers.sql`, `003_provider_api_keys.sql`, `004_provider_delete.sql`, `005_provider_key_limits.sql`)

## Development phases
- **1 ✅ Core Gateway** — auth, Groq adapter, logging
- **2 ✅ Provider Pool** — Gemini + OpenRouter, circuit breaker, sliding-window rate limiter
- **3 ✅ Cache** — response cache, TTL bucketed by temperature (deterministic/standard/creative)
- **4 ✅ Admin Panel** — password-login + signed-cookie session, tRPC v11 API, dashboard/projects/providers/logs UI. Providers screen writes live to the `providers` table — router.ts reads priority/active/limits from DB on every request (not from code) as of this phase. Extended to support admin-added custom (OpenAI-compatible) providers and multiple AES-256-GCM-encrypted API keys per provider, with per-key rotation and retry in router.ts
- **5** Deploy — Northflank + Cloudflare (provider key encryption already done in Phase 4, ahead of schedule)
- **6** Connect pet-projects

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
