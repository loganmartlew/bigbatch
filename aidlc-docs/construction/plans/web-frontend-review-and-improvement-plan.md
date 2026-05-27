# Web Frontend Review and Improvement Plan

## Scope reviewed

- `apps/web/src/main.tsx`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/auth-context.tsx`
- `apps/web/src/lib/household-context.ts`
- `apps/web/src/routes/**/*`
- `apps/web/src/components/household-selector.tsx`
- `.github/copilot-instructions.md`
- `.github/instructions/mantine.instructions.md`

## Baseline validation snapshot

The current web frontend has a few pre-existing validation gaps that showed up before any documentation changes:

- `corepack pnpm --filter @bigbatch/web lint` fails because `eslint` is referenced by `apps/web/package.json` but is not installed in the workspace.
- `corepack pnpm --filter @bigbatch/web test` fails because the package has no web tests yet and `vitest run` exits non-zero with no test files.
- `corepack pnpm --filter @bigbatch/web build` fails with existing TypeScript issues, including unused symbols in route files and a missing prior build of `@bigbatch/shared`.

These are worth fixing as part of the frontend hardening work, but they are not introduced by this change.

## Key findings

### 1. Authentication is implemented but not actually wired through the app shell

**Current state**

- `src/lib/auth-context.tsx` contains the main auth state and session refresh logic.
- `src/main.tsx` mounts `MantineProvider`, `QueryClientProvider`, and `RouterProvider`, but not `AuthProvider`.
- Route files such as `login.tsx`, `register.tsx`, `join.tsx`, and `onboarding.tsx` already call `useAuth()`.

**Why this matters**

- Auth routes depend on context that is not mounted at the entrypoint.
- Protected-route behavior is effectively scaffolding rather than a finished auth integration.

**High-level plan**

1. Mount the auth provider at the root and make the root layout responsible for auth-aware shell behavior.
2. Add explicit auth/no-household guards for routes that require them.
3. Follow up with tests around login, logout, and redirect behavior.

### 2. Household selection should be React state, not an imperative storage helper

**Current state**

- `src/lib/household-context.ts` is not a React context; it is a `localStorage` helper.
- `src/components/household-selector.tsx` writes to storage and forces `window.location.reload()`.

**Why this matters**

- Household changes bypass React state and make query invalidation/composition harder.
- Full reloads hurt UX and hide data-flow problems that should be solved in state management.

**High-level plan**

1. Move active household ownership into a provider (`auth-context` or a dedicated provider).
2. Expose a `switchHousehold` action instead of direct storage calls.
3. Make network queries depend on that state so switching a household rerenders instead of reloading.

### 3. TanStack Query is installed but not used for actual server state

**Current state**

- `src/main.tsx` creates a `QueryClient`.
- The app does not currently use `useQuery` or `useMutation`.
- Routes manually manage `loading`, `error`, and request side effects with `useState`, `useEffect`, and direct `api.*` calls.

**Why this matters**

- Loading/error/cache logic is duplicated across routes.
- The app is not benefiting from cache invalidation, retry behavior, or shared query keys.

**High-level plan**

1. Introduce typed query/mutation hooks for auth-adjacent and household flows first.
2. Use query keys that include the active household where relevant.
3. Invalidate or refetch queries after mutations instead of reloading or hand-editing duplicated local state.

### 4. Forms need a consistent validation story

**Current state**

- Auth, onboarding, and reset flows use bare HTML controls and route-local `useState`.
- Validation is mostly browser-native (`required`, `minLength`, `maxLength`) plus generic error messages.
- `react-hook-form`, `zod`, and `@hookform/resolvers` are not currently installed in `apps/web`.

**Why this matters**

- Validation rules are fragmented and hard to share.
- Error handling is coarse, and there is no consistent way to map API and client validation into the UI.

**High-level plan**

1. Add `react-hook-form`, `zod`, and `@hookform/resolvers`.
2. Create shared web form schemas aligned with the API contracts in `packages/shared`.
3. Migrate auth/onboarding flows first, then reuse the same patterns for future recipes/ingredients/shopping-list forms.

### 5. Route files are doing too much and the web structure is not yet feature-oriented

**Current state**

- Most logic lives directly inside route components.
- `apps/web/src/components` currently contains only `household-selector.tsx`.
- There is no feature-level separation for auth or household UI/hooks.

**Why this matters**

- Reuse is limited and new features will likely repeat the same route-local patterns.
- The current structure makes it harder to test form logic, data hooks, and shared presentation separately.

**High-level plan**

1. Keep routes thin and extract form/panel/list components as flows are touched.
2. Introduce `src/features/auth` and `src/features/household` incrementally instead of moving every file at once.
3. Centralize shared UI primitives and domain hooks to improve composability.

### 6. Mantine is present, but most auth/household UI still uses raw HTML controls

**Current state**

- The home page and root shell use Mantine.
- Auth and household routes mostly render `<form>`, `<input>`, `<button>`, and inline styles.

**Why this matters**

- UX and accessibility patterns diverge across the app.
- The codebase loses the benefit of a single UI system even though Mantine is already installed.

**High-level plan**

1. Move new and touched forms onto Mantine inputs, buttons, alerts, and layout primitives.
2. Create small reusable shells for repeated auth-form layout.
3. Keep styling theme-driven rather than inline or ad hoc.

### 7. Error handling and route resilience need a clearer pattern

**Current state**

- Most routes catch `any` and render a string in a paragraph.
- There is no route-level error boundary or standardized mapping from `ApiClientError` to user-facing messaging.

**Why this matters**

- Error UX is inconsistent.
- The app has no common fallback for unexpected runtime failures in route trees.

**High-level plan**

1. Standardize error presentation with Mantine alerts and typed error handling.
2. Add an app-level or route-level error boundary.
3. Keep field validation, request failures, and unexpected exceptions visually distinct.

### 8. Web testing is missing entirely

**Current state**

- There are no web Vitest files today.
- The package test command fails because no tests exist yet.

**Why this matters**

- Refactoring providers, forms, and query hooks will be risky without basic coverage.
- The frontend review recommendations are harder to enforce without tests for the expected behaviors.

**High-level plan**

1. Add provider/hook tests first (`useAuth`, active household switching, query hooks).
2. Add focused route tests for login/register/onboarding flows.
3. Prefer behavior-oriented tests over snapshots.

### 9. Documentation and generated planning docs have drifted from the source tree

**Current state**

- `aidlc-docs/construction/plans/auth-household-code-generation-plan.md` marks `src/routes/__root.tsx` as already updated for auth integration.
- The actual source tree does not yet mount the auth provider.

**Why this matters**

- Future contributors can make incorrect assumptions from planning artifacts alone.
- The frontend needs clearer “current state vs. target state” guidance.

**High-level plan**

1. Keep Copilot instructions explicit about current source-code reality.
2. Use this document as the working review/plan for the frontend cleanup.
3. Update related docs when the provider/query/form work actually lands.

## Recommended implementation order

### Phase 1 — foundation fixes

1. Wire the auth provider into the app shell.
2. Replace imperative household switching with provider-managed React state.
3. Remove `window.location.reload()` from the household selector.

### Phase 2 — data and routing

1. Introduce TanStack Query hooks for household and auth-adjacent flows.
2. Add protected-route and onboarding guards.
3. Standardize error/loading states.

### Phase 3 — forms and structure

1. Add React Hook Form + Zod.
2. Migrate auth/onboarding flows to Mantine + structured validation.
3. Extract reusable auth/household feature components and hooks.

### Phase 4 — confidence and DX

1. Add web tests for providers, hooks, and critical routes.
2. Fix the existing lint/test/build baseline for `apps/web`.
3. Optionally add React Query Devtools for local development.

## Decisions to confirm with the user

These are the main points that are worth discussing rather than silently locking in:

1. **Validation source of truth:** should the web app own Zod schemas directly, or should shared API schemas from `packages/shared` be adapted so validation rules stay aligned in one place?
2. **Provider ownership:** should active household state live inside `auth-context.tsx`, or should auth and household selection be separate providers to keep responsibilities narrow?
3. **Structure timing:** should the app move to feature folders now (`features/auth`, `features/household`), or should that be done incrementally as each route is refactored?
4. **Protected-route strategy:** is a component-level redirect acceptable for now, or do we want a stronger router-level pattern once auth state is bootstrapped at the root?

## Copilot guidance added in this change

This review is paired with a new scoped instruction file at `.github/instructions/web-frontend.instructions.md` plus updates to `.github/copilot-instructions.md` so future changes nudge the web app toward:

- provider-managed auth and household state
- TanStack Query for server state
- React Hook Form + Zod for forms
- thinner routes and more reusable components
- Mantine-based, accessible UI patterns
