# Graph Report - AI-Gateway  (2026-07-14)

## Corpus Check
- 88 files · ~30,796 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 409 nodes · 546 edges · 35 communities (26 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8d252f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- AI Gateway
- scripts
- dependencies
- package.json
- router.ts
- migrate.ts
- compilerOptions
- Graphify: концепція та інструкція використання для економії токенів
- What You Must Do When Invoked
- layout.tsx
- README.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- admin-auth.ts
- trpc.ts
- _app.ts
- admin-auth.ts
- dependencies
- icons.tsx
- graphify reference: extra exports and benchmark
- crypto.ts
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- rate-limiter.ts
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `route()` - 16 edges
2. `compilerOptions` - 16 edges
3. `AI Gateway — мультитенантний адаптер до безкоштовних AI-моделей` - 14 edges
4. `Graphify: концепція та інструкція використання для економії токенів` - 13 edges
5. `What You Must Do When Invoked` - 12 edges
6. `/graphify` - 11 edges
7. `GatewayError` - 11 edges
8. `scripts` - 10 edges
9. `graphify reference: extra exports and benchmark` - 8 edges
10. `AI Gateway` - 8 edges

## Surprising Connections (you probably didn't know these)
- `healthCheck()` --calls--> `createOpenAICompatibleAdapter()`  [EXTRACTED]
  scripts/health-check.ts → src/lib/providers/openai-compatible.ts
- `navItems()` --indirect_call--> `DashboardIcon()`  [INFERRED]
  src/app/admin/sidebar.tsx → src/app/admin/icons.tsx
- `navItems()` --indirect_call--> `ProjectsIcon()`  [INFERRED]
  src/app/admin/sidebar.tsx → src/app/admin/icons.tsx
- `navItems()` --indirect_call--> `ProvidersIcon()`  [INFERRED]
  src/app/admin/sidebar.tsx → src/app/admin/icons.tsx
- `navItems()` --indirect_call--> `LogsIcon()`  [INFERRED]
  src/app/admin/sidebar.tsx → src/app/admin/icons.tsx

## Import Cycles
- 1-file cycle: `src/lib/crypto.ts -> src/lib/crypto.ts`

## Communities (35 total, 9 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+24 more)

### Community 1 - "AI Gateway"
Cohesion: 0.22
Nodes (8): AI Gateway, Commands, Core invariants — never violate without explicit request, DB tables, Development phases, graphify, Source layout, Stack

### Community 2 - "scripts"
Cohesion: 0.12
Nodes (15): 1. Загальна концепція та СТИЛЬ (Theme & Mood), 1. Картки Ключових Метрик (Top KPI Cards), 2. Колірна палітра (Color Palette), 2. Огляд Складів (Warehouse Overview Table), 3. Графік Ефективності Синхронізації (Sync Performance), 3. Типографія (Typography), 4. Стан Запасів (Inventory Health Donut Chart), 4. Структура макету (Layout & Grid) (+7 more)

### Community 3 - "dependencies"
Cohesion: 0.08
Nodes (23): 10. Приклад контракту `ProviderAdapter`, 11. Типізовані помилки Gateway, 12. Що явно НЕ входить у MVP, 13. Контекст для AI-агента розробки, 1. Концепція проєкту, 2. Загальна архітектура, 3. Технологічний стек, 4. Провайдери (MVP) (+15 more)

### Community 4 - "package.json"
Cohesion: 0.15
Nodes (11): globalForDb, GatewayError, GatewayErrorCode, geminiProvider, groqProvider, providers, openrouterProvider, ChatMessage (+3 more)

### Community 5 - "router.ts"
Cohesion: 0.15
Nodes (22): errorResponse(), POST(), RequestSchema, authenticate(), Project, failureCounters, isCircuitOpen(), isKeyCircuitOpen() (+14 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Graphify: концепція та інструкція використання для економії токенів"
Cohesion: 0.11
Nodes (17): Graphify: концепція та інструкція використання для економії токенів, Встановлення, Зміст, Коли Graphify не варто ставити, Команди: повний довідник під задачі, Командна робота, Крок 1 — одразу після `git init`, Крок 2 — `.graphifyignore` до першого білду графа (+9 more)

### Community 9 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 10 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, inter, metadata

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 15 - "admin-auth.ts"
Cohesion: 0.14
Nodes (16): login(), bytesToHex(), constantTimeEqual(), createSessionToken(), encoder, getSigningKey(), hexToBytes(), verifyAdminPassword() (+8 more)

### Community 17 - "trpc.ts"
Cohesion: 0.11
Nodes (7): REQUEST_STATUSES, STATUS_STYLES, ProviderRow, STATUS_STYLES, ProviderKeysPanel(), STATUS_STYLES, QueryError()

### Community 18 - "_app.ts"
Cohesion: 0.17
Nodes (10): healthCheck(), createOpenAICompatibleAdapter(), trpc, AppRouter, chatRouter, projectsRouter, providerKeysRouter, modelsCache (+2 more)

### Community 19 - "admin-auth.ts"
Cohesion: 0.13
Nodes (15): logout(), AdminLayout(), Dict, en, LanguageContext, LanguageProvider(), LANGS, LanguageSwitcher() (+7 more)

### Community 20 - "dependencies"
Cohesion: 0.10
Nodes (21): next, dependencies, next, postgres, react, react-dom, superjson, @tanstack/react-query (+13 more)

### Community 21 - "icons.tsx"
Cohesion: 0.20
Nodes (13): ActivityIcon(), AlertIcon(), base, ChatIcon(), DashboardIcon(), IconProps, LogoutIcon(), LogsIcon() (+5 more)

### Community 22 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 23 - "crypto.ts"
Cohesion: 0.43
Nodes (3): decryptSecret(), encryptSecret(), getKey()

### Community 24 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 25 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 26 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 27 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **182 isolated node(s):** `graphify`, `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)`, `Step 1 - Ensure graphify is installed` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `QueryError()` connect `trpc.ts` to `icons.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `graphify`, `Usage`, `What graphify is for` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._