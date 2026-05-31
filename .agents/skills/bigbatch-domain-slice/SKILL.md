---
name: bigbatch-domain-slice
description: 'Implement BigBatch domain slices such as ingredients, recipes, shopping list, and cook events. Use when adding household-scoped shared contracts, Fastify modules, service logic, tests, and optional web wiring across packages.'
argument-hint: 'Describe the domain slice or unit to plan or implement'
---

# BigBatch Domain Slice

Use this skill when a change spans `packages/shared`, `apps/api`, and optionally `apps/web` for a single BigBatch feature slice.

## When to Use

- Adding a new household-scoped feature such as ingredients, recipes, shopping list, or cook events
- Extending an existing domain with new API endpoints or shared contracts
- Planning or implementing a feature slice that needs the same sequencing across packages

## Procedure

1. Confirm the slice boundary and inspect the nearest existing implementation patterns in auth and household.
2. Update shared contracts first when request or response shapes cross package boundaries.
3. Implement or extend the API module with thin routes, service-owned business logic, and household-scoped behavior where required.
4. Add focused tests for business rules, error cases, and invariants before widening into broader validation.
5. Add or adjust web integration only for the requested slice and keep it aligned with the shared-first contract changes.
6. Validate the touched packages with filtered `pnpm` commands.

## References

- [Checklist](./references/checklist.md)
- [Examples](./references/examples.md)
