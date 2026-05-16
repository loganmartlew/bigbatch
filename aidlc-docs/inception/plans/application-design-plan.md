# Application Design Plan — BigBatch

## Design Scope

Based on requirements (8 FRs, 6 NFRs) and stories (28 stories, 7 journeys), the application consists of:

- **4 deployable artifacts**: `apps/web` (Vite+React SPA), `apps/mobile` (React Native/Expo), `apps/api` (Fastify), `packages/shared`
- **Core domain**: Recipes, ingredients, nutrition, shopping lists, cook events, users, households
- **Key integrations**: OpenFoodFacts API, Turso (libSQL), self-managed auth (Lucia/Auth.js)

## Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag.

---

### Question 1: API Layer Architecture

How should the Fastify API be structured internally?

A) **Layered (Controller → Service → Repository)** — classic separation; controllers handle HTTP, services contain business logic, repositories handle DB access
B) **Modular by domain (feature modules)** — each domain (recipes, ingredients, shopping-list, etc.) is a self-contained Fastify plugin with its own routes/services/repos
C) **Hybrid** — modular by domain at the top level, layered (service → repo) within each module
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2: Shared Package Scope

What should live in `packages/shared` vs stay in individual apps?

A) **Types + validation schemas only** — shared TypeScript types (Recipe, Ingredient, etc.) and Zod/TypeBox schemas for API request/response validation; all business logic stays in `apps/api`
B) **Types + validation + pure business logic** — also share pure functions like `scaleRecipe()`, `calculateNutrition()`, `consolidateShoppingList()` so web/mobile can compute locally and API can reuse
C) **Types + validation + business logic + API client** — also include a generated typed REST client so web/mobile import `api.recipes.create(...)` from shared
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3: Database Access Pattern

How should the API interact with Turso/libSQL?

A) **Raw SQL with a thin query builder** (e.g., Kysely or libSQL client directly) — maximum control, minimal abstraction
B) **Lightweight ORM** (e.g., Drizzle ORM) — typed schema definitions, query builder, migrations; less magic than heavy ORMs
C) **Full ORM** (e.g., Prisma with Turso adapter) — schema-first, auto-generated client, migrations
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4: Auth Library Selection

Which self-managed auth library for Fastify?

A) **Lucia Auth** — lightweight, session-based, database-agnostic; you own the session table and password hashing; clear, minimal API
B) **Auth.js (NextAuth v5) with Fastify adapter** — broader feature set (OAuth providers, magic links, JWT+session); community adapter exists but less battle-tested with Fastify specifically
C) **Custom** — build auth middleware from scratch using argon2 + cookie-session + CSRF token; maximum control, most effort
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: State Management in Web/Mobile

How should client-side state (fetched data, optimistic updates) be managed?

A) **TanStack Query (React Query)** — server-state cache with automatic refetching, optimistic mutations, offline support
B) **SWR** — lighter alternative to TanStack Query; simpler API, less built-in mutation support
C) **Zustand + manual fetching** — global store for client state; fetch/cache manually
D) **TanStack Query for server state + Zustand for local UI state** — separation of concerns
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: OpenFoodFacts Integration Approach

How should the API interact with OpenFoodFacts?

A) **Direct proxy** — API exposes a `/ingredients/search-openfoodfacts` endpoint that calls OpenFoodFacts in real time and returns results to the client
B) **Proxy with caching** — same as A, but cache OpenFoodFacts responses (e.g., in-memory TTL cache or Turso table) to reduce external calls
C) **Background import** — user triggers a search, API queues a background job to fetch and store results, client polls for completion
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 7: Monorepo Tooling

Which tool should orchestrate the monorepo build/dev workflow?

A) **Turborepo** — fast, simple config, good caching; just orchestrates pnpm workspace scripts
B) **Nx** — more features (affected commands, generators, dependency graph); heavier setup
C) **Plain pnpm workspaces** — no orchestrator; just `pnpm -r` and manual scripts; simplest but no caching
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Execution Plan

Once answers are received, design artifacts will be generated:

- [x] **Step 1**: Define component inventory (components.md)
- [x] **Step 2**: Define component methods and interfaces (component-methods.md)
- [x] **Step 3**: Define service layer and orchestration (services.md)
- [x] **Step 4**: Define component dependencies and data flow (component-dependency.md)
- [x] **Step 5**: Consolidate into application-design.md
- [x] **Step 6**: Validate design against requirements traceability and security/PBT constraints
