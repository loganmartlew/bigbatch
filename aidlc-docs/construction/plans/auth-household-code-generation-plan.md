# Unit 1: Auth & Household — Code Generation Plan

## Unit Context

**Unit**: Auth & Household (Unit 1)
**Scope**: User registration, login, sessions, password reset, household CRUD, invites, member management
**Stories**: US-01, US-02, US-03, US-04, US-05, US-06, US-27, US-28
**Dependencies**: Unit 0 (Foundation) — DB schema, core middleware, error classes, Lucia setup

---

## Generation Steps

### Step 1: New Dependencies & Environment Updates

- [x] Add `zxcvbn`, `@fastify/cookie`, `resend` to `apps/api/package.json` dependencies
- [x] Add `@types/zxcvbn` to `apps/api/package.json` devDependencies
- [x] Add `RESEND_API_KEY` and `FRONTEND_URL` to `apps/api/src/lib/env.ts`

### Step 2: Database Schema — Password Reset Tokens Table

- [x] Add `passwordResetTokens` table to `apps/api/src/db/schema.ts` (id, userId, token, expiresAt, usedAt, createdAt)
- [x] Add relations for `passwordResetTokens`

### Step 3: Core Middleware Updates

- [x] Update `apps/api/src/modules/core/auth-guard.ts` — add `POST /auth/forgot-password` and `POST /auth/reset-password` to PUBLIC_ROUTES
- [x] Update `apps/api/src/modules/core/household-resolver.ts` — add all auth/household routes to AUTH_ONLY_ROUTES set
- [x] Register `@fastify/cookie` in `apps/api/src/index.ts`

### Step 4: Shared Package — Auth Schemas

- [x] Create `packages/shared/src/schemas/auth.ts` — TypeBox schemas: RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema
- [x] Create `packages/shared/src/schemas/household.ts` — TypeBox schemas: CreateHouseholdSchema, JoinByLinkSchema, JoinByCodeSchema
- [x] Update `packages/shared/src/schemas/index.ts` — re-export auth and household schemas

### Step 5: Auth Service Layer

- [x] Create `apps/api/src/modules/auth/auth.service.ts` — registerUser, loginUser, logoutUser, getCurrentUser, requestPasswordReset, executePasswordReset
- [x] Create `apps/api/src/lib/email.ts` — Resend email client wrapper (sends in all envs, logs URL in dev)

### Step 6: Household Service Layer

- [x] Create `apps/api/src/modules/auth/household.service.ts` — createHousehold, listUserHouseholds, generateInvite, joinByLink, joinByCode, listMembers, removeMember

### Step 7: Auth & Household Route Handlers

- [x] Create `apps/api/src/modules/auth/auth.routes.ts` — POST /register, POST /login, POST /logout, GET /me, POST /forgot-password, POST /reset-password
- [x] Create `apps/api/src/modules/auth/household.routes.ts` — GET /households, POST /households, POST /households/join/link, POST /households/join/code, POST /households/:id/invites, GET /households/:id/members, DELETE /households/:id/members/:userId

### Step 8: Auth Plugin Registration

- [x] Create `apps/api/src/modules/auth/index.ts` — Fastify plugin registering auth + household routes
- [x] Update `apps/api/src/index.ts` — register auth plugin (already done in Step 3)

### Step 9: API Unit Tests

- [x] Create `apps/api/src/modules/auth/__tests__/auth.service.test.ts` — registration validation, login flows, password reset logic
- [x] Create `apps/api/src/modules/auth/__tests__/household.service.test.ts` — household creation, invite generation, join flows, member management

### Step 10: Web — Auth Pages

- [x] Create `apps/web/src/routes/login.tsx` — LoginPage with email/password form
- [x] Create `apps/web/src/routes/register.tsx` — RegisterPage with firstName, lastName, email, password
- [x] Create `apps/web/src/routes/forgot-password.tsx` — ForgotPasswordPage
- [x] Create `apps/web/src/routes/reset-password.tsx` — ResetPasswordPage (token from URL search params)
- [x] Create `apps/web/src/routes/join.tsx` — JoinByLinkPage (auto-join using token from URL)

### Step 11: Web — Onboarding & Household Pages

- [x] Create `apps/web/src/routes/onboarding.tsx` — OnboardingPage ("Create" or "Join" household)
- [x] Create `apps/web/src/routes/settings/household.tsx` — HouseholdSettingsPage (members, invites, removal)
- [x] Create `apps/web/src/lib/auth-context.tsx` — auth state (current user, login/logout, isAuthenticated)
- [x] Create `apps/web/src/components/household-selector.tsx` — dropdown in header for switching households
- [x] Update `apps/web/src/routes/__root.tsx` — integrate auth context, household selector, route guards

### Step 12: Mobile — Auth & Household Screens

- [x] Create `apps/mobile/app/login.tsx` — LoginScreen
- [x] Create `apps/mobile/app/register.tsx` — RegisterScreen
- [x] Create `apps/mobile/app/forgot-password.tsx` — ForgotPasswordScreen
- [x] Create `apps/mobile/app/onboarding.tsx` — OnboardingScreen
- [x] Create `apps/mobile/app/join-code.tsx` — JoinByCodeScreen
- [x] Create `apps/mobile/app/household-settings.tsx` — HouseholdSettingsScreen
- [x] Create `apps/mobile/src/lib/auth-context.tsx` — auth state management

### Step 13: Documentation Summary

- [x] Create `aidlc-docs/construction/auth-household/code/code-generation-summary.md`

---

## Story Coverage

| Step        | Stories Covered                                                                         |
| ----------- | --------------------------------------------------------------------------------------- |
| Steps 1–3   | Infrastructure for US-01–06, US-27–28                                                   |
| Step 4      | Schema validation for US-01–06                                                          |
| Step 5      | US-01 (register), US-02 (login), password reset                                         |
| Step 6      | US-03 (create household), US-04/05 (join), US-06 (invite), US-27 (view), US-28 (remove) |
| Step 7      | HTTP layer for all stories                                                              |
| Step 8      | Plugin wiring                                                                           |
| Step 9      | Test coverage for all stories                                                           |
| Steps 10–11 | Web UI for all stories                                                                  |
| Step 12     | Mobile UI for all stories                                                               |

## File Count Estimate

| Area                | Files | Notes                                                                                                     |
| ------------------- | ----- | --------------------------------------------------------------------------------------------------------- |
| Modified (existing) | 6     | package.json, env.ts, schema.ts, auth-guard.ts, household-resolver.ts, index.ts                           |
| API new             | 7     | auth service, household service, auth routes, household routes, plugin, email util, schemas barrel update |
| Shared new          | 2     | auth schemas, household schemas                                                                           |
| Tests               | 2     | auth service tests, household service tests                                                               |
| Web new             | 9     | 5 auth pages, onboarding, household settings, auth context, household selector                            |
| Web modified        | 1     | \_\_root.tsx                                                                                              |
| Mobile new          | 7     | 4 auth screens, onboarding, join-code, household settings, auth context                                   |
| Docs                | 1     | code-generation-summary.md                                                                                |
| **Total**           | ~35   | 7 modified + ~28 new                                                                                      |
