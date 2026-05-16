# BigBatch — Unit of Work Plan

## Decomposition Overview

BigBatch is a monorepo with 4 packages: `packages/shared`, `apps/api`, `apps/web`, `apps/mobile`. The natural decomposition aligns with these package boundaries, since each package has distinct technology, build, and deployment concerns.

The key question is execution **order** — what to build first, and whether to further subdivide any package into smaller units.

---

## Planning Steps

- [x] Determine unit boundaries and granularity
- [x] Determine execution order and dependencies
- [x] Generate `unit-of-work.md` with unit definitions and responsibilities
- [x] Generate `unit-of-work-dependency.md` with dependency matrix
- [x] Generate `unit-of-work-story-map.md` mapping stories to units
- [x] Document code organization strategy (greenfield)
- [x] Validate unit boundaries and dependencies
- [x] Ensure all stories are assigned to units

---

## Questions

### Q1: Unit Granularity

The monorepo has 4 packages. Each package could be **one unit**, or packages could be split further (e.g., API split by domain module — auth first, then recipes, then ingredients, etc.).

Which approach do you prefer?

A) **4 units** — one per package: `shared`, `api`, `web`, `mobile`. Each unit is built as a whole.
B) **Domain-sliced** — vertical slices cutting across packages (e.g., "Auth slice" = shared auth types + API auth module + web auth pages + mobile auth screens). More units, but each delivers end-to-end functionality.
C) **Hybrid** — `shared` as one unit, `api` as one unit, then `web` and `mobile` split by feature area.

[Answer]: B

### Q2: Execution Order

Regardless of granularity, `packages/shared` must come first (everything depends on it) and the API must come before clients (web/mobile need endpoints to call). But the web and mobile apps are independent.

Which order for `web` vs `mobile`?

A) **Web first** — build the web app immediately after API, mobile later
B) **Mobile first** — build the mobile app immediately after API, web later
C) **Parallel** — treat web and mobile as independent units that can be built in any order (or simultaneously)

[Answer]: C

### Q3: Mobile Scope in This Phase

Should the mobile app be included as a unit of work now, or deferred?

A) **Include now** — plan and build mobile as part of this project phase
B) **Defer** — plan only `shared`, `api`, and `web` for now; mobile is a future phase

[Answer]: A

### Q4: API Internal Build Order

When building the API, should all modules be built together, or in a specific domain order?

A) **All at once** — implement all API modules (auth, recipes, ingredients, shopping-list, cook-events, core) in a single unit
B) **Ordered by dependency** — build `core` first, then `auth`, then the rest. This gives incremental testability but more planning overhead.

[Answer]: B
