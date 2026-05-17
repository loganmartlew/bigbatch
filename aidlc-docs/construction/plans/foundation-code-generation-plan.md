# Unit 0: Foundation — Code Generation Plan

## Unit Context

**Unit**: Foundation (Unit 0)
**Scope**: Monorepo scaffolding, shared types/schemas, API server skeleton with full DB schema + core middleware, web shell, mobile shell, CI/test infrastructure
**Stories**: None (infrastructure unit — enables Units 1–5)
**Dependencies**: None (first unit)

---

## Generation Steps

### Step 1: Monorepo Root Setup

- [x] Create `package.json` (workspace root — name, private, scripts)
- [x] Create `pnpm-workspace.yaml` (define `apps/*` and `packages/*`)
- [x] Create `turbo.json` (pipeline: build, dev, lint, test, typecheck)
- [x] Create `tsconfig.base.json` (shared TS config — strict, ESM, path aliases)
- [x] Create `.gitignore`
- [x] Create `.nvmrc` (Node version)

### Step 2: Shared Package (`packages/shared`)

- [x] Create `packages/shared/package.json`
- [x] Create `packages/shared/tsconfig.json`
- [x] Create `packages/shared/src/index.ts` (barrel export)
- [x] Create `packages/shared/src/types/index.ts` — base domain types
- [x] Create `packages/shared/src/types/api.ts` — API envelope types, error codes
- [x] Create `packages/shared/src/schemas/index.ts` — barrel export

### Step 3: API Package Setup (`apps/api`)

- [x] Create `apps/api/package.json`
- [x] Create `apps/api/tsconfig.json`
- [x] Create `apps/api/src/index.ts` — Fastify entry point

### Step 4: Database Schema (`apps/api/src/db`)

- [x] Create `apps/api/src/db/schema.ts` — complete Drizzle schema for all 12 tables
- [x] Create `apps/api/src/db/client.ts` — Drizzle client factory
- [x] Create `apps/api/drizzle.config.ts` — Drizzle Kit config

### Step 5: Core Middleware Module (`apps/api/src/modules/core`)

- [x] Create `apps/api/src/modules/core/index.ts` — Fastify plugin
- [x] Create `apps/api/src/modules/core/auth-guard.ts` — session validation middleware
- [x] Create `apps/api/src/modules/core/household-resolver.ts` — X-Household-Id resolver
- [x] Create `apps/api/src/modules/core/error-handler.ts` — global error handler
- [x] Create `apps/api/src/modules/core/errors.ts` — error class definitions

### Step 6: API Shared Utilities (`apps/api/src/lib`)

- [x] Create `apps/api/src/lib/env.ts` — environment variable loader
- [x] Create `apps/api/src/lib/lucia.ts` — Lucia auth adapter setup

### Step 7: Web Shell (`apps/web`)

- [x] Create `apps/web/package.json`
- [x] Create `apps/web/tsconfig.json`
- [x] Create `apps/web/vite.config.ts`
- [x] Create `apps/web/index.html`
- [x] Create `apps/web/src/main.tsx` — React entry point
- [x] Create `apps/web/src/lib/api-client.ts` — fetch wrapper with X-Household-Id
- [x] Create `apps/web/src/lib/household-context.ts` — localStorage household state
- [x] Create `apps/web/src/routes/__root.tsx` — TanStack Router root layout
- [x] Create `apps/web/src/routes/index.tsx` — home page route

### Step 8: Mobile Shell (`apps/mobile`)

- [x] Create `apps/mobile/package.json`
- [x] Create `apps/mobile/tsconfig.json`
- [x] Create `apps/mobile/app.json` — Expo config
- [x] Create `apps/mobile/app/_layout.tsx` — root layout with query provider
- [x] Create `apps/mobile/app/index.tsx` — home screen
- [x] Create `apps/mobile/src/lib/api-client.ts` — fetch wrapper with X-Household-Id
- [x] Create `apps/mobile/src/lib/household-context.ts` — AsyncStorage household state

### Step 9: Test Infrastructure

- [x] Create `apps/api/vitest.config.ts`
- [x] Create `apps/api/src/__tests__/schema.test.ts` — schema validation tests
- [x] Create `apps/api/src/__tests__/errors.test.ts` — error class unit tests

### Step 10: Documentation Summary

- [x] Create `aidlc-docs/construction/foundation/code/code-generation-summary.md`

---

## File Count Estimate

| Package         | Files | Notes                                                                                                     |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------- |
| Root            | 5     | package.json, pnpm-workspace, turbo, tsconfig, .gitignore, .nvmrc                                         |
| packages/shared | 5     | package.json, tsconfig, index, types, api types, schemas barrel                                           |
| apps/api        | 12    | package.json, tsconfig, drizzle config, entry, db schema, db client, core module (5 files), lib (2 files) |
| apps/web        | 8     | package.json, tsconfig, vite config, index.html, main, api client, household context, root route          |
| apps/mobile     | 6     | package.json, tsconfig, app.json, App, api client, household context                                      |
| Tests           | 3     | vitest configs (2), schema test, error handler test                                                       |
| Docs            | 1     | code-generation-summary.md                                                                                |
| **Total**       | ~40   |                                                                                                           |
