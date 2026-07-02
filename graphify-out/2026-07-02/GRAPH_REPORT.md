# Graph Report - ai-gateway  (2026-07-02)

## Corpus Check
- 32 files · ~7,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 163 nodes · 208 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `80980ca3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_AI Gateway|AI Gateway]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_router.ts|router.ts]]
- [[_COMMUNITY_migrate.ts|migrate.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_Graphify концепція та інструкція використання для економії токенів|Graphify: концепція та інструкція використання для економії токенів]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_README|README.md]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AI Gateway — мультитенантний адаптер до безкоштовних AI-моделей` - 14 edges
3. `Graphify: концепція та інструкція використання для економії токенів` - 13 edges
4. `GatewayError` - 9 edges
5. `route()` - 9 edges
6. `scripts` - 8 edges
7. `AI Gateway` - 8 edges
8. `ProviderAdapter` - 7 edges
9. `7. Безпека` - 7 edges
10. `POST()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `route()`  [EXTRACTED]
  src/app/v1/chat/completions/route.ts → src/lib/router.ts
- `POST()` --calls--> `authenticate()`  [EXTRACTED]
  src/app/v1/chat/completions/route.ts → src/lib/auth.ts
- `POST()` --calls--> `checkQuota()`  [EXTRACTED]
  src/app/v1/chat/completions/route.ts → src/lib/quota.ts
- `route()` --calls--> `isCircuitOpen()`  [EXTRACTED]
  src/lib/router.ts → src/lib/circuit-breaker.ts
- `route()` --calls--> `onProviderSuccess()`  [EXTRACTED]
  src/lib/router.ts → src/lib/circuit-breaker.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.10
Nodes (19): dependencies, next, postgres, react, react-dom, zod, devDependencies, eslint (+11 more)

### Community 1 - "AI Gateway"
Cohesion: 0.22
Nodes (8): AI Gateway, Commands, Core invariants — never violate without explicit request, DB tables, Development phases, graphify, Source layout, Stack

### Community 2 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:create-project, db:migrate, dev, graphify:update, lint, start

### Community 3 - "dependencies"
Cohesion: 0.09
Nodes (22): 10. Приклад контракту `ProviderAdapter`, 11. Типізовані помилки Gateway, 12. Що явно НЕ входить у MVP, 13. Контекст для AI-агента розробки, 1. Концепція проєкту, 2. Загальна архітектура, 3. Технологічний стек, 4. Провайдери (MVP) (+14 more)

### Community 4 - "package.json"
Cohesion: 0.26
Nodes (10): GatewayError, GatewayErrorCode, geminiProvider, groqProvider, providers, openrouterProvider, ChatMessage, ChatOptions (+2 more)

### Community 5 - "router.ts"
Cohesion: 0.24
Nodes (9): failureCounters, isCircuitOpen(), onProviderFailure(), onProviderSuccess(), isProviderRateLimited(), recordProviderCall(), windows, logRequest() (+1 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Graphify: концепція та інструкція використання для економії токенів"
Cohesion: 0.11
Nodes (17): Graphify: концепція та інструкція використання для економії токенів, Встановлення, Зміст, Коли Graphify не варто ставити, Команди: повний довідник під задачі, Командна робота, Крок 1 — одразу після `git init`, Крок 2 — `.graphifyignore` до першого білду графа (+9 more)

### Community 9 - "route.ts"
Cohesion: 0.31
Nodes (7): errorResponse(), POST(), RequestSchema, authenticate(), Project, globalForDb, checkQuota()

### Community 10 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **97 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Graphify: концепція та інструкція використання для економії токенів` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._