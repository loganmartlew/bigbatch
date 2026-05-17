# Unit 0: Foundation — Code Generation Summary

## Files Created (38 total)

### Root (6 files)

| File                  | Purpose                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `package.json`        | Workspace root — pnpm scripts for Turborepo                                     |
| `pnpm-workspace.yaml` | Defines `apps/*` and `packages/*` workspaces                                    |
| `turbo.json`          | Turborepo pipeline: build, dev, lint, test, typecheck, db:generate, db:migrate  |
| `tsconfig.base.json`  | Shared TS config — strict, ES2022, ESNext module, bundler resolution            |
| `.gitignore`          | Standard ignores for node_modules, dist, .turbo, .env, coverage, .expo, drizzle |
| `.nvmrc`              | Node 22                                                                         |

### Shared Package (6 files)

| File                                   | Purpose                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `packages/shared/package.json`         | @bigbatch/shared — exports types + schemas                              |
| `packages/shared/tsconfig.json`        | Extends base config                                                     |
| `packages/shared/src/index.ts`         | Barrel re-export of types + api                                         |
| `packages/shared/src/types/index.ts`   | All domain types: User, Household, Recipe, Ingredient, etc. + Unit enum |
| `packages/shared/src/types/api.ts`     | ApiResponse\<T\>, ApiErrorResponse, ERROR_CODES, ErrorCode              |
| `packages/shared/src/schemas/index.ts` | Empty barrel — populated in later units                                 |

### API Package (15 files)

| File                                              | Purpose                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/api/package.json`                           | @bigbatch/api — Fastify, Drizzle, Lucia, argon2                                                      |
| `apps/api/tsconfig.json`                          | Extends base config                                                                                  |
| `apps/api/drizzle.config.ts`                      | Drizzle Kit config for Turso migrations                                                              |
| `apps/api/vitest.config.ts`                       | Vitest config for API tests                                                                          |
| `apps/api/src/index.ts`                           | Fastify entry point with helmet, cors, rate-limit, core plugin                                       |
| `apps/api/src/db/schema.ts`                       | Complete Drizzle schema — 12 tables with columns, FKs, indexes, relations                            |
| `apps/api/src/db/client.ts`                       | Drizzle client factory with Turso/libSQL                                                             |
| `apps/api/src/lib/env.ts`                         | Environment variable loader (DATABASE_URL, SESSION_SECRET, etc.)                                     |
| `apps/api/src/lib/lucia.ts`                       | Lucia auth adapter with Drizzle for sessions + users                                                 |
| `apps/api/src/modules/core/index.ts`              | Core Fastify plugin — registers error handler, auth guard, household resolver                        |
| `apps/api/src/modules/core/errors.ts`             | Error classes: Validation, Authentication, Forbidden, NotFound, Conflict, RateLimit, ExternalService |
| `apps/api/src/modules/core/error-handler.ts`      | Global error handler — AppError → typed response, unknown → generic 500                              |
| `apps/api/src/modules/core/auth-guard.ts`         | Session validation via Lucia, attaches request.user, skips public routes                             |
| `apps/api/src/modules/core/household-resolver.ts` | X-Household-Id header → validate membership → attach householdId + userRole                          |
| `apps/api/src/__tests__/schema.test.ts`           | Schema validation tests (table existence, soft delete columns)                                       |
| `apps/api/src/__tests__/errors.test.ts`           | Error class unit tests (status codes, error codes, default messages)                                 |

### Web Shell (9 files)

| File                                    | Purpose                                                             |
| --------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/package.json`                 | @bigbatch/web — React, TanStack Router + Query, Vite                |
| `apps/web/tsconfig.json`                | Extends base with JSX, DOM libs                                     |
| `apps/web/vite.config.ts`               | Vite config with React plugin, API proxy to localhost:3000          |
| `apps/web/index.html`                   | HTML entry point                                                    |
| `apps/web/src/main.tsx`                 | React mount with QueryClient + TanStack Router                      |
| `apps/web/src/routes/__root.tsx`        | Root layout with header + Outlet                                    |
| `apps/web/src/routes/index.tsx`         | Home page route                                                     |
| `apps/web/src/lib/api-client.ts`        | Typed fetch wrapper — auto-injects X-Household-Id from localStorage |
| `apps/web/src/lib/household-context.ts` | localStorage get/set/clear for active household ID                  |

### Mobile Shell (7 files)

| File                                       | Purpose                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `apps/mobile/package.json`                 | @bigbatch/mobile — Expo, React Native, TanStack Query               |
| `apps/mobile/tsconfig.json`                | Extends base with React Native types                                |
| `apps/mobile/app.json`                     | Expo config (bigbatch slug, iOS + Android)                          |
| `apps/mobile/app/_layout.tsx`              | Root layout with QueryClient + Stack navigator                      |
| `apps/mobile/app/index.tsx`                | Home screen                                                         |
| `apps/mobile/src/lib/api-client.ts`        | Typed fetch wrapper — auto-injects X-Household-Id from AsyncStorage |
| `apps/mobile/src/lib/household-context.ts` | AsyncStorage get/set/clear for active household ID                  |

## Key Design Decisions

- **Active household is client-side only** — localStorage (web) / AsyncStorage (mobile), sent as `X-Household-Id` header
- **Auth guard + household resolver** run as Fastify onRequest hooks in sequence; skip configurable route sets
- **Error classes** map to HTTP status codes with structured `{ error: { code, message } }` responses
- **Soft deletes** on recipes, ingredients, cook_events via `deletedAt` column
- **Auto-increment integer IDs** on all entity tables; text ID for sessions (Lucia)
- **SQLite datetime strings** via `text` columns with `datetime('now')` defaults
