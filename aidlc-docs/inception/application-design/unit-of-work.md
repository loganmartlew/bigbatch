# BigBatch — Units of Work

## Decomposition Strategy

**Approach**: Domain-sliced (Q1=B) — each unit is a vertical slice cutting across `packages/shared`, `apps/api`, `apps/web`, and `apps/mobile`. API modules are ordered by dependency (Q4=B). Web and mobile are built in parallel within each slice (Q2=C, Q3=A).

**Execution order**: Units are numbered 0–5 and must be built sequentially (each depends on prior units). Within each unit, the web and mobile client work is independent and can be done in parallel.

---

## Unit 0: Foundation

**Scope**: Project scaffolding, shared package core, API server skeleton, database schema, core middleware

**Packages touched**: `packages/shared`, `apps/api`, `apps/web` (shell), `apps/mobile` (shell)

**Responsibilities**:

- Monorepo setup (pnpm workspaces, Turborepo, tsconfig)
- `packages/shared`: base types (`User`, `UserHousehold`, `Household`, `Unit` enum), TypeBox base schemas, shared utilities
- `apps/api`: Fastify server entry point, plugin registration, Drizzle ORM setup + full database schema (all tables), core module (auth middleware, schema validation, rate limiter, error handler, CORS, security headers, structured logging)
- `apps/web`: Vite + React + TanStack Router shell, API client setup, TanStack Query provider, localStorage household context
- `apps/mobile`: Expo project init, React Navigation shell, API client setup, TanStack Query provider, AsyncStorage household context
- CI/test infrastructure: Vitest config, fast-check setup

**Why first**: Everything else depends on the server skeleton, DB schema, core middleware, and project scaffolding.

---

## Unit 1: Auth & Household

**Scope**: User registration (with full name), login, sessions, household create/join/invite/manage, multi-household membership

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`, `apps/mobile`

**Responsibilities**:

- `packages/shared`: `RegisterSchema`, `LoginSchema`, auth-related types
- `apps/api`: auth module — all 10 endpoints (register, login, logout, me, households CRUD, join link/code, invites, members, remove member)
- `apps/web`: Login page, Register page (first/last name), Onboarding (create/join household), Household Settings page, Household Switcher, auth state management
- `apps/mobile`: Login screen, Register screen, Onboarding, Household Settings, Household Switcher, secure token storage

**Why second**: All domain features require an authenticated user in a household.

---

## Unit 2: Ingredients

**Scope**: Ingredient library CRUD, OpenFoodFacts search, shopping categories

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`, `apps/mobile`

**Responsibilities**:

- `packages/shared`: `Ingredient` type refinements, `CreateIngredientSchema`, `UpdateIngredientSchema`
- `apps/api`: ingredients module — 6 endpoints (CRUD + OpenFoodFacts search), cached proxy with LRU
- `apps/web`: Ingredient Library page, Create/Edit Ingredient form, OpenFoodFacts search UI, category assignment
- `apps/mobile`: Ingredient Library screen, Create/Edit form, OpenFoodFacts search, category assignment

**Why third**: Recipes reference ingredients — the ingredient library must exist before recipes can be created.

---

## Unit 3: Recipes

**Scope**: Recipe CRUD, duplication, scaling, nutrition computation, cook mode

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`, `apps/mobile`

**Responsibilities**:

- `packages/shared`: `nutrition` module (`calculateTotalNutrition`, `calculatePerPortionNutrition`), `scaling` module (`scaleIngredients`, `roundQuantity`), recipe schemas
- `apps/api`: recipes module — 7 endpoints (CRUD, duplicate, scale), nutrition computation on read
- `apps/web`: Recipes List page, Recipe Detail page (with nutrition), Recipe Editor, Duplicate action, Scale UI, Cook Mode (full-screen, wake-lock, step checkboxes)
- `apps/mobile`: Recipes List screen, Recipe Detail, Recipe Editor, Duplicate, Scale, Cook Mode (expo-keep-awake)

**Why fourth**: Recipes depend on ingredients. Cook mode is included here since it's recipe-specific UI.

---

## Unit 4: Shopping

**Scope**: Shopping list generation from recipes, consolidation, tick-off, "I have this", grouping by category, clear

**Packages touched**: `packages/shared`, `apps/api`, `apps/web`, `apps/mobile`

**Responsibilities**:

- `packages/shared`: `shopping` module (`consolidateItems`, `addRecipeToList`, `groupByCategory`)
- `apps/api`: shopping-list module — 4 endpoints (get list, add recipe, toggle item, clear)
- `apps/web`: Shopping List page (grouped by category), Add-to-list action from recipe view, tick-off, "I have this" toggle, clear
- `apps/mobile`: Shopping List screen, same features as web

**Why fifth**: Shopping lists reference recipes and ingredients.

---

## Unit 5: Cook Events

**Scope**: Cook event logging and history

**Packages touched**: `apps/api`, `apps/web`, `apps/mobile`

**Responsibilities**:

- `apps/api`: cook-events module — 2 endpoints (log event, get history)
- `apps/web`: Log Cook Event action (from recipe detail or post-cook-mode), Cook History view on recipe detail
- `apps/mobile`: Log Cook Event action, Cook History view

**Why last**: Cook events are the simplest domain module with no dependencies on other features. Minimal shared package work (types already defined in Unit 0).

---

## Code Organization Strategy (Greenfield)

```
bigbatch/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts              # Fastify entry point
│   │   │   ├── db/
│   │   │   │   ├── schema.ts          # Drizzle schema (all tables)
│   │   │   │   └── client.ts          # Drizzle client + Turso connection
│   │   │   ├── modules/
│   │   │   │   ├── core/              # Middleware plugins
│   │   │   │   ├── auth/              # Routes + services
│   │   │   │   ├── recipes/
│   │   │   │   ├── ingredients/
│   │   │   │   ├── shopping-list/
│   │   │   │   └── cook-events/
│   │   │   └── lib/                   # Shared API utilities
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── routes/                # TanStack Router file-based routes
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── recipes/
│   │   │   │   ├── ingredients/
│   │   │   │   ├── shopping-list/
│   │   │   │   ├── cook-mode/
│   │   │   │   ├── cook-history/
│   │   │   │   └── household/
│   │   │   ├── ui/                    # Shared presentational components
│   │   │   └── lib/                   # API client, auth helpers, etc.
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── app/                       # Expo Router screens
│       ├── features/                  # Same structure as web/features
│       ├── ui/
│       ├── lib/
│       ├── package.json
│       └── app.json
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
