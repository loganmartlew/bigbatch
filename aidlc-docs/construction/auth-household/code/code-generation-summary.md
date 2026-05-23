# Unit 1: Auth & Household — Code Generation Summary

## Overview

Unit 1 implements user authentication (registration, login, logout, password reset) and household management (create, join by link/code, invite generation, member listing/removal).

## Files Created

### API (`apps/api/`)

| File                                                   | Purpose                                                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/email.ts`                                     | Resend wrapper for password reset emails (all envs, logs URL in dev)                                                                   |
| `src/modules/auth/auth.service.ts`                     | Auth business logic: register, login, logout, getCurrentUser, requestPasswordReset, executePasswordReset                               |
| `src/modules/auth/household.service.ts`                | Household business logic: create (seeds 7 default categories), list, generateInvite, joinByLink, joinByCode, listMembers, removeMember |
| `src/modules/auth/auth.routes.ts`                      | Fastify route handlers for `/auth/*` endpoints                                                                                         |
| `src/modules/auth/household.routes.ts`                 | Fastify route handlers for `/households/*` endpoints                                                                                   |
| `src/modules/auth/index.ts`                            | Fastify plugin registering both route sets                                                                                             |
| `src/modules/auth/__tests__/auth.service.test.ts`      | 10 tests: example-based (registration, login, password reset) + PBT (email normalization, password strength)                           |
| `src/modules/auth/__tests__/household.service.test.ts` | 12 tests: example-based (create, invite, join, remove) + PBT (invite code invariants, name validation)                                 |

### Shared (`packages/shared/`)

| File                       | Purpose                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `src/schemas/auth.ts`      | TypeBox schemas: RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema |
| `src/schemas/household.ts` | TypeBox schemas: CreateHouseholdSchema, JoinByLinkSchema, JoinByCodeSchema              |

### Web (`apps/web/`)

| File                                    | Purpose                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `src/lib/auth-context.tsx`              | React context: user state, login/register/logout, household list |
| `src/components/household-selector.tsx` | Dropdown for switching active household                          |
| `src/routes/login.tsx`                  | Login page                                                       |
| `src/routes/register.tsx`               | Registration page                                                |
| `src/routes/forgot-password.tsx`        | Forgot password page                                             |
| `src/routes/reset-password.tsx`         | Reset password page (token from URL)                             |
| `src/routes/join.tsx`                   | Join household by link (auto-join from URL token)                |
| `src/routes/onboarding.tsx`             | Onboarding: create or join household                             |
| `src/routes/settings/household.tsx`     | Household settings: members, invite generation                   |

### Mobile (`apps/mobile/`)

| File                         | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `src/lib/auth-context.tsx`   | React Native auth context (mirrors web) |
| `app/login.tsx`              | Login screen                            |
| `app/register.tsx`           | Register screen                         |
| `app/forgot-password.tsx`    | Forgot password screen                  |
| `app/onboarding.tsx`         | Onboarding: create or join household    |
| `app/join-code.tsx`          | Join by invite code screen              |
| `app/household-settings.tsx` | Household settings screen               |

## Files Modified

| File                                              | Changes                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/api/package.json`                           | Added @fastify/cookie, resend, zxcvbn, @types/zxcvbn, fast-check |
| `apps/api/src/lib/env.ts`                         | Added RESEND_API_KEY, FRONTEND_URL                               |
| `apps/api/src/db/schema.ts`                       | Added passwordResetTokens table + relations                      |
| `apps/api/src/modules/core/auth-guard.ts`         | Expanded PUBLIC_ROUTES                                           |
| `apps/api/src/modules/core/household-resolver.ts` | Expanded AUTH_ONLY_ROUTES                                        |
| `apps/api/src/index.ts`                           | Registered @fastify/cookie and authPlugin                        |
| `apps/web/src/routes/__root.tsx`                  | Integrated AuthProvider, HouseholdSelector, route guards         |
| `apps/mobile/app/_layout.tsx`                     | Wrapped with AuthProvider                                        |
| `packages/shared/src/schemas/index.ts`            | Re-exports auth + household schemas                              |
| `packages/shared/src/index.ts`                    | Exports schemas barrel                                           |
| `packages/shared/package.json`                    | Added @sinclair/typebox                                          |

## API Endpoints

| Method | Path                              | Auth          | Description                   |
| ------ | --------------------------------- | ------------- | ----------------------------- |
| POST   | `/auth/register`                  | Public        | Create account                |
| POST   | `/auth/login`                     | Public        | Log in                        |
| POST   | `/auth/logout`                    | Auth          | Log out                       |
| GET    | `/auth/me`                        | Auth          | Get current user + households |
| POST   | `/auth/forgot-password`           | Public        | Request password reset        |
| POST   | `/auth/reset-password`            | Public        | Execute password reset        |
| GET    | `/households`                     | Auth          | List user's households        |
| POST   | `/households`                     | Auth          | Create household              |
| POST   | `/households/join/link`           | Auth          | Join by invite link           |
| POST   | `/households/join/code`           | Auth          | Join by invite code           |
| POST   | `/households/:id/invites`         | Auth (owner)  | Generate invite               |
| GET    | `/households/:id/members`         | Auth (member) | List members                  |
| DELETE | `/households/:id/members/:userId` | Auth (owner)  | Remove member                 |

## Test Results

22 tests passing (10 auth + 12 household), including property-based tests with fast-check.

## Security Compliance

- Passwords hashed with argon2id
- Session cookies: HttpOnly, Secure (prod), SameSite=Lax
- No user enumeration on login failure or password reset
- Owner-only enforcement on invite generation and member removal
- Invite codes use unambiguous alphabet (no 0/O/I/L/1)
