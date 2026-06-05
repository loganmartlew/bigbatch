# Unit 5: Cook Events — Code Generation Summary

## Sync Note

- Synced against the current source tree on 2026-06-05.
- This summary reflects the active workspace only: `apps/api`, `apps/web`, and `packages/shared`.
- Unit 5 is approved in `aidlc-docs/aidlc-state.md`; the tracked workflow has now advanced to Build and Test.
- Focused validation is complete for the new cook-events slice, but full workspace build/test closure is still pending.

## Overview

Unit 5 implements a queue-backed cook orchestration flow. Recipes can be queued from the recipe detail page, required ingredients are reflected into the shopping list, readiness is derived from shopping completion state, cook mode runs against the queued cook, finishing a cook creates a cook event, and household users can review queue/history and edit cook event dates.

## Files Created

### Shared (`packages/shared/`)

| File                              | Purpose                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| `src/types/cook-events.ts`        | Shared queued-cook, cook-event, dashboard, cleanup, and cook-mode types |
| `src/schemas/cook-event.ts`       | TypeBox request/response schemas for the Unit 5 API surface             |

### API (`apps/api/`)

| File                                                           | Purpose                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/modules/cook-events/cook-events.logic.ts`                 | Pure readiness, shopping lookup, quantity comparison, and rescaling helpers    |
| `src/modules/cook-events/cook-events.service.ts`               | Queue creation, dashboard loading, batch-size edits, cancellation, finish flow |
| `src/modules/cook-events/cook-events.routes.ts`                | Fastify routes for queued cooks, cook mode, cook history, and event editing    |
| `src/modules/cook-events/index.ts`                             | Fastify plugin registration wrapper                                             |
| `src/modules/cook-events/__tests__/cook-events.routes.test.ts` | Route wiring and route-level behavior tests                                    |
| `src/modules/cook-events/__tests__/cook-events.pbt.test.ts`    | Property-based tests for readiness derivation and scaling invariants            |
| `drizzle/0003_freezing_excalibur.sql`                          | Migration for `queued_cooks` and `queued_cook_ingredients`                     |

### Web (`apps/web/`)

| File                                                             | Purpose                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/features/cook-events/api.ts`                                | TanStack Query hooks for dashboard, queue mutations, cook mode, and editing |
| `src/features/cook-events/components/cooks-dashboard-page.tsx`    | Household cooks dashboard with queue status and recent history              |
| `src/features/cook-events/components/queued-cook-mode-page.tsx`   | Queue-backed cook mode with ingredients shown first and checklist steps     |
| `src/features/cook-events/components/cook-event-editor-modal.tsx` | Shared cook-event date/notes editing modal                                 |
| `src/features/cook-events/components/queued-cook-mode-page.test.tsx` | Focused test for checklist cook mode behavior                           |
| `src/features/cook-events/components/cook-event-editor-modal.test.tsx` | Focused test for cook-event editing flow                              |
| `src/routes/cooks/index.tsx`                                     | Route for the cooks dashboard                                               |
| `src/routes/cooks/$queuedCookId.tsx`                             | Route for queue-backed cook mode                                            |

## Files Modified

| File                                              | Changes                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/shared/src/types/index.ts`              | Re-exported Unit 5 shared types                                         |
| `packages/shared/src/schemas/index.ts`            | Re-exported Unit 5 TypeBox schemas                                      |
| `apps/api/src/db/schema.ts`                       | Added queued-cook tables, indexes, and relations                        |
| `apps/api/src/__tests__/schema.test.ts`           | Extended schema smoke coverage for new Unit 5 tables                    |
| `apps/api/src/index.ts`                           | Registered the cook-events plugin                                       |
| `apps/web/src/lib/api-client.ts`                  | Extended DELETE support to send cancellation request bodies             |
| `apps/web/src/routes/__root.tsx`                  | Added cooks navigation entry                                            |
| `apps/web/src/routes/recipes/$recipeId.index.tsx` | Added queue-cook action, inline recipe history, and event edit affordance |

## API Endpoints

| Method | Path                        | Auth | Description                                            |
| ------ | --------------------------- | ---- | ------------------------------------------------------ |
| POST   | `/recipes/:id/queued-cooks` | Auth | Queue a recipe cook and project requirements to shopping |
| GET    | `/cooks`                    | Auth | Return queued cooks plus household cook-event history  |
| PATCH  | `/cooks/:id/batch-size`     | Auth | Update queued batch size while still gathering         |
| DELETE | `/cooks/:id`                | Auth | Cancel a queued cook with optional shopping cleanup    |
| GET    | `/cooks/:id/cook-mode`      | Auth | Load queue-backed cook mode payload                    |
| POST   | `/cooks/:id/finish`         | Auth | Finish a queued cook and create a cook event           |
| GET    | `/recipes/:id/cook-events`  | Auth | Load inline cook history for a recipe                  |
| PATCH  | `/cook-events/:id`          | Auth | Edit cook event date and notes                         |

## Validation Status

- Focused API validation passed for the Unit 5 slice:
  - `pnpm --filter @bigbatch/api test -- src/modules/cook-events/__tests__/cook-events.routes.test.ts src/modules/cook-events/__tests__/cook-events.pbt.test.ts`
  - `pnpm --filter @bigbatch/api typecheck`
- Focused web validation passed for the Unit 5 slice:
  - `pnpm --filter @bigbatch/web test -- src/features/cook-events/components/queued-cook-mode-page.test.tsx src/features/cook-events/components/cook-event-editor-modal.test.tsx`
  - `pnpm --filter @bigbatch/web typecheck`
- Database migration application is also reflected in the current workspace state via successful `pnpm db:migrate`.
- Full workspace build-and-test closure is still outstanding; `aidlc-docs/aidlc-state.md` correctly keeps Build and Test open.

## Current Scope Boundaries

- Unit 5 is implemented only in the active workspace packages `apps/api`, `apps/web`, and `packages/shared`.
- Queue readiness remains derived from shopping state rather than stored as a persistent queued-cook status field.
- Cook-event editing currently supports date and notes through the shared modal and API patch flow.
- This summary does not mark full workspace Build and Test complete; it records the narrower validations that have been confirmed.