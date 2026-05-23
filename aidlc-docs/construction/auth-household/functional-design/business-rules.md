# Unit 1: Auth & Household — Business Rules

## Registration Rules (US-01)

### Email Validation

- Must be a valid email format (RFC 5322 simplified)
- Converted to lowercase and trimmed before storage
- Must be unique — if email exists, return `CONFLICT` error with generic message ("An account with this email already exists")
- Maximum length: 254 characters

### Name Validation

- `firstName` and `lastName` are both required
- Trimmed of leading/trailing whitespace
- Length: 1–50 characters each
- No format restrictions (supports international names, hyphens, apostrophes, etc.)

### Password Policy

- Minimum 8 characters, no maximum (argon2 handles arbitrary length)
- Validated using **zxcvbn** strength estimation
- Reject passwords with score < 2 ("fair") — scores: 0=too guessable, 1=very guessable, 2=somewhat guessable, 3=safely unguessable, 4=very unguessable
- Return the zxcvbn feedback message to the user when rejected (e.g., "Add another word or two", "Avoid common passwords")
- No explicit complexity rules (uppercase, special chars, etc.) — zxcvbn covers this holistically

### Password Hashing

- Hash with **argon2id** using recommended parameters
- Never store plaintext; never log plaintext
- Never return hash in any API response

### Rate Limiting

- Registration endpoint: 5 requests per IP per minute (SECURITY-11)

---

## Login Rules (US-02)

### Credential Verification

- Look up user by email (case-insensitive)
- Verify password against stored argon2id hash
- On failure: return generic error "Invalid email or password" — no distinction between "email not found" and "wrong password" (SECURITY-09)

### Brute-Force Protection

- Login endpoint: 10 attempts per IP per minute
- After 5 consecutive failures for the same email, introduce a progressive delay (1s, 2s, 4s, 8s...) up to 30s
- Track failures in memory (reset on successful login)

### Session Creation

- On successful login, create a Lucia session (30-day expiry, no sliding window)
- Set session cookie: `session={id}; HttpOnly; Secure (in prod); SameSite=Lax; Path=/; Max-Age=2592000`
- Return user data + list of household memberships

### Response Shape

```typescript
{
  data: {
    user: { id, email, firstName, lastName, createdAt },
    households: [{ id, name, role }]
  }
}
```

---

## Session Management Rules

### Cookie Configuration

| Attribute | Value                                    |
| --------- | ---------------------------------------- |
| Name      | `session`                                |
| HttpOnly  | true                                     |
| Secure    | true in production, false in development |
| SameSite  | Lax                                      |
| Path      | `/`                                      |
| Max-Age   | 2592000 (30 days)                        |

### Session Lifecycle

- Created on login/register
- Validated on every request by auth-guard middleware
- Invalidated on logout (delete from DB)
- No auto-extend — expires exactly 30 days after creation
- Multiple concurrent sessions allowed (different devices)

### Logout

- Delete session row from database
- Clear session cookie (set Max-Age=0)
- Return 204 No Content

---

## Household Creation Rules (US-03)

### Post-Registration Onboarding

- After registration, user is authenticated but has **no household**
- Frontend shows onboarding screen with two options: "Create a household" or "Join a household"
- The `GET /auth/me` endpoint returns `households: []` — frontend uses this to detect onboarding state

### Create Household

- User provides a household name (1–100 chars, trimmed)
- Insert `households` row with `ownerId = currentUser.id`
- Insert `user_households` row with `role = "owner"`
- Seed default shopping categories for this household: **Produce, Dairy, Meat, Pantry, Frozen, Bakery, Other** (7 rows in `shopping_categories` with `isDefault = true`)
- Return the created household

### Default Category Seeding

| Name    | sortOrder | isDefault |
| ------- | --------- | --------- |
| Produce | 1         | true      |
| Dairy   | 2         | true      |
| Meat    | 3         | true      |
| Pantry  | 4         | true      |
| Frozen  | 5         | true      |
| Bakery  | 6         | true      |
| Other   | 7         | true      |

---

## Invite Generation Rules (US-06)

### Authorization

- Only the household **owner** can generate invites
- Members who attempt to generate invites receive `FORBIDDEN` error

### Token Generation

- **Link token**: 32 bytes of cryptographically random data, encoded as URL-safe base64 (43 chars)
- **Invite code**: 6 uppercase alphanumeric characters (A-Z, 0-9), excluding ambiguous chars (0/O, 1/I/L) → alphabet: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (29 chars)
- Both must be unique (retry on collision, extremely unlikely)

### Expiry

- Invites expire **24 hours** after creation
- Expired invites are not automatically cleaned up (lazy deletion on access)

### Invite Limits

- No hard limit on number of active invites per household
- Generating a new invite does **not** invalidate previous active invites

---

## Join Household Rules (US-04, US-05)

### Join via Link (POST /households/join/link)

- Client sends `{ token }` from the URL query parameter
- Look up invite by token
- Validate: not expired (`expiresAt > now()`)
- Validate: user is not already a member of this household (check `user_households`)
- If already a member: return `CONFLICT` with "You are already a member of this household"
- Insert `user_households` row with `role = "member"`
- Return the joined household

### Join via Code (POST /households/join/code)

- Client sends `{ code }` (case-insensitive — normalize to uppercase)
- Same validation as link join
- Same membership insertion

### Edge Cases

- Expired invite → `NOT_FOUND` with "Invite not found or expired"
- Invalid/unknown token or code → same `NOT_FOUND` error (no information leak about invite existence)
- User already a member → `CONFLICT`

---

## Member Management Rules (US-27, US-28)

### List Members (GET /households/:id/members)

- Any household member can view the member list
- Returns all members with: `userId`, `firstName`, `lastName`, `email`, `role`, `joinedAt`
- Ordered by `joinedAt` ascending (owner first, then chronological)

### Remove Member (DELETE /households/:id/members/:userId)

- Only the household **owner** can remove members
- Owner **cannot** remove themselves (return `FORBIDDEN` with "Cannot remove yourself from household")
- Deletes the `user_households` row (hard delete)
- Does **not** invalidate the removed user's session — the session is user-level, not household-scoped
- Next time the removed user sends `X-Household-Id` for this household, the household-resolver middleware will reject with `FORBIDDEN`

---

## Password Reset Rules (US-07 — Q7=A)

### Request Reset (POST /auth/forgot-password)

- Input: `{ email }`
- Always return 200 OK with generic message "If an account with that email exists, a reset link has been sent" — no information leak
- If email exists: generate a `PasswordResetToken` (32-byte random, URL-safe base64), expires in 1 hour
- Send email with reset link: `{FRONTEND_URL}/reset-password?token={token}`
- Rate limit: 3 requests per email per hour, 10 per IP per hour

### Execute Reset (POST /auth/reset-password)

- Input: `{ token, newPassword }`
- Look up token, validate not expired and not used (`usedAt IS NULL`)
- Validate new password with zxcvbn (same rules as registration)
- Hash new password with argon2id
- Update user's `hashedPassword` and `updatedAt`
- Mark token as used (`usedAt = now()`)
- Invalidate **all** existing sessions for this user (security measure)
- Return success — user must log in again with new password

### Email Sending

- Use **Resend** in all environments (development and production)
- In development: additionally log the reset URL to server console (`request.log.info`) for convenience
- Email content: plain text with reset link, no HTML for MVP

---

## API Route Contracts

### POST /auth/register

- **Input**: `{ email: string, password: string, firstName: string, lastName: string }`
- **Success (201)**: `{ data: { user, households: [] } }` + session cookie
- **Errors**: 400 (validation/weak password), 409 (email exists), 429 (rate limited)

### POST /auth/login

- **Input**: `{ email: string, password: string }`
- **Success (200)**: `{ data: { user, households: [{ id, name, role }] } }` + session cookie
- **Errors**: 401 (invalid credentials), 429 (rate limited)

### POST /auth/logout

- **Input**: session cookie
- **Success (204)**: no body, clears cookie
- **Errors**: 401 (not authenticated)

### GET /auth/me

- **Input**: session cookie
- **Success (200)**: `{ data: { user, households: [{ id, name, role }] } }`
- **Errors**: 401 (not authenticated)

### POST /auth/forgot-password

- **Input**: `{ email: string }`
- **Success (200)**: `{ data: { message: "If an account..." } }` (always, regardless of email existence)
- **Errors**: 429 (rate limited)

### POST /auth/reset-password

- **Input**: `{ token: string, newPassword: string }`
- **Success (200)**: `{ data: { message: "Password reset successful" } }`
- **Errors**: 400 (validation/weak password), 404 (invalid/expired token)

### GET /households

- **Input**: session cookie
- **Success (200)**: `{ data: { households: [{ id, name, role }] } }`
- **Errors**: 401

### POST /households

- **Input**: `{ name: string }` + session cookie
- **Success (201)**: `{ data: { household: { id, name, ownerId, createdAt } } }`
- **Errors**: 400 (validation), 401

### POST /households/join/link

- **Input**: `{ token: string }` + session cookie
- **Success (200)**: `{ data: { household: { id, name } } }`
- **Errors**: 401, 404 (invalid/expired), 409 (already member)

### POST /households/join/code

- **Input**: `{ code: string }` + session cookie
- **Success (200)**: `{ data: { household: { id, name } } }`
- **Errors**: 401, 404 (invalid/expired), 409 (already member)

### POST /households/:id/invites

- **Input**: session cookie (owner only)
- **Success (201)**: `{ data: { link, code, expiresAt } }`
- **Errors**: 401, 403 (not owner)

### GET /households/:id/members

- **Input**: session cookie
- **Success (200)**: `{ data: { members: [{ userId, firstName, lastName, email, role, joinedAt }] } }`
- **Errors**: 401, 403 (not a member)

### DELETE /households/:id/members/:userId

- **Input**: session cookie (owner only)
- **Success (204)**: no body
- **Errors**: 401, 403 (not owner or self-removal), 404 (member not found)
