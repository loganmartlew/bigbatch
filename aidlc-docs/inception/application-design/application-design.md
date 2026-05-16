# BigBatch — Application Design (Consolidated)

## 1. Architecture Overview

BigBatch is a **TypeScript monorepo** (pnpm workspaces + Turborepo) with 4 packages:

| Package           | Technology          | Deployment                         |
| ----------------- | ------------------- | ---------------------------------- |
| `apps/api`        | Fastify (Node.js)   | PaaS (Fly.io / Railway)            |
| `apps/web`        | Vite + React (SPA)  | Cloudflare Pages                   |
| `apps/mobile`     | React Native (Expo) | App Store / Google Play (Expo EAS) |
| `packages/shared` | Pure TypeScript     | Bundled into api, web, mobile      |

**Key architectural decisions:**

- API structured as **modular domain plugins** (Fastify plugins per domain)
- **Drizzle ORM** for database access (Turso/libSQL)
- **Lucia Auth** for session-based authentication
- **TanStack Query** for client-side server-state management
- **TanStack Router** for type-safe web routing
- **REST + OpenAPI** for API communication
- **Multi-household** support — users can belong to multiple households; active household is client-side only (sent via `X-Household-Id` header)
- **OpenFoodFacts** integration via cached proxy (24h TTL, in-memory LRU)
- Nutrition computed on read (not denormalized) to ensure ingredient updates propagate automatically

---

## 2. Domain Modules (`apps/api`)

| Module          | Responsibility                                                                                                                     | Key Dependencies                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `core`          | Cross-cutting middleware: auth guard, schema validation, rate limiting, CORS, security headers, error handler, structured logging  | Fastify plugins, Lucia, TypeBox           |
| `auth`          | Registration (with full name), login, sessions, multi-household membership, invites, member management                              | Lucia, argon2, Drizzle                    |
| `recipes`       | Recipe CRUD, duplication, scaling (via shared), nutrition computation (via shared)                                                 | Drizzle, shared/scaling, shared/nutrition |
| `ingredients`   | Ingredient library CRUD, OpenFoodFacts cached search                                                                               | Drizzle, OpenFoodFacts HTTP, LRU cache    |
| `shopping-list` | Add recipe to list, consolidation, tick-off, "I have this", clear                                                                  | Drizzle, shared/shopping                  |
| `cook-events`   | Log cook events, retrieve history                                                                                                  | Drizzle                                   |

---

## 3. Shared Package (`packages/shared`)

| Module      | Exports                                                                                                            | PBT Properties                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `types`     | `Recipe`, `Ingredient`, `NutritionInfo`, `ShoppingList`, `CookEvent`, `User`, `UserHousehold`, `Household`, `Unit` | —                                                                                              |
| `schemas`   | TypeBox validation schemas for all API request/response bodies                                                     | Round-trip: schema validates what types describe                                               |
| `nutrition` | `calculateTotalNutrition()`, `calculatePerPortionNutrition()`                                                      | Invariant: perPortion = total / batchSize                                                      |
| `scaling`   | `scaleIngredients()`, `roundQuantity()`                                                                            | Invariant: count preserved; Idempotency: scale(scale(r,N),N) = scale(r,N)                      |
| `shopping`  | `consolidateItems()`, `addRecipeToList()`, `groupByCategory()`                                                     | Idempotency: consolidate(consolidate(x)) = consolidate(x); Invariant: total quantity preserved |

---

## 4. API Surface (REST Endpoints)

### Auth & Household

| Endpoint                          | Method | Purpose                                               |
| --------------------------------- | ------ | ----------------------------------------------------- |
| `/auth/register`                  | POST   | Create account (email, password, firstName, lastName) |
| `/auth/login`                     | POST   | Sign in                                               |
| `/auth/logout`                    | POST   | Sign out                                              |
| `/auth/me`                        | GET    | Current user + all households                         |
| `/households`                     | GET    | List user's households                                |
| `/households`                     | POST   | Create household                                      |
| `/households/join/link`           | POST   | Join via invite link                                  |
| `/households/join/code`           | POST   | Join via invite code                                  |
| `/households/:id/invites`         | POST   | Generate invite (owner)                               |
| `/households/:id/members`         | GET    | List members                                          |
| `/households/:id/members/:userId` | DELETE | Remove member (owner)                                 |

### Recipes

| Endpoint                 | Method | Purpose                       |
| ------------------------ | ------ | ----------------------------- |
| `/recipes`               | POST   | Create recipe                 |
| `/recipes`               | GET    | List household recipes        |
| `/recipes/:id`           | GET    | Get recipe + nutrition        |
| `/recipes/:id`           | PUT    | Update recipe                 |
| `/recipes/:id`           | DELETE | Delete recipe                 |
| `/recipes/:id/duplicate` | POST   | Duplicate recipe              |
| `/recipes/:id/scale`     | POST   | Scale recipe (non-persistent) |

### Ingredients

| Endpoint                            | Method | Purpose                       |
| ----------------------------------- | ------ | ----------------------------- |
| `/ingredients`                      | POST   | Create ingredient             |
| `/ingredients`                      | GET    | List household ingredients    |
| `/ingredients/:id`                  | GET    | Get ingredient                |
| `/ingredients/:id`                  | PUT    | Update ingredient             |
| `/ingredients/:id`                  | DELETE | Delete ingredient             |
| `/ingredients/search-openfoodfacts` | GET    | Search OpenFoodFacts (cached) |

### Shopping List

| Endpoint                    | Method | Purpose                        |
| --------------------------- | ------ | ------------------------------ |
| `/shopping-list`            | GET    | Get list (grouped by category) |
| `/shopping-list/add-recipe` | POST   | Add recipe to list             |
| `/shopping-list/items/:id`  | PATCH  | Toggle tickedOff / haveThis    |
| `/shopping-list`            | DELETE | Clear list                     |

### Cook Events

| Endpoint                   | Method | Purpose                 |
| -------------------------- | ------ | ----------------------- |
| `/recipes/:id/cook-events` | POST   | Log cook event          |
| `/recipes/:id/cook-events` | GET    | Get recipe cook history |

---

## 5. Client Architecture

### Web (`apps/web` — Vite + React SPA)

- **Routing**: TanStack Router (type-safe file-based routing)
- **Server state**: TanStack Query (fetch, cache, optimistic updates)
- **API client**: Generated typed client from OpenAPI spec (or hand-written fetch wrapper using shared types)
- **Active household**: Stored in `localStorage`; sent as `X-Household-Id` header on every API request
- **Forms**: React Hook Form + shared TypeBox/Zod schemas for validation
- **Cook mode**: Wake Lock API (`navigator.wakeLock.request('screen')`)
- **Deployment**: Static build → Cloudflare Pages

### Mobile (`apps/mobile` — React Native / Expo)

- **Navigation**: React Navigation (Expo Router)
- **Server state**: TanStack Query (same hooks, different API client base URL)
- **Secure storage**: expo-secure-store for session tokens
- **Active household**: Stored in `AsyncStorage`; sent as `X-Household-Id` header on every API request
- **Cook mode**: expo-keep-awake for screen wake-lock
- **Deployment**: Expo EAS Build → App Store / Google Play

### Code Sharing (web ↔ mobile)

- **Shared domain logic**: `packages/shared` (types, schemas, nutrition, scaling, shopping)
- **Shared hooks**: TanStack Query hooks can be shared if API client is abstracted
- **NOT shared**: UI components (React DOM vs React Native), navigation, platform APIs

---

## 6. Security Architecture (SECURITY compliance summary)

| Rule        | Design Approach                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| SECURITY-01 | Turso: encryption at rest (managed); all connections TLS                                               |
| SECURITY-02 | PaaS access logs enabled; API gateway logging via Fastify pino                                         |
| SECURITY-03 | Fastify pino structured JSON logging with request ID, timestamp, level                                 |
| SECURITY-04 | @fastify/helmet sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy               |
| SECURITY-05 | Fastify built-in schema validation with TypeBox; all endpoints validated                               |
| SECURITY-06 | Turso API token scoped to specific database; PaaS deploy tokens scoped                                 |
| SECURITY-07 | PaaS handles networking; API only exposed on HTTPS                                                     |
| SECURITY-08 | Auth middleware on all routes; object-level authz (householdId check); CORS restricted                 |
| SECURITY-09 | No default credentials; error handler returns generic messages; no debug endpoints in production       |
| SECURITY-10 | pnpm lockfile; Turborepo pinned; npm audit in CI                                                       |
| SECURITY-11 | @fastify/rate-limit on auth endpoints + public endpoints                                               |
| SECURITY-12 | Lucia Auth + argon2; session cookies (secure/httpOnly/sameSite); brute-force protection; MFA for owner |
| SECURITY-13 | TypeBox schemas prevent unsafe deserialization; SRI for CDN resources                                  |
| SECURITY-14 | Structured logging with alerting on auth failures (configurable)                                       |
| SECURITY-15 | Global error handler; fail-closed on auth errors; graceful OpenFoodFacts failures                      |

---

## 7. Dependency Graph

```
packages/shared
    ^           ^           ^
    |           |           |
apps/api    apps/web    apps/mobile
    |
    v
Turso (libSQL)    OpenFoodFacts API
```

All domain modules within `apps/api` depend on `core` (middleware) and `packages/shared` (types, schemas, business logic). No circular dependencies exist.
