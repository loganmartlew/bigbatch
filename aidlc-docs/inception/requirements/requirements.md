# BigBatch — Requirements Document

## Intent Analysis

| Dimension              | Value                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Request**       | Build a bulk-cooking companion app called BigBatch for planning, cooking, and tracking bulk meals with macro/calorie awareness and reusable recipes |
| **Request Type**       | New Project (greenfield)                                                                                                                            |
| **Scope**              | Multiple components — recipes, ingredients/nutrition, shopping list, cook mode, cook history, multi-user household, web + mobile                    |
| **Complexity**         | Moderate — clear domain model, well-scoped features, several integration points (OpenFoodFacts, auth, mobile)                                       |
| **Requirements Depth** | Standard                                                                                                                                            |

---

## 1. Functional Requirements

### FR-01: Recipe Management

- **FR-01.1**: Users can create recipes with a name, description, list of ingredients (quantity + unit), step-by-step instructions, and a default batch size (number of portions).
- **FR-01.2**: Users can edit any field of a saved recipe.
- **FR-01.3**: Users can duplicate a recipe to create a variant.
- **FR-01.4**: Users can delete a recipe they own.
- **FR-01.5**: Users can scale a recipe to a different number of portions. Ingredient quantities adjust using linear scaling with sensible rounding (e.g., round to nearest 5 g, 0.25 tsp). After scaling, individual ingredients can be overridden manually.
- **FR-01.6**: Recipes are visible to all members of the same household.

### FR-02: Ingredient Library

- **FR-02.1**: The app maintains a shared household ingredient library.
- **FR-02.2**: Each ingredient has a name, default unit (e.g., per 100 g, per ml, per item), and nutritional data: calories, protein, carbs, fat.
- **FR-02.3**: Ingredients can be created manually with user-entered nutritional data.
- **FR-02.4**: Ingredients can optionally be pre-filled by searching OpenFoodFacts (public food database). The user can accept or adjust the returned data before saving.
- **FR-02.5**: When an ingredient's nutritional data is updated, all recipes using that ingredient reflect the new values automatically.
- **FR-02.6**: Ingredients can be assigned to a shopping category (produce, dairy, pantry, meat, etc.) for shopping list grouping.

### FR-03: Nutrition Calculation

- **FR-03.1**: The app calculates total nutritional values (calories, protein, carbs, fat) for an entire recipe based on its ingredients and quantities.
- **FR-03.2**: The app calculates per-portion nutritional values by dividing the total by the batch size.
- **FR-03.3**: Nutrition calculations update in real time when ingredients, quantities, or batch size change.

### FR-04: Shopping List

- **FR-04.1**: Users can add a recipe's ingredients to a shopping list with one action, scaled to the chosen batch size.
- **FR-04.2**: Adding ingredients from multiple recipes consolidates duplicate ingredients into single line items with combined quantities.
- **FR-04.3**: Shopping list items are grouped by ingredient category (produce, dairy, pantry, meat, etc.), auto-assigned from the ingredient's category.
- **FR-04.4**: When generating a shopping list, users can mark individual ingredients as "I have this" to exclude them from the list. This is per-list (not a persistent pantry).
- **FR-04.5**: Users can tick items off as they shop.
- **FR-04.6**: Shopping lists are shared across the household.

### FR-05: Cook Mode

- **FR-05.1**: Users can open a recipe in cook mode — a clean, large-text, distraction-free view of the recipe instructions.
- **FR-05.2**: Cook mode displays a checkable step list so users can tick off steps as they cook.
- **FR-05.3**: Cook mode activates a screen wake-lock to prevent the device screen from turning off while cooking.

### FR-06: Cooking History

- **FR-06.1**: Each time a user cooks a recipe, they can log a cook event recording the date, batch size used, and optional free-text notes.
- **FR-06.2**: A recipe's cook history is viewable as a chronological list of cook events.
- **FR-06.3**: Cook events are associated with the user who cooked.

### FR-07: User & Household Management

- **FR-07.1**: Users register and sign in with email and password.
- **FR-07.2**: A user belongs to one household.
- **FR-07.3**: Household members share recipes, ingredients, shopping lists, and cook history.
- **FR-07.4**: There must be a mechanism for users to join an existing household (e.g., invite link or code).

### FR-08: Units of Measurement

- **FR-08.1**: The app supports metric units (g, kg, ml, l) as primary units plus common kitchen units (tbsp, tsp, cup) and a generic "item" unit.
- **FR-08.2**: Users select the unit per ingredient when creating/editing recipes.

---

## 2. Non-Functional Requirements

### NFR-01: Performance

- The web and mobile apps should load and be interactive within 3 seconds on a standard broadband connection.
- Recipe scaling, nutrition calculation, and shopping list consolidation should complete in under 500 ms.

### NFR-02: Availability

- Target 99% uptime for the cloud-hosted backend (acceptable for a personal/household app).

### NFR-03: Security

- Full security baseline enforced (SECURITY-01 through SECURITY-15). Key implications:
  - **SECURITY-01**: SQLite/Turso database with encryption at rest; all connections over TLS.
  - **SECURITY-04**: HTTP security headers on all web responses (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
  - **SECURITY-05**: Fastify schema-first input validation on all API endpoints.
  - **SECURITY-08**: All endpoints authenticated by default; object-level authorization (users can only access their own household's data); CORS restricted to known origins.
  - **SECURITY-11**: Rate limiting on public-facing endpoints.
  - **SECURITY-12**: Self-managed auth — adaptive password hashing (argon2 or bcrypt), MFA support for admin accounts, session management with secure/httpOnly/sameSite cookies, brute-force protection on login.

### NFR-04: Testing

- Full property-based testing enforced (PBT-01 through PBT-10). Key implications:
  - **PBT-09**: `fast-check` as the PBT framework (TypeScript everywhere).
  - Round-trip PBT for serialization/deserialization of recipes, ingredients, nutrition data.
  - Invariant PBT for scaling calculations (total nutrition scales linearly; ingredient count preserved).
  - Idempotency PBT for shopping list consolidation (consolidating twice = consolidating once).
  - Stateful PBT for shopping list state (add recipes, mark items, tick off).
  - Complementary: example-based tests for all critical business paths alongside PBT.

### NFR-05: Maintainability

- TypeScript everywhere (backend, web, mobile, shared packages) for consistency and type safety.
- Monorepo with shared packages for domain types, validation schemas, and business logic.

### NFR-06: Scalability

- Designed for household-scale (1–10 concurrent users). No need for horizontal scaling at launch; architecture should not preclude it.

---

## 3. Explicitly Out of Scope

- Use-by / expiry tracking
- Freezer location or multi-house features
- Meal scheduling / weekly planners
- Social / sharing features
- Data import/export (backend handles persistence; multi-device via sync)

---

## 4. Tech Stack Decisions

| Decision       | Choice                               | Detail                                                                    |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| Mobile         | React Native (Expo)                  | Cross-platform iOS + Android; code sharing with web                       |
| Backend        | TypeScript + Fastify                 | Schema-first validation; `fast-check` PBT; same language as frontend      |
| Database       | SQLite via Turso                     | Managed, replicated, edge-optimized; libSQL for multi-user HTTP access    |
| Authentication | Self-managed (Lucia Auth or Auth.js) | Full control; SECURITY-12 compliance owned by us                          |
| API style      | REST + OpenAPI                       | Typed client generation; universal tooling                                |
| Web frontend   | Vite + React (SPA)                   | Static SPA; deployed to CDN edge                                          |
| Repo structure | Monorepo (pnpm workspaces)           | `apps/web`, `apps/mobile`, `apps/api`, `packages/shared`                  |
| Hosting — Web  | Cloudflare Pages                     | Static SPA on CDN edge                                                    |
| Hosting — API  | PaaS (e.g., Fly.io or Railway)       | Managed TLS, secrets, logging                                             |
| Hosting — DB   | Turso (managed)                      | Embedded libSQL, replicated to cloud                                      |
| PBT framework  | fast-check                           | TypeScript; integrates with Vitest/Jest; shrinking + seed reproducibility |

---

## 5. Open Design Decisions (deferred to Application Design)

- Exact Turso schema design and migration strategy
- Lucia vs Auth.js final selection and MFA implementation approach
- OpenFoodFacts API integration caching strategy
- Monorepo tooling choice (Turborepo vs Nx vs plain pnpm workspaces)
- Specific PaaS selection for API hosting
