# BigBatch Domain Slice Checklist

## Shared Contracts

- Add or update TypeBox schemas in `packages/shared/src/schemas`.
- Export derived `Static<typeof Schema>` types when other packages consume them.
- Re-export new public contracts through `packages/shared/src/index.ts` when appropriate.

## API Layer

- Follow `src/modules/<domain>/index.ts`, `<domain>.routes.ts`, and `<domain>.service.ts`.
- Keep routes thin and return `{ data: ... }` envelopes.
- Use `AppError` subclasses for expected failures.
- Use `request.householdId` and `request.userRole` for household-scoped work instead of parsing headers manually.

## Database and Invariants

- Confirm table and relation changes in `apps/api/src/db/schema.ts` if the slice needs new persistence.
- Preserve existing soft-delete rules and ownership invariants.
- Add indexes that match the new query paths.

## Tests

- Add example-based tests for concrete workflows and edge cases.
- Add `fast-check` invariants for normalization, generated values, or pure business rules when they add coverage value.
- Run the narrowest filtered validation command that can fail fast on the touched slice.

## Web Integration

- Only change the web app when the request includes it.
- Keep API calls routed through the shared client surface.
- Reuse shared contracts instead of re-declaring request or response shapes locally.
