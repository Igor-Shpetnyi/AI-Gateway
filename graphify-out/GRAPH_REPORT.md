# Graph Report - AI Gateway  (2026-07-01)

## Corpus Check
- 25 files · ~5,969 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 37 nodes · 35 edges · 5 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `839a00e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_AI Gateway|AI Gateway]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_package.json|package.json]]

## God Nodes (most connected - your core abstractions)
1. `AI Gateway` - 8 edges
2. `scripts` - 8 edges
3. `Core invariants — never violate without explicit request` - 1 edges
4. `Stack` - 1 edges
5. `Commands` - 1 edges
6. `Source layout` - 1 edges
7. `DB tables` - 1 edges
8. `Development phases` - 1 edges
9. `graphify` - 1 edges
10. `private` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (5 total, 0 thin omitted)

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
Cohesion: 0.33
Nodes (6): dependencies, next, postgres, react, react-dom, zod

### Community 4 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **31 isolated node(s):** `Core invariants — never violate without explicit request`, `Stack`, `Commands`, `Source layout`, `DB tables` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.314) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `Core invariants — never violate without explicit request`, `Stack`, `Commands` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._