# BigBatch — Units of Work

## Decomposition Strategy

**Approach**: Domain-sliced — each unit is a vertical slice cutting across `packages/shared`, `apps/api`, and `apps/web`. API modules remain ordered by dependency. The current construction plan is web-first; future native apps will be planned separately once the core flow is stable.

**Execution order**: Units are numbered 0–5 and must be built sequentially (each depends on prior units).

---

## Unit 0: Foundation

**Scope**: Project scaffolding, shared package core, API server skeleton, database schema, core middleware, polished web shell

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`

**Responsibilities**:

- Monorepo setup (pnpm workspaces, Turborepo, tsconfig)
- `packages/shared`: base types (`User`, `UserHousehold`, `Household`, `Unit` enum), TypeBox base schemas, shared utilities
- `apps/api`: Fastify server entry point, plugin registration, Drizzle ORM setup + full database schema (all tables), core module (auth middleware, schema validation, rate limiter, error handler, CORS, security headers, structured logging)
- `apps/web`: Vite + React + TanStack Router + Mantine shell, API client setup, TanStack Query provider, localStorage household context, security headers for deployed HTML
- CI/test infrastructure: Vitest config, fast-check setup

**Why first**: Everything else depends on the server skeleton, DB schema, core middleware, shared contracts, and the Mantine-based web shell.

---

## Unit 1: Auth & Household

**Scope**: User registration (with full name), login, sessions, household create/join/invite/manage, multi-household membership

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`

**Responsibilities**:

- `packages/shared`: `RegisterSchema`, `LoginSchema`, auth-related types
- `apps/api`: auth module — register, login, logout, me, households CRUD, join link/code, invites, members, remove member
- `apps/web`: Login page, Register page (first/last name), onboarding (create/join household), household settings page, household switcher, auth state management

**Why second**: All domain features require an authenticated user in a household.

---

## Unit 2: Ingredients

**Scope**: Ingredient library CRUD, OpenFoodFacts search, shopping categories

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`

**Responsibilities**:

- `packages/shared`: `Ingredient` type refinements, `CreateIngredientSchema`, `UpdateIngredientSchema`
- `apps/api`: ingredients module — CRUD + OpenFoodFacts search, cached proxy with LRU
- `apps/web`: Ingredient Library page, Create/Edit Ingredient form, OpenFoodFacts search UI, category assignment

**Why third**: Recipes reference ingredients — the ingredient library must exist before recipes can be created.

---

## Unit 3: Recipes

**Scope**: Recipe CRUD, duplication, scaling, nutrition computation, cook mode

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`

**Responsibilities**:

- `packages/shared`: `nutrition` module (`calculateTotalNutrition`, `calculatePerPortionNutrition`), `scaling` module (`scaleIngredients`, `roundQuantity`), recipe schemas
- `apps/api`: recipes module — CRUD, duplicate, scale, nutrition computation on read
- `apps/web`: Recipes List page, Recipe Detail page (with nutrition), Recipe Editor, Duplicate action, Scale UI, Cook Mode (full-screen, wake-lock, step checkboxes)

**Why fourth**: Recipes depend on ingredients. Cook mode is included here since it's recipe-specific UI.

---

## Unit 4: Shopping

**Scope**: Shopping list generation from recipes, consolidation, tick-off, "I have this", grouping by category, clear

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`

**Responsibilities**:

- `packages/shared`: `shopping` module (`consolidateItems`, `addRecipeToList`, `groupByCategory`)
- `apps/api`: shopping-list module — get list, add recipe, toggle item, clear
- `apps/web`: Shopping List page (grouped by category), Add-to-list action from recipe view, tick-off, "I have this" toggle, clear

**Why fifth**: Shopping lists reference recipes and ingredients.

---

## Unit 5: Cook Events

**Scope**: Cook event logging and history

**Packages touched**: `apps/api`, `apps/web`

**Responsibilities**:

- `apps/api`: cook-events module — log event, get history
- `apps/web`: Log Cook Event action (from recipe detail or post-cook-mode), Cook History view on recipe detail

**Why last**: Cook events are the simplest domain module with no dependencies on other features. Minimal shared package work (types already defined in Unit 0).

---

## Deferred Mobile Follow-On

- Fully native iOS and Android clients are outside the active unit plan.
- When resumed, they should be planned as a separate initiative that consumes the existing API rather than reviving the removed Expo workspace.

---

## Code Organization Strategy (Greenfield)

```text
bigbatch/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   └── client.ts
│   │   │   ├── modules/
│   │   │   │   ├── core/
│   │   │   │   ├── auth/
│   │   │   │   ├── recipes/
│   │   │   │   ├── ingredients/
│   │   │   │   ├── shopping-list/
│   │   │   │   └── cook-events/
│   │   │   └── lib/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── public/
│       │   └── _headers
│       ├── src/
│       │   ├── main.tsx
│       │   ├── theme.ts
│       │   ├── routes/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── recipes/
│       │   │   ├── ingredients/
│       │   │   ├── shopping-list/
│       │   │   ├── cook-mode/
│       │   │   ├── cook-history/
│       │   │   └── household/
│       │   ├── ui/
│       │   └── lib/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   ├── nutrition/
│       │   ├── scaling/
│       │   └── shopping/
│       ├── package.json
│       └── tsconfig.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```
