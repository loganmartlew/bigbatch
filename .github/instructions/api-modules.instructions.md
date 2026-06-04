---
description: 'Use when creating or changing Fastify modules, routes, services, or plugin registration in apps/api. Covers module structure, TypeBox validation, household scoping, and AppError usage.'
applyTo: 'apps/api/src/modules/**/*.ts,apps/api/src/index.ts'
---

# API Module Guidance

- Follow the existing domain layout: `src/modules/<domain>/index.ts`, `<domain>.routes.ts`, and `<domain>.service.ts`.
- Keep route handlers thin. Parse request inputs, call service functions, and return `{ data: ... }` responses.
- Use TypeBox schemas from `@bigbatch/shared` for request validation instead of ad hoc validation inside handlers.
- Keep business rules, data access, and invariants in service files rather than route handlers.
- Use `AppError` subclasses from `src/modules/core/errors.ts` for expected failures so the shared error handler produces consistent error envelopes.
- For household-scoped features, rely on `request.householdId` and `request.userRole` populated by `src/modules/core/household-resolver.ts`. Do not re-parse the `X-Household-Id` header inside each route.
- Preserve explicit `.js` suffixes on relative imports throughout `apps/api`.
- Register new domain plugins from `apps/api/src/index.ts` once the module is wired and validated.

## Skills To Load On Demand

- Load `fastify-best-practices` when the task needs deeper Fastify guidance around plugins, hooks, lifecycle behavior, schema validation, security middleware, performance, or production-oriented framework decisions beyond the repo-specific conventions above.
