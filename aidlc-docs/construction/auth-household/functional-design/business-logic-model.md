# Unit 1: Auth & Household — Business Logic Model

## Auth Module Architecture

The auth module is a Fastify plugin (`apps/api/src/modules/auth/`) with this structure:

```
modules/auth/
  index.ts          — Plugin registration, route definitions
  auth.service.ts   — Business logic orchestration
  auth.routes.ts    — Route handlers (HTTP concerns only)
  auth.schemas.ts   — TypeBox request/response schemas
```

---

## Service Function Specifications

### registerUser(email, password, firstName, lastName)

**Flow**:

1. Normalize email: `email.trim().toLowerCase()`
2. Trim firstName and lastName
3. Validate email format (RFC 5322 simplified regex)
4. Validate name lengths (1–50 chars each)
5. Evaluate password strength with zxcvbn → reject if score < 2, return feedback
6. Check email uniqueness in DB → return `ConflictError` if exists
7. Hash password with argon2id
8. Insert user row in transaction
9. Create Lucia session (30-day expiry)
10. Return `{ user (public shape), session }`

**Error paths**:

- Invalid email format → `ValidationError`
- Name too short/long → `ValidationError`
- Weak password (zxcvbn < 2) → `ValidationError` with zxcvbn feedback message
- Duplicate email → `ConflictError`

### loginUser(email, password)

**Flow**:

1. Normalize email: `email.trim().toLowerCase()`
2. Find user by email
3. If not found → return `AuthenticationError` (generic message)
4. Verify password against stored hash (argon2.verify)
5. If mismatch → return `AuthenticationError` (generic message)
6. Create Lucia session (30-day expiry)
7. Load user's household memberships
8. Return `{ user, households, session }`

**Error paths**:

- Email not found → `AuthenticationError` ("Invalid email or password")
- Wrong password → `AuthenticationError` ("Invalid email or password")
- Same error for both to prevent user enumeration

### logoutUser(sessionId)

**Flow**:

1. Invalidate Lucia session (delete from DB)
2. Return void

### getCurrentUser(userId)

**Flow**:

1. Load user by ID (from `request.user` set by auth-guard)
2. Load all household memberships via `user_households` join with `households`
3. Return `{ user (public shape), households: [{ id, name, role }] }`

### requestPasswordReset(email)

**Flow**:

1. Normalize email
2. Find user by email
3. If not found → return silently (no error — prevents enumeration)
4. Generate 32-byte random token (URL-safe base64)
5. Insert `password_reset_tokens` row with 1-hour expiry
6. Send email (or log to console in dev) with reset link
7. Return void (always success)

### executePasswordReset(token, newPassword)

**Flow**:

1. Find token in DB where `usedAt IS NULL` and `expiresAt > now()`
2. If not found → `NotFoundError` ("Reset link is invalid or expired")
3. Validate new password with zxcvbn (score >= 2)
4. Hash new password with argon2id
5. In transaction:
   a. Update user's `hashedPassword` and `updatedAt`
   b. Mark token as used (`usedAt = now()`)
   c. Delete all sessions for this user
6. Return void

---

## Household Service Function Specifications

### createHousehold(userId, name)

**Flow**:

1. Trim and validate name (1–100 chars)
2. In transaction:
   a. Insert `households` row (`ownerId = userId`)
   b. Insert `user_households` row (`role = "owner"`)
   c. Seed default shopping categories (7 rows)
3. Return created household

### listUserHouseholds(userId)

**Flow**:

1. Query `user_households` joined with `households` where `userId = ?`
2. Return `[{ id, name, role }]`

### generateInvite(householdId, userId)

**Flow**:

1. Verify user is the owner of this household → `ForbiddenError` if not
2. Generate link token: 32 bytes random → URL-safe base64
3. Generate invite code: 6 chars from alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`
4. Ensure uniqueness (retry on collision — astronomically unlikely)
5. Insert `household_invites` row with `expiresAt = now() + 24h`
6. Return `{ link: "{FRONTEND_URL}/join?token={token}", code, expiresAt }`

### joinByLink(userId, token)

**Flow**:

1. Find invite by token
2. Validate not expired (`expiresAt > now()`)
3. If not found or expired → `NotFoundError` ("Invite not found or expired")
4. Check if user is already a member → `ConflictError` if yes
5. Insert `user_households` row (`role = "member"`)
6. Return the household

### joinByCode(userId, code)

**Flow**:

1. Normalize code to uppercase
2. Same logic as joinByLink but lookup by code

### listMembers(householdId)

**Flow**:

1. Query `user_households` joined with `users` where `householdId = ?`
2. Order by `joinedAt ASC`
3. Return `[{ userId, firstName, lastName, email, role, joinedAt }]`

### removeMember(householdId, ownerId, targetUserId)

**Flow**:

1. Verify caller (`ownerId`) is the owner of this household → `ForbiddenError` if not
2. Verify `targetUserId !== ownerId` → `ForbiddenError` ("Cannot remove yourself")
3. Find membership row → `NotFoundError` if not found
4. Delete `user_households` row
5. Return void

---

## Frontend Component Structure

### Web (`apps/web`)

**Auth Pages** (unauthenticated routes):

- `/login` — LoginPage: email + password form, link to register, link to forgot password
- `/register` — RegisterPage: email, password, firstName, lastName form with zxcvbn strength meter
- `/forgot-password` — ForgotPasswordPage: email input, submit
- `/reset-password` — ResetPasswordPage: new password input (token from URL query)
- `/join` — JoinByLinkPage: auto-joins on load using token from URL query (redirects to login if unauthenticated)

**Onboarding** (authenticated, no household):

- `/onboarding` — OnboardingPage: "Create a household" or "Join a household" (code input)

**Household Pages** (authenticated, with household):

- Header component includes household dropdown selector (visible when user has 1+ households)
- `/settings/household` — HouseholdSettingsPage: view members, generate invite, remove members (owner only)

### Mobile (`apps/mobile`)

**Auth Screens** (unauthenticated stack):

- `LoginScreen` — same as web
- `RegisterScreen` — same as web
- `ForgotPasswordScreen` — same as web

**Onboarding Screens** (authenticated, no household):

- `OnboardingScreen` — "Create" or "Join" options
- `JoinByCodeScreen` — 6-char code input

**Main Screens** (authenticated, with household):

- Header/nav includes household selector dropdown
- `HouseholdSettingsScreen` — members, invites, removal

---

## Middleware Integration

### Auth-Guard Updates

The existing auth-guard needs these routes added to the public routes set:

- `POST /auth/register` (already public)
- `POST /auth/login` (already public)
- `POST /auth/forgot-password` (new — public)
- `POST /auth/reset-password` (new — public)

### Household-Resolver Updates

These routes need to be added to the AUTH_ONLY set (they need auth but not a household context):

- `POST /auth/logout`
- `GET /auth/me`
- `GET /households`
- `POST /households`
- `POST /households/join/link`
- `POST /households/join/code`
- `POST /households/:id/invites` (uses `:id` param, not header)
- `GET /households/:id/members` (uses `:id` param, not header)
- `DELETE /households/:id/members/:userId` (uses `:id` param, not header)

These household routes use the `:id` URL parameter instead of the `X-Household-Id` header. The household-resolver should skip them, and the route handlers validate household membership directly.

---

## New Dependencies

| Package           | Purpose                               | Where            |
| ----------------- | ------------------------------------- | ---------------- |
| `zxcvbn`          | Password strength estimation          | `apps/api`       |
| `@types/zxcvbn`   | TypeScript types                      | `apps/api` (dev) |
| `@fastify/cookie` | Cookie parsing for session management | `apps/api`       |
| `resend`          | Transactional email (password reset)  | `apps/api`       |

**Note**: The auth-guard already reads `request.cookies?.["session"]` — this requires `@fastify/cookie` to be registered. Must be added to `apps/api` dependencies and registered in the server entry point.
