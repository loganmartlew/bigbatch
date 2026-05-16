# BigBatch — Service Layer Design

## Architecture Pattern

Each API domain module is a **self-contained Fastify plugin** (Q1=B). Within each plugin:

- **Routes** handle HTTP concerns (request parsing, response formatting, status codes)
- **Service functions** contain orchestration logic (calling repositories, shared pure functions, external APIs)
- **Repository functions** handle database access via Drizzle ORM

This is not a formal layered architecture with DI — it's a pragmatic module-per-domain structure where services are plain functions imported by routes.

---

## Service Definitions

### `auth` Service

| Function                                             | Orchestration                                                                                                        | Notes                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `registerUser(email, password, firstName, lastName)` | Validate password policy → check breached passwords → hash with argon2 → insert user → return user                   | SECURITY-12: adaptive hashing, breached-password check |
| `loginUser(email, password)`                         | Find user → verify hash → create Lucia session → set cookie                                                          | SECURITY-12: brute-force check before verification     |
| `logoutUser(sessionId)`                              | Invalidate Lucia session                                                                                             |                                                        |
| `getCurrentUser(sessionId)`                          | Validate session → load user + all households (via user_households)                                                  |                                                        |
| `listUserHouseholds(userId)`                         | Query user_households join → return all households with role                                                         |                                                        |
| `createHousehold(userId, name)`                      | Insert household → insert user_households row (role=owner)                                                           |                                                        |
| `joinHousehold(userId, tokenOrCode)`                 | Validate invite → check not expired → insert user_households row (role=member)                                       |                                                        |
| `generateInvite(householdId, ownerId)`               | Verify owner → generate unique token + short code → insert with expiry                                               |                                                        |
| `removeHouseholdMember(ownerId, targetUserId)`       | Verify owner → verify target != owner → delete user_households row                                                   |                                                        |

### `recipes` Service

| Function                                         | Orchestration                                                                                                                                    | Notes                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `createRecipe(householdId, userId, data)`        | Validate via schema → insert recipe + recipe_ingredients → compute nutrition via `shared/nutrition` → return                                     |                                                      |
| `getRecipe(householdId, recipeId)`               | Fetch recipe + ingredients → compute nutrition → return                                                                                          | Authorization: recipe.householdId must match session |
| `listRecipes(householdId)`                       | Fetch all household recipes with precomputed nutrition summary                                                                                   |                                                      |
| `updateRecipe(householdId, recipeId, data)`      | Validate → update fields → recompute nutrition → return                                                                                          |                                                      |
| `deleteRecipe(householdId, recipeId)`            | Verify household ownership → delete recipe (cascade ingredients)                                                                                 | Cook events retained (orphaned)                      |
| `duplicateRecipe(householdId, recipeId, userId)` | Fetch original → insert copy with "Copy of" prefix → return                                                                                      |                                                      |
| `scaleRecipe(recipeId, targetPortions)`          | Fetch recipe → call `shared/scaling.scaleIngredients()` → call `shared/nutrition.calculateTotalNutrition()` → return scaled view (not persisted) |                                                      |

### `ingredients` Service

| Function                                            | Orchestration                                                                                | Notes                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `createIngredient(householdId, data)`               | Validate → insert ingredient → return                                                        |                                                      |
| `updateIngredient(householdId, ingredientId, data)` | Validate → update → recipes using this ingredient auto-reflect new nutrition on next read    | Nutrition is computed on read, not stored            |
| `deleteIngredient(householdId, ingredientId)`       | Check not in use by any recipe (or soft-delete) → delete                                     |                                                      |
| `searchOpenFoodFacts(query)`                        | Check cache → if miss, call OpenFoodFacts API → parse response → cache result (TTL) → return | SECURITY-15: handle external API failures gracefully |

### `shopping-list` Service

| Function                                           | Orchestration                                                                                     | Notes                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| `getShoppingList(householdId)`                     | Fetch items → call `shared/shopping.groupByCategory()` → return                                   |                              |
| `addRecipeToList(householdId, recipeId, portions)` | Fetch recipe → scale if needed → call `shared/shopping.addRecipeToList()` → upsert items → return | Consolidation happens on add |
| `toggleItem(householdId, itemId, field)`           | Update tickedOff or haveThis flag                                                                 |                              |
| `clearList(householdId)`                           | Delete all items for household                                                                    |                              |

### `cook-events` Service

| Function                                            | Orchestration                                                     | Notes |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----- |
| `logCookEvent(householdId, recipeId, userId, data)` | Validate recipe belongs to household → insert cook event → return |       |
| `getCookHistory(householdId, recipeId)`             | Fetch cook events ordered by date DESC → return                   |       |

---

## Cross-Cutting Services (in `core` module)

| Service           | Responsibility                                                                                                           | Implementation                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Auth middleware   | Validate Lucia session on every request; attach `request.user`; resolve `request.householdId` from `X-Household-Id` request header (validated against user's memberships) | Fastify `onRequest` hook                             |
| Schema validation | Validate request body/params/query against TypeBox schemas                                                               | Fastify's built-in schema validation (SECURITY-05)   |
| Rate limiter      | Limit requests on auth endpoints and public endpoints                                                                    | `@fastify/rate-limit` plugin (SECURITY-11)           |
| Error handler     | Catch all unhandled errors, log structured details, return generic 500 to client                                         | Fastify `setErrorHandler` (SECURITY-09, SECURITY-15) |
| CORS              | Restrict origins to web app domain(s)                                                                                    | `@fastify/cors` (SECURITY-08)                        |
| Security headers  | Set CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy                                                  | `@fastify/helmet` (SECURITY-04)                      |
| Logger            | Structured JSON logging with timestamp, request ID, level                                                                | Fastify's built-in pino logger (SECURITY-03)         |

---

## Nutrition Computation Strategy

**Computed on read, not stored**. When a recipe is fetched:

1. Load recipe ingredients (ingredientId, quantity, unit) from `recipe_ingredients` table
2. Load each ingredient's nutrition data from `ingredients` table
3. Call `shared/nutrition.calculateTotalNutrition(ingredients)` — sum of (ingredient.nutrientPerUnit \* quantity) for each macro
4. Call `shared/nutrition.calculatePerPortionNutrition(total, batchSize)`

This ensures FR-02.5 (updating an ingredient auto-updates all recipes) without denormalization.

---

## OpenFoodFacts Caching Strategy

- **Cache location**: In-memory TTL map (e.g., `Map<string, { data, expiresAt }>` or a lightweight LRU cache library)
- **TTL**: 24 hours (food data changes infrequently)
- **Cache key**: Normalized search query string
- **Eviction**: LRU when cache exceeds configurable max entries (e.g., 500)
- **Fallback**: On external API failure, return cached data if available (even if stale); otherwise return error (SECURITY-15)
