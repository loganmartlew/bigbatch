# BigBatch Domain Slice Examples

## Shared-first contracts

- `packages/shared/src/schemas/auth.ts` shows the current TypeBox plus `Static<typeof Schema>` pattern.
- `packages/shared/src/schemas/household.ts` shows simple domain-grouped request schemas.

## Thin routes plus service-owned logic

- `apps/api/src/modules/auth/auth.routes.ts` shows route handlers that validate inputs and delegate to services.
- `apps/api/src/modules/auth/household.routes.ts` shows the same pattern for a second domain surface.

## Household invariants and service logic

- `apps/api/src/modules/auth/household.service.ts` shows owner checks, invite code generation, seeded categories, and membership invariants.
- `apps/api/src/modules/core/household-resolver.ts` shows how household scope is resolved before routes run.

## Test patterns

- `apps/api/src/modules/auth/__tests__/auth.service.test.ts` shows example-based tests mixed with `fast-check` invariants.
- `apps/api/src/modules/auth/__tests__/household.service.test.ts` shows invite-code, normalization, and household-name invariants.
