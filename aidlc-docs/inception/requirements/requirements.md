# BigBatch — Requirements Document

## Intent Analysis

| Dimension              | Value                                                                                                                                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Request**       | Build a bulk-cooking companion app called BigBatch for planning, cooking, and tracking bulk meals with macro/calorie awareness and reusable recipes. Current update: pause active mobile delivery, move future mobile to fully native clients, and adopt Mantine for the web UI. |
| **Request Type**       | New Project (greenfield) with scope refinement during foundation construction                                                                                                                                                                                                    |
| **Scope**              | Multiple components — recipes, ingredients/nutrition, shopping list, cook mode, cook history, multi-user households, web + API in the current phase; native mobile deferred                                                                                                      |
| **Complexity**         | Moderate — clear domain model, several integration points (OpenFoodFacts, auth), and a design-system migration while construction is already in progress                                                                                                                         |
| **Requirements Depth** | Standard                                                                                                                                                                                                                                                                         |

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

### FR-05: Planned Cooking And Cook Mode

- **FR-05.1**: From recipe detail, users can choose a batch size and add a recipe to a persistent cooks queue.
- **FR-05.2**: Queueing a cook adds the required ingredients to the shared household shopping list.
- **FR-05.3**: A queued cook has a derived readiness state based on shopping-list completion: it remains `gathering ingredients` until all required ingredients are marked `haveThis` or `tickedOff`, then becomes `ready to cook`.
- **FR-05.4**: While a queued cook is still gathering ingredients, the selected batch size can be changed and the linked ingredient requirements plus shopping quantities update accordingly.
- **FR-05.5**: Users can enter cook mode only for a queued cook that is ready to cook.
- **FR-05.6**: Cook mode displays required ingredients at the top by default and all instructions as a checklist in a single scrollable view.
- **FR-05.7**: A finish action at the bottom of cook mode completes the queued cook, removes it from the active queue, and creates a cook event.
- **FR-05.8**: Cook mode activates a screen wake-lock where the platform supports it.

### FR-06: Cooks Dashboard And History

- **FR-06.1**: The app provides a household-facing Cooks dashboard that shows active queued cooks and historical cook events.
- **FR-06.2**: Cook history is viewable as a chronological newest-first list of cook events showing recipe, user, batch size, date, and notes.
- **FR-06.3**: Cook events are associated with the user who completed the cook.
- **FR-06.4**: After creation, cook-event date and notes can be edited from history surfaces.
- **FR-06.5**: Recipe detail pages also show an inline recipe-specific history section in addition to the dashboard.

### FR-07: User & Household Management

- **FR-07.1**: Users register and sign in with email and password.
- **FR-07.2**: A user can belong to one or more households.
- **FR-07.3**: Household members share recipes, ingredients, shopping lists, and cook history.
- **FR-07.4**: There must be a mechanism for users to join an existing household (e.g., invite link or code).
- **FR-07.5**: The currently active household is chosen in the client UI and sent with each household-scoped request.

### FR-08: Units of Measurement

- **FR-08.1**: The app supports metric units (g, kg, ml, l) as primary units plus common kitchen units (tbsp, tsp, cup) and a generic "item" unit.
- **FR-08.2**: Users select the unit per ingredient when creating/editing recipes.

### FR-09: Current Client Scope

- **FR-09.1**: The current delivery scope is a polished web application backed by the shared API and domain packages.
- **FR-09.2**: Future mobile support will be implemented as fully native iOS and Android apps in a later phase.
- **FR-09.3**: The backend API and shared domain contracts must stay client-agnostic so future native clients can integrate cleanly.

---

## 2. Non-Functional Requirements

### NFR-01: Performance

- The web app should load and be interactive within 3 seconds on a standard broadband connection.
- Recipe scaling, nutrition calculation, and shopping list consolidation should complete in under 500 ms.

### NFR-02: Availability

- Target 99% uptime for the cloud-hosted backend (acceptable for a personal/household app).

### NFR-03: Security

- Full security baseline enforced (SECURITY-01 through SECURITY-15). Key implications:
  - **SECURITY-01**: SQLite/Turso database with encryption at rest; all connections over TLS.
  - **SECURITY-04**: HTTP security headers on all web responses (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
  - **SECURITY-05**: Fastify schema-first input validation on all API endpoints.
  - **SECURITY-08**: All endpoints authenticated by default; object-level authorization (users can only access households they belong to); CORS restricted to known origins.
  - **SECURITY-11**: Rate limiting on public-facing endpoints.
  - **SECURITY-12**: Self-managed auth — adaptive password hashing (argon2 or bcrypt), MFA support for admin accounts, session management with secure/httpOnly/sameSite cookies, brute-force protection on login.

### NFR-04: Testing

- Full property-based testing enforced (PBT-01 through PBT-10). Key implications:
  - **PBT-09**: `fast-check` as the PBT framework for the active TypeScript codebase.
  - Round-trip PBT for serialization/deserialization of recipes, ingredients, and nutrition data.
  - Invariant PBT for scaling calculations (total nutrition scales linearly; ingredient count preserved).
  - Idempotency PBT for shopping list consolidation (consolidating twice = consolidating once).
  - Stateful PBT for shopping list state (add recipes, mark items, tick off).
  - Complementary: example-based tests for all critical business paths alongside PBT.

### NFR-05: Maintainability

- TypeScript is used across the active backend, web, and shared packages for consistency and type safety.
- The monorepo should keep domain types, validation schemas, and pure business logic in shared packages while keeping the API boundary stable for future native clients.

### NFR-06: Scalability

- Designed for household-scale (1–10 concurrent users). No need for horizontal scaling at launch; architecture should not preclude it.

### NFR-07: Web Experience

- The current web app must use Mantine as its UI library.
- The web foundation should look polished and cohesive, with consistent spacing, hierarchy, theming, and responsive layout behavior.
- Shared UI patterns should favor accessible Mantine primitives over ad-hoc styling.

---

## 3. Explicitly Out of Scope

- Current-cycle native iOS and Android apps (deferred to a later phase)
- Cross-platform mobile frameworks for the active implementation
- Use-by / expiry tracking
- Freezer location or multi-house features
- Meal scheduling / weekly planners
- Social / sharing features
- Data import/export (backend handles persistence; multi-device via sync)

---

## 4. Tech Stack Decisions

| Decision         | Choice                         | Detail                                                                          |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| Current delivery | Web-first                      | Active implementation is `apps/web`, `apps/api`, and `packages/shared`          |
| Future mobile    | Fully native                   | iOS + Android planned later; not part of the current construction scope         |
| Backend          | TypeScript + Fastify           | Schema-first validation; `fast-check` PBT; same language as the active frontend |
| Database         | SQLite via Turso               | Managed, replicated, edge-optimized; libSQL for household-scale HTTP access     |
| Authentication   | Self-managed Lucia Auth        | Full control; SECURITY-12 compliance owned by us                                |
| API style        | REST + OpenAPI                 | Typed contracts, client-agnostic, future-native-friendly                        |
| Web frontend     | Vite + React (SPA)             | Static SPA; deployed to CDN edge                                                |
| Web UI library   | Mantine                        | Shared theme, polished component library, responsive layout primitives          |
| Repo structure   | Monorepo (pnpm workspaces)     | `apps/web`, `apps/api`, `packages/shared`                                       |
| Hosting — Web    | Cloudflare Pages               | Static SPA on CDN edge                                                          |
| Hosting — API    | PaaS (e.g., Fly.io or Railway) | Managed TLS, secrets, logging                                                   |
| Hosting — DB     | Turso (managed)                | Embedded libSQL, replicated to cloud                                            |
| PBT framework    | fast-check                     | TypeScript; integrates with Vitest/Jest; shrinking + seed reproducibility       |

---

## 5. Open Design Decisions (deferred to later construction work)

- Exact Turso schema migration workflow
- Final password-policy and MFA rollout details for owner accounts
- OpenFoodFacts API integration caching limits and invalidation details
- Specific PaaS selection for API hosting
- Native iOS/Android implementation plan for the deferred mobile phase
