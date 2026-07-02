# Graph Report - ai-gateway  (2026-07-02)

## Corpus Check
- 71 files · ~16,206 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 301 nodes · 513 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1f20038`
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
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_README|README.md]]
- [[_COMMUNITY_eslint.config.mjs|eslint.config.mjs]]
- [[_COMMUNITY_next.config.ts|next.config.ts]]
- [[_COMMUNITY_postcss.config.mjs|postcss.config.mjs]]
- [[_COMMUNITY_trpc.ts|trpc.ts]]
- [[_COMMUNITY__app.ts|_app.ts]]
- [[_COMMUNITY_admin-auth.ts|admin-auth.ts]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AI Gateway — мультитенантний адаптер до безкоштовних AI-моделей` - 14 edges
3. `route()` - 13 edges
4. `Graphify: концепція та інструкція використання для економії токенів` - 13 edges
5. `useI18n()` - 12 edges
6. `POST()` - 11 edges
7. `GatewayError` - 10 edges
8. `ProviderAdapter` - 9 edges
9. `scripts` - 8 edges
10. `trpc` - 8 edges

## Surprising Connections (you probably didn't know these)
- `AdminLayout()` --calls--> `getServerLang()`  [EXTRACTED]
  src/app/admin/(dashboard)/layout.tsx → src/app/admin/i18n/server.ts
- `LogsPage()` --calls--> `useI18n()`  [EXTRACTED]
  src/app/admin/(dashboard)/logs/page.tsx → src/app/admin/i18n/LanguageProvider.tsx
- `DashboardPage()` --calls--> `useI18n()`  [EXTRACTED]
  src/app/admin/(dashboard)/page.tsx → src/app/admin/i18n/LanguageProvider.tsx
- `ProjectsPage()` --calls--> `useI18n()`  [EXTRACTED]
  src/app/admin/(dashboard)/projects/page.tsx → src/app/admin/i18n/LanguageProvider.tsx
- `ProvidersPage()` --calls--> `useI18n()`  [EXTRACTED]
  src/app/admin/(dashboard)/providers/page.tsx → src/app/admin/i18n/LanguageProvider.tsx

## Import Cycles
- 1-file cycle: `src/lib/crypto.ts -> src/lib/crypto.ts`

## Communities (18 total, 4 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.06
Nodes (32): dependencies, next, postgres, react, react-dom, superjson, @tanstack/react-query, @trpc/client (+24 more)

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
Cohesion: 0.13
Nodes (25): failureCounters, isCircuitOpen(), onProviderFailure(), onProviderSuccess(), GatewayError, GatewayErrorCode, geminiProvider, groqProvider (+17 more)

### Community 5 - "router.ts"
Cohesion: 0.28
Nodes (11): errorResponse(), POST(), RequestSchema, authenticate(), Project, cacheKey(), cacheTtlSeconds(), getCachedResponse() (+3 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Graphify: концепція та інструкція використання для економії токенів"
Cohesion: 0.11
Nodes (17): Graphify: концепція та інструкція використання для економії токенів, Встановлення, Зміст, Коли Graphify не варто ставити, Команди: повний довідник під задачі, Командна робота, Крок 1 — одразу після `git init`, Крок 2 — `.graphifyignore` до першого білду графа (+9 more)

### Community 10 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, inter, metadata

### Community 11 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 17 - "trpc.ts"
Cohesion: 0.09
Nodes (30): LogsPage(), REQUEST_STATUSES, STATUS_STYLES, DashboardPage(), ProjectsPage(), ProviderRow, ProviderRowView(), ProvidersPage() (+22 more)

### Community 18 - "_app.ts"
Cohesion: 0.15
Nodes (15): decryptSecret(), encryptSecret(), getKey(), maskSecret(), globalForDb, AppRouter, logsRouter, projectsRouter (+7 more)

### Community 19 - "admin-auth.ts"
Cohesion: 0.13
Nodes (21): login(), logout(), AdminLayout(), LANGS, LanguageSwitcher(), getServerLang(), isValidLang(), Lang (+13 more)

## Knowledge Gaps
- **131 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+126 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Lang` connect `admin-auth.ts` to `trpc.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `route()` connect `package.json` to `router.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.12944523470839261 - nodes in this community are weakly interconnected._