# Graph Report - AI Gateway  (2026-07-01)

## Corpus Check
- 30 files · ~6,920 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 68 nodes · 99 edges · 7 communities (6 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6ef16e1`
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

## God Nodes (most connected - your core abstractions)
1. `AI Gateway` - 8 edges
2. `scripts` - 8 edges
3. `ProviderAdapter` - 7 edges
4. `route()` - 7 edges
5. `ChatMessage` - 5 edges
6. `ChatOptions` - 5 edges
7. `ChatResponse` - 5 edges
8. `isCircuitOpen()` - 3 edges
9. `onProviderSuccess()` - 3 edges
10. `onProviderFailure()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `route()` --calls--> `isCircuitOpen()`  [EXTRACTED]
  src/lib/router.ts → src/lib/circuit-breaker.ts
- `route()` --calls--> `onProviderSuccess()`  [EXTRACTED]
  src/lib/router.ts → src/lib/circuit-breaker.ts
- `route()` --calls--> `onProviderFailure()`  [EXTRACTED]
  src/lib/router.ts → src/lib/circuit-breaker.ts
- `route()` --calls--> `isProviderRateLimited()`  [EXTRACTED]
  src/lib/router.ts → src/lib/rate-limiter.ts
- `route()` --calls--> `recordProviderCall()`  [EXTRACTED]
  src/lib/router.ts → src/lib/rate-limiter.ts

## Import Cycles
- None detected.

## Communities (7 total, 1 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx, @types/node, @types/react (+2 more)

### Community 1 - "AI Gateway"
Cohesion: 0.22
Nodes (8): AI Gateway, Commands, Core invariants — never violate without explicit request, DB tables, Development phases, graphify, Source layout, Stack

### Community 2 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:create-project, db:migrate, dev, graphify:update, lint, start

### Community 3 - "dependencies"
Cohesion: 0.20
Nodes (9): dependencies, next, postgres, react, react-dom, zod, name, private (+1 more)

### Community 4 - "package.json"
Cohesion: 0.31
Nodes (8): geminiProvider, groqProvider, providers, openrouterProvider, ChatMessage, ChatOptions, ChatResponse, ProviderAdapter

### Community 5 - "router.ts"
Cohesion: 0.33
Nodes (9): failureCounters, isCircuitOpen(), onProviderFailure(), onProviderSuccess(), isProviderRateLimited(), recordProviderCall(), windows, logRequest() (+1 more)

## Knowledge Gaps
- **35 isolated node(s):** `__dirname`, `migrationsDir`, `failureCounters`, `windows`, `Core invariants — never violate without explicit request` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `dependencies`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `__dirname`, `migrationsDir`, `failureCounters` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._