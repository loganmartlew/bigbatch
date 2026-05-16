# BigBatch — Component Inventory

## Overview

BigBatch is structured as a **monorepo** (pnpm workspaces + Turborepo) with 4 packages. The API is organised as **modular domain plugins** (Fastify plugins), each self-contained with routes, services, and repositories.

---

## Package: `apps/api` (Fastify Backend)

### Module: `auth`

- **Purpose**: User registration, authentication, session management, household membership
- **Responsibilities**:
  - User registration with full name (first/last) and password validation (breached-password check)
  - Email/password login with brute-force protection
  - Session creation, validation, and invalidation (Lucia Auth)
  - MFA support for household owner accounts (SECURITY-12)
  - Multi-household membership (users can belong to multiple households via `user_households` join table)
  - Household creation and join (invite link + invite code)
  - Household membership management (owner role)
- **Key Dependencies**: Lucia Auth, argon2, Drizzle ORM, `shared/types`

### Module: `recipes`

- **Purpose**: Recipe CRUD, scaling, nutrition display
- **Responsibilities**:
  - Create, read, update, delete recipes scoped to household
  - Duplicate recipes
  - Scale recipe (delegates to `shared/scaling` for calculation)
  - Return computed nutrition (delegates to `shared/nutrition`)
  - Object-level authorization — household scope (SECURITY-08)
- **Key Dependencies**: Drizzle ORM, `shared/types`, `shared/scaling`, `shared/nutrition`

### Module: `ingredients`

- **Purpose**: Ingredient library CRUD, OpenFoodFacts search
- **Responsibilities**:
  - Create, read, update, delete ingredients scoped to household
  - Search OpenFoodFacts via cached proxy
  - Manage ingredient shopping categories
  - Propagate nutrition updates to recipe calculations
- **Key Dependencies**: Drizzle ORM, `shared/types`, OpenFoodFacts HTTP client, in-memory cache

### Module: `shopping-list`

- **Purpose**: Shopping list generation, consolidation, tick-off, clearing
- **Responsibilities**:
  - Add recipe ingredients to persistent shopping list (scaled)
  - Consolidate duplicate ingredients across recipes
  - Mark items as "I have this" (per-list)
  - Tick off items during shopping
  - Clear shopping list
  - Shared across household (SECURITY-08)
- **Key Dependencies**: Drizzle ORM, `shared/types`, `shared/shopping`

### Module: `cook-events`

- **Purpose**: Cooking history logging and retrieval
- **Responsibilities**:
  - Log cook event (date, batch size, notes, user)
  - Retrieve cook history for a recipe (chronological)
- **Key Dependencies**: Drizzle ORM, `shared/types`

### Module: `core` (cross-cutting)

- **Purpose**: Framework-level middleware and infrastructure
- **Responsibilities**:
  - Global error handler (SECURITY-15, SECURITY-09)
  - Request validation middleware (SECURITY-05 — Fastify schema validation via TypeBox)
  - Auth middleware (session validation on every request)
  - Rate limiting middleware (SECURITY-11)
  - CORS configuration (SECURITY-08)
  - HTTP security headers (SECURITY-04)
  - Structured logging (SECURITY-03)
  - Request ID / correlation ID injection
- **Key Dependencies**: Fastify plugins (@fastify/rate-limit, @fastify/cors, @fastify/helmet, etc.)

---

## Package: `apps/web` (Vite + React SPA)

### Component Group: `pages`

- **Purpose**: Route-level page components
- **Key Pages**: Login, Register, Onboarding (create/join household), Recipes List, Recipe Detail, Recipe Editor, Ingredient Library, Shopping List, Cook Mode, Household Settings, Household Switcher

### Component Group: `features`

- **Purpose**: Feature-specific UI components and hooks
- **Subgroups**: `recipes`, `ingredients`, `shopping-list`, `cook-mode`, `cook-history`, `auth`, `household`
- **Responsibilities**: Feature-specific forms, lists, cards, modals; TanStack Query hooks for API calls

### Component Group: `ui`

- **Purpose**: Shared presentational components (buttons, inputs, modals, layout)

### Component Group: `lib`

- **Purpose**: Client-side utilities — API client instance, auth helpers, wake-lock wrapper

---

## Package: `apps/mobile` (React Native / Expo)

### Component Group: `screens`

- **Purpose**: Screen-level components (analogous to web `pages`)
- **Key Screens**: Login, Register, Onboarding, Recipes, Recipe Detail, Recipe Editor, Ingredient Library, Shopping List, Cook Mode, Household Settings

### Component Group: `features`

- **Purpose**: Feature-specific UI components and hooks (mirrors web `features` where possible; shared hooks via `packages/shared`)

### Component Group: `ui`

- **Purpose**: Shared presentational components (React Native equivalents)

### Component Group: `lib`

- **Purpose**: Mobile-specific utilities — API client, secure storage for session tokens, wake-lock (expo-keep-awake)

---

## Package: `packages/shared`

### Module: `types`

- **Purpose**: TypeScript type definitions for the entire domain
- **Exports**: `Recipe`, `Ingredient`, `NutritionInfo`, `ShoppingList`, `ShoppingListItem`, `CookEvent`, `User`, `UserHousehold`, `Household`, `Unit`
- **Also**: API request/response types, error types

### Module: `schemas`

- **Purpose**: Runtime validation schemas (TypeBox or Zod) matching the type definitions
- **Exports**: `CreateRecipeSchema`, `UpdateRecipeSchema`, `CreateIngredientSchema`, `ScaleRecipeSchema`, etc.
- **Used by**: API (request validation), web/mobile (form validation)

### Module: `nutrition`

- **Purpose**: Pure functions for nutrition calculation
- **Exports**: `calculateTotalNutrition(ingredients)`, `calculatePerPortionNutrition(total, batchSize)`
- **PBT**: Invariant — `perPortion == total / batchSize`; invariant — `total == sum(ingredient.nutrition * quantity)`

### Module: `scaling`

- **Purpose**: Pure functions for recipe scaling
- **Exports**: `scaleIngredients(ingredients, fromPortions, toPortions)`, `roundQuantity(value, unit)`
- **PBT**: Invariant — ingredient count preserved; idempotency — `scale(scale(r, N), N) == scale(r, N)`; invariant — per-portion nutrition approximately stable

### Module: `shopping`

- **Purpose**: Pure functions for shopping list operations
- **Exports**: `consolidateItems(items)`, `addRecipeToList(list, recipe, batchSize)`
- **PBT**: Idempotency — `consolidate(consolidate(list)) == consolidate(list)`; invariant — total quantity preserved
