# BigBatch Project Guidelines

## Start with current reality

- Use the code in `apps/api`, `apps/web`, and `packages/shared` as the source of truth for implemented behavior.
- Use `aidlc-docs` for product intent, planned units, and AI-DLC context. Some generated AI-DLC files lag the current code, so confirm target modules and wiring in source before changing them.
- For AI-DLC workflow or artifact-generation tasks, read [`aidlc.instructions.md`](./aidlc.instructions.md) as a companion document.

## Workspace shape

- Active workspace packages are `apps/api`, `apps/web`, and `packages/shared`.
- Use `pnpm` for workspace commands and prefer filtered commands when you only need one package.

## Current product scope

- Foundation and auth/household code are implemented today.
- Ingredients, recipes, shopping list, and cook events are documented in `aidlc-docs` and modeled in `apps/api/src/db/schema.ts` and `packages/shared/src/types/index.ts`, but their API modules and web flows are not built yet.
- When docs and code disagree on current behavior, preserve source-code behavior and use the docs to guide future-facing decisions.

## API conventions (`apps/api`)

- Keep the API as ESM TypeScript and use explicit `.js` suffixes for relative imports.
- Follow the existing module layout: `src/modules/<domain>/index.ts`, `<domain>.routes.ts`, and `<domain>.service.ts`.
- Register new Fastify domain plugins from `apps/api/src/index.ts`.
- Define request validation with TypeBox schemas from `@bigbatch/shared`, and keep route handlers thin by delegating business logic to service functions.
- Return success bodies as `{ data: ... }` and surface failures through `AppError` subclasses from `src/modules/core/errors.ts` so the shared error handler formats `{ error: { code, message } }`.
- Household-scoped endpoints must rely on the `X-Household-Id` header and membership validation via `src/modules/core/household-resolver.ts`, not ad hoc per-route header parsing.
- Preserve existing household invariants: household creation seeds default shopping categories, invite codes use the unambiguous alphabet in `household.service.ts`, and owners cannot remove themselves.

## Shared contracts (`packages/shared`)

- Keep reusable domain types and API envelopes in `packages/shared/src/types`.
- Keep API schemas in `packages/shared/src/schemas` using TypeBox, and derive TS types with `Static<typeof Schema>`.
- Update shared contracts before wiring new API routes or web calls.

## Web conventions (`apps/web`)

- Use TanStack Router file-based routes under `src/routes`, Mantine components for UI, and TanStack Query for server state.
- Use `src/lib/api-client.ts` for API requests so cookies and `X-Household-Id` handling stay consistent.
- Treat `src/lib/auth-context.tsx` as the long-term home for auth and active-household client state; prefer provider-managed state over route-local `localStorage` helpers when touching that flow.
- New or touched forms should move toward React Hook Form + Zod validation instead of route-local `useState` + manual validation.
- New or touched server-state flows should move toward TanStack Query hooks instead of calling `api.*` directly inside route components.
- Follow the scoped guidance in `.github/instructions/mantine.instructions.md` and `.github/instructions/web-frontend.instructions.md` when editing the web app.
- Keep web-only state, routing, and UI in `apps/web`; do not push browser-specific logic into `packages/shared`.

## Data and testing

- Drizzle schema lives in `apps/api/src/db/schema.ts`; follow existing table and relation patterns and keep household ownership explicit.
- Recipes, ingredients, and cook events are soft-deleted via `deletedAt`; sessions and join tables are not.
- Use Vitest for tests. For pure business rules and invariants, follow the existing `fast-check` property-based testing pattern in `apps/api/src/modules/auth/__tests__`.

## Useful docs

- Workflow companion: [`aidlc.instructions.md`](./aidlc.instructions.md)
- Product and application direction: [`../aidlc-docs/inception/application-design/application-design.md`](../aidlc-docs/inception/application-design/application-design.md)
- Requirements and stack decisions: [`../aidlc-docs/inception/requirements/requirements.md`](../aidlc-docs/inception/requirements/requirements.md), [`../aidlc-docs/inception/requirements/tech-stack-decisions.md`](../aidlc-docs/inception/requirements/tech-stack-decisions.md)
- AI-DLC state and generated summaries: [`../aidlc-docs/aidlc-state.md`](../aidlc-docs/aidlc-state.md), [`../aidlc-docs/construction/auth-household/code/code-generation-summary.md`](../aidlc-docs/construction/auth-household/code/code-generation-summary.md)

## Common commands

- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm web:dev`
- `pnpm api:dev`
- `pnpm db:generate`
- `pnpm db:migrate`
