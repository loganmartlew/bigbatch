---
applyTo: 'apps/web/src/**/*.{ts,tsx},apps/web/package.json'
---

# Web Frontend Instructions (BigBatch)

Use these rules whenever you change the React web app.

## Current stack and source of truth

- The web app is a Vite + React SPA under `apps/web`.
- Routing is TanStack Router file-based routing under `src/routes`.
- UI should use Mantine primitives and theme tokens instead of raw HTML controls for new work.
- API calls should go through `src/lib/api-client.ts` so cookies and `X-Household-Id` stay consistent.

## Preferred architecture for new or touched code

- Treat route files as thin orchestration layers. Move reusable UI into `src/components` or `src/features/<domain>/components`.
- Keep domain-specific hooks close to the feature they serve (`src/features/<domain>/hooks`), or in `src/lib/query-hooks.ts` while the app is still small.
- Prefer provider-managed auth and household state over imperative `localStorage` helpers scattered through routes.
- Do not add more `window.location.reload()`-based flows. Household switching should update React state and let queries rerun.

## Forms and validation

- For new forms, use React Hook Form with Zod validation.
- When an API contract already exists in `packages/shared`, keep the web validation aligned with that contract instead of duplicating unrelated rules.
- Surface field-level validation inline and keep submit buttons disabled while invalid or submitting.
- If you touch an existing route-local form, prefer extracting a reusable form component instead of adding more local `useState` fields.

## Data fetching and mutations

- Use TanStack Query for server state (`useQuery`, `useMutation`) instead of hand-rolled loading and error state in route components.
- Keep query keys structured and household-aware, for example `['household', householdId, 'members']`.
- Invalidate related queries after mutations instead of forcing a page refresh.
- Reserve plain `api.*` calls for shared query functions, provider bootstrapping, or narrowly scoped utilities.

## Authentication and household flows

- Auth-aware routes should rely on the shared auth provider/hook instead of duplicating session fetch logic.
- Household selection should come from shared React state and remain the single client-side source of truth for `X-Household-Id`.
- When adding protected routes, handle unauthenticated and no-household states intentionally instead of assuming scaffolding is already wired.

## Error handling, accessibility, and testing

- Prefer Mantine `Alert`, input error props, and consistent empty/loading states over raw paragraphs for user-facing errors.
- Use semantic labels and accessible button text/`aria-label` values.
- Add or update Vitest coverage when introducing new hooks, provider logic, or non-trivial route behavior.
- Avoid snapshot-heavy UI tests; prefer behavior-focused tests around auth, forms, and query hooks.
