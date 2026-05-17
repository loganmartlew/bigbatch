# Unit 0: Foundation — Business Logic Model

## Core Middleware Pipeline

Every API request passes through these middleware layers in order:

```
Request
  → Logger (assign requestId, log method/url/timestamp)
  → Security Headers (@fastify/helmet)
  → CORS check (@fastify/cors)
  → Rate Limiter (@fastify/rate-limit) [on applicable routes]
  → Schema Validation (Fastify built-in, TypeBox)
  → Auth Guard (Lucia session validation)
  → Household Resolution (X-Household-Id header → validate membership)
  → Route Handler
  → Error Handler (catch-all, structured error response)
```

### Auth Guard Behavior

1. Extract session cookie from request
2. Validate session via Lucia (`lucia.validateSession(sessionId)`)
3. If invalid/expired → 401 Unauthorized (generic message, SECURITY-09)
4. If valid → attach `request.user` (id, email, firstName, lastName) to request context
5. **Public routes** (register, login) skip the auth guard

### Household Resolution Behavior

1. Read `X-Household-Id` header from request
2. If missing → 400 Bad Request ("Household ID required")
3. Parse as integer; if invalid → 400
4. Query `user_households` for (userId, householdId) pair
5. If no row → 403 Forbidden ("Not a member of this household")
6. If found → attach `request.householdId` and `request.userRole` (owner/member) to request context
7. **Auth-only routes** (logout, list households, GET /auth/me) skip household resolution

### Error Handler Behavior

- All unhandled errors produce a structured JSON response:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An unexpected error occurred"
    }
  }
  ```
- Known error types map to specific HTTP status codes:
  - `ValidationError` → 400
  - `AuthenticationError` → 401
  - `ForbiddenError` → 403
  - `NotFoundError` → 404
  - `ConflictError` → 409 (e.g., duplicate email)
  - `RateLimitError` → 429
- Detailed error info is logged server-side (SECURITY-03) but never returned to client (SECURITY-09)
- External service failures (OpenFoodFacts) return 502 with generic message (SECURITY-15)

### Schema Validation Behavior

- Fastify's built-in JSON Schema validation with TypeBox schemas
- Request body, query params, and route params are validated before the route handler runs
- Validation failures return 400 with field-level error details (safe to expose — these are input format errors, not internal errors)

### Rate Limiter Configuration

| Route Group           | Window | Max Requests | Notes                          |
| --------------------- | ------ | ------------ | ------------------------------ |
| Auth (login/register) | 15 min | 10           | Per IP; brute-force protection |
| OpenFoodFacts search  | 1 min  | 30           | Per user; protect upstream API |
| All other routes      | 1 min  | 100          | Per user; general protection   |

---

## API Client Contract

### Request Headers

| Header           | Required  | Purpose                                |
| ---------------- | --------- | -------------------------------------- |
| `Cookie`         | Yes\*     | Session cookie (set by login/register) |
| `X-Household-Id` | Yes\*\*   | Active household ID (client-managed)   |
| `Content-Type`   | Yes\*\*\* | `application/json` for request bodies  |

\* Not required for register/login
\*\* Not required for auth-only routes (register, login, logout, GET /auth/me, GET /households)
\*\*\* Only for POST/PUT/PATCH with body

### Response Format

All successful responses follow:

```json
{ "data": { ... } }
```

All error responses follow:

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### Pagination (future-ready)

List endpoints return all results for now (household-scoped data is small). If pagination is needed later, the response envelope supports:

```json
{ "data": [...], "meta": { "total": 42, "page": 1, "pageSize": 20 } }
```

---

## Default Category Seeding Logic

When `createHousehold()` is called:

1. Insert the household row
2. Insert user_households row (role=owner)
3. Seed `shopping_categories` with defaults:
   - Produce (sortOrder=1, isDefault=1)
   - Dairy (sortOrder=2, isDefault=1)
   - Meat (sortOrder=3, isDefault=1)
   - Pantry (sortOrder=4, isDefault=1)
   - Frozen (sortOrder=5, isDefault=1)
   - Bakery (sortOrder=6, isDefault=1)
   - Other (sortOrder=7, isDefault=1)

This runs inside a transaction to ensure atomicity.
