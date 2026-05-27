# BigBatch — Component Dependencies

## Package Dependency Graph

```text
packages/shared (no external app dependencies)
    ^           ^
    |           |
apps/api    apps/web
```

- `packages/shared` depends on nothing else in the monorepo
- `apps/api` and `apps/web` both depend on `packages/shared`
- `apps/web` communicates with `apps/api` over HTTP (REST)
- Future native clients are intentionally outside the active workspace and are not current package dependencies

---

## Internal API Module Dependencies

```text
core (middleware, auth guard, error handler, logger)
  ^       ^       ^       ^       ^
  |       |       |       |       |
auth  recipes  ingredients  shopping-list  cook-events
              |       |            |
              v       v            v
         shared/    shared/     shared/
         scaling    nutrition   shopping
```

All domain modules depend on `core` for middleware (auth, validation, rate limiting, error handling).

### Module-to-Module Dependencies

| Module | Depends On (internal) | Depends On (shared) | External |
| --- | --- | --- | --- |
| `core` | — | `shared/schemas` (TypeBox schemas for validation) | Fastify plugins (@fastify/rate-limit, @fastify/cors, @fastify/helmet) |
| `auth` | `core` | `shared/types`, `shared/schemas` | Lucia Auth, argon2 |
| `recipes` | `core` | `shared/types`, `shared/schemas`, `shared/scaling`, `shared/nutrition` | Drizzle ORM |
| `ingredients` | `core` | `shared/types`, `shared/schemas` | Drizzle ORM, OpenFoodFacts API (HTTP) |
| `shopping-list` | `core` | `shared/types`, `shared/schemas`, `shared/shopping` | Drizzle ORM |
| `cook-events` | `core` | `shared/types`, `shared/schemas` | Drizzle ORM |

**No circular dependencies** — all arrows flow from modules → core and modules → shared.

---

## Data Flow Diagrams

### Flow 1: Create Recipe with Nutrition

```text
Client (web)
  |
  | POST /recipes { name, ingredients[], instructions[], batchSize }
  v
apps/api :: recipes route
  |-- schema validation (core, TypeBox)
  |-- auth middleware (core, Lucia session check)
  |-- recipes.service.createRecipe()
  |     |-- drizzle: INSERT recipe
  |     |-- drizzle: INSERT recipe_ingredients[]
  |     |-- shared/nutrition.calculateTotalNutrition()
  |     |-- shared/nutrition.calculatePerPortionNutrition()
  |     +-- return recipe + nutrition
  v
Client receives { recipe, nutrition }
```

### Flow 2: Scale Recipe

```text
Client (web)
  |
  | POST /recipes/:id/scale { targetPortions }
  v
apps/api :: recipes route
  |-- auth + validation
  |-- recipes.service.scaleRecipe()
  |     |-- drizzle: SELECT recipe + ingredients
  |     |-- shared/scaling.scaleIngredients(ingredients, from, to)
  |     |-- shared/nutrition.calculateTotalNutrition(scaledIngredients)
  |     +-- return { scaledIngredients, nutrition } (not persisted)
  v
Client receives scaled view
```

### Flow 3: Add Recipe to Shopping List

```text
Client (web)
  |
  | POST /shopping-list/add-recipe { recipeId, portions }
  v
apps/api :: shopping-list route
  |-- auth + validation
  |-- shopping-list.service.addRecipeToList()
  |     |-- drizzle: SELECT recipe + ingredients
  |     |-- shared/scaling.scaleIngredients() (if portions != recipe.batchSize)
  |     |-- drizzle: SELECT current shopping list items
  |     |-- shared/shopping.addRecipeToList(currentItems, recipe, portions)
  |     |     +-- internally calls consolidateItems()
  |     |-- drizzle: UPSERT shopping list items
  |     +-- return updated items
  v
Client receives { items[] }
```

### Flow 4: OpenFoodFacts Search

```text
Client (web)
  |
  | GET /ingredients/search-openfoodfacts?query=chicken
  v
apps/api :: ingredients route
  |-- auth + validation
  |-- ingredients.service.searchOpenFoodFacts("chicken")
  |     |-- check in-memory cache
  |     |-- [MISS] HTTP GET https://world.openfoodfacts.org/cgi/search.pl?...
  |     |-- parse response, extract nutrition data
  |     |-- store in cache (TTL 24h)
  |     +-- return { results[] }
  |     |-- [HIT] return cached results
  v
Client receives { results[] }
```

### Flow 5: Authentication Flow

```text
Client (web)
  |
  | POST /auth/login { email, password }
  v
apps/api :: auth route
  |-- schema validation (core)
  |-- rate limit check (core)
  |-- auth.service.loginUser()
  |     |-- drizzle: SELECT user by email
  |     |-- brute-force check (recent failed attempts)
  |     |-- argon2.verify(password, user.hashedPassword)
  |     |-- lucia.createSession(userId)
  |     |-- drizzle: SELECT user_households to load household list
  |     |-- set session cookie (secure, httpOnly, sameSite)
  |     +-- return { user, households[] }
  v
Client receives { user, households[] } + session cookie
Client stores the active household in localStorage
```

---

## Communication Patterns

| Communication | Pattern | Protocol |
| --- | --- | --- |
| Web → API | HTTP REST | HTTPS (TLS) |
| API → Turso | libSQL HTTP client | HTTPS (TLS, SECURITY-01) |
| API → OpenFoodFacts | HTTP client (fetch/undici) | HTTPS |
| API modules → shared | Direct function import | In-process (monorepo) |
| Web → shared | Direct function import | Bundled at build time |

Future native apps will use the same Web/API contract style (HTTPS REST) when they are introduced, but they are not part of the current deployment graph.

---

## Deployment Boundaries

| Package | Deployed As | Where |
| --- | --- | --- |
| `apps/web` | Static SPA (HTML/JS/CSS) | Cloudflare Pages |
| `apps/api` | Node.js server (Docker or buildpack) | PaaS (Fly.io / Railway) |
| `packages/shared` | Not deployed independently | Bundled into api and web at build time |
| Database | Turso managed libSQL | Turso cloud |
