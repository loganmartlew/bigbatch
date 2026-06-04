# Unit 0: Foundation — Code Generation Summary

## Sync Note

- Synced against the current source tree on 2026-05-31.
- This summary describes the active foundation surface as it exists today; later units have extended some of these files.
- No active `apps/mobile` package exists in the workspace. Future native mobile remains deferred.

## Active Foundation Surface

### Root

| File                  | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `package.json`        | Workspace root — pnpm scripts for Turborepo                                    |
| `pnpm-workspace.yaml` | Explicit active workspaces for `apps/api`, `apps/web`, and `packages/*`        |
| `turbo.json`          | Turborepo pipeline: build, dev, lint, test, typecheck, db:generate, db:migrate |
| `tsconfig.base.json`  | Shared TS config — strict, ES2022, ESNext module, bundler resolution           |
| `.gitignore`          | Standard ignores for node_modules, dist, .turbo, .env, coverage, drizzle       |
| `.nvmrc`              | Node 22                                                                        |

### Shared Package

| File                                   | Purpose                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `packages/shared/package.json`         | `@bigbatch/shared` — exports types + schemas                            |
| `packages/shared/tsconfig.json`        | Extends base config                                                     |
| `packages/shared/src/index.ts`         | Barrel re-export of shared types, API envelopes, and schemas            |
| `packages/shared/src/types/index.ts`   | All domain types: User, Household, Recipe, Ingredient, etc. + Unit enum |
| `packages/shared/src/types/api.ts`     | `ApiResponse<T>`, `ApiErrorResponse`, `ERROR_CODES`, `ErrorCode`        |
| `packages/shared/src/schemas/index.ts` | Barrel re-export of shared TypeBox schemas                              |

### API Package

| File                                              | Purpose                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/api/package.json`                           | `@bigbatch/api` — Fastify, Drizzle, Lucia, auth/security dependencies                                  |
| `apps/api/tsconfig.json`                          | Extends base config                                                                                    |
| `apps/api/drizzle.config.ts`                      | Drizzle Kit config for Turso migrations                                                                |
| `apps/api/vitest.config.ts`                       | Vitest config for API tests                                                                            |
| `apps/api/src/index.ts`                           | Fastify entry point with helmet, cookie, cors, rate-limit, core plugin, and auth plugin                |
| `apps/api/src/db/schema.ts`                       | Complete Drizzle schema — 12 tables with columns, FKs, indexes, relations                              |
| `apps/api/src/db/client.ts`                       | Drizzle client factory with Turso/libSQL                                                               |
| `apps/api/src/lib/env.ts`                         | Environment variable loader (`DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL`, etc.) |
| `apps/api/src/lib/lucia.ts`                       | Lucia auth adapter with Drizzle for sessions + users                                                   |
| `apps/api/src/modules/core/index.ts`              | Core Fastify plugin — registers error handler, auth guard, household resolver                          |
| `apps/api/src/modules/core/errors.ts`             | Error classes: Validation, Authentication, Forbidden, NotFound, Conflict, RateLimit, ExternalService   |
| `apps/api/src/modules/core/error-handler.ts`      | Global error handler — AppError → typed response, unknown → generic 500                                |
| `apps/api/src/modules/core/auth-guard.ts`         | Session validation via Lucia, attaches `request.user`, skips public routes                             |
| `apps/api/src/modules/core/household-resolver.ts` | `X-Household-Id` header → validate membership → attach `householdId` + `userRole`                      |
| `apps/api/src/__tests__/schema.test.ts`           | Schema validation tests (table existence, soft delete columns)                                         |
| `apps/api/src/__tests__/errors.test.ts`           | Error class unit tests (status codes, error codes, default messages)                                   |

### Web Shell

| File                                    | Purpose                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/web/package.json`                 | `@bigbatch/web` — React, Mantine, TanStack Router + Query, Vite                    |
| `apps/web/tsconfig.json`                | Extends base with JSX, DOM libs                                                    |
| `apps/web/vite.config.ts`               | Vite config with React plugin, TanStack Router plugin, API proxy to localhost:3000 |
| `apps/web/index.html`                   | HTML entry point and page metadata                                                 |
| `apps/web/public/_headers`              | Cloudflare Pages security headers for deployed HTML responses                      |
| `apps/web/src/main.tsx`                 | React mount with MantineProvider, QueryClient, and TanStack Router                 |
| `apps/web/src/theme.ts`                 | Shared Mantine theme for spacing, radius, and brand styling                        |
| `apps/web/src/routes/__root.tsx`        | Mantine AppShell root layout                                                       |
| `apps/web/src/routes/index.tsx`         | Polished landing/dashboard foundation route                                        |
| `apps/web/src/lib/api-client.ts`        | Typed fetch wrapper — auto-injects `X-Household-Id` from localStorage              |
| `apps/web/src/lib/household-context.ts` | localStorage get/set/clear for active household ID                                 |

## Scope Adjustments

- The active workspace now includes only `apps/api`, `apps/web`, and `packages/shared`.
- `apps/mobile` has been removed from the active foundation and deferred for a future fully native implementation.
- The web foundation now standardizes on Mantine for theme, layout, and base component styling.

## Key Design Decisions

- **Active household is client-side only** — localStorage (web), sent as `X-Household-Id` header
- **Auth guard + household resolver** run as Fastify `onRequest` hooks in sequence; skip configurable route sets
- **Error classes** map to HTTP status codes with structured `{ error: { code, message } }` responses
- **Soft deletes** on recipes, ingredients, cook_events via `deletedAt` column
- **Auto-increment integer IDs** on all entity tables; text ID for sessions (Lucia)
- **SQLite datetime strings** via `text` columns with `datetime('now')` defaults
