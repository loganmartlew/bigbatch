# Unit 2: Ingredients — Code Generation Plan

## Unit Context

**Unit**: Ingredients (Unit 2)
**Scope**: Ingredient library CRUD, OpenFoodFacts search/import (with barcode camera scanning), shopping category management
**Stories**: US-07, US-08, US-09, US-10
**Dependencies**: Unit 1 (Auth & Household) — authenticated user, household membership, seeded shopping categories, core middleware (auth-guard, household-resolver, error-handler)

**Design Artifacts**: `aidlc-docs/construction/ingredients/functional-design/`

---

## Generation Steps

### Step 1: Shared Package — Ingredient & Category Schemas

- [ ] Create `packages/shared/src/schemas/ingredient.ts` — TypeBox schemas:
  - `CreateIngredientSchema` — name (string 1–200), defaultUnit (UNITS enum), calories? (number ≥ 0), protein? (number ≥ 0), carbs? (number ≥ 0), fat? (number ≥ 0), categoryId? (integer)
  - `UpdateIngredientSchema` — all fields optional (partial of Create)
  - `IngredientSchema` — full response shape
  - `OFFSearchResultSchema` — name, calories, protein, carbs, fat
- [ ] Create `packages/shared/src/schemas/shopping-category.ts` — TypeBox schemas:
  - `CreateCategorySchema` — name (string 1–100)
  - `UpdateCategorySchema` — name? (string 1–100), sortOrder? (integer)
  - `ReorderCategoriesSchema` — orderedIds (array of integers)
  - `ShoppingCategorySchema` — full response shape
- [ ] Update `packages/shared/src/schemas/index.ts` — re-export ingredient and shopping-category schemas

### Step 2: Shared Package — Type Updates

- [ ] Update `packages/shared/src/types/index.ts` — make `calories`, `protein`, `carbs`, `fat` nullable (`number | null`) on `Ingredient` type

### Step 3: Database Schema Update

- [ ] Update `apps/api/src/db/schema.ts` — remove `.notNull()` from `calories`, `protein`, `carbs`, `fat` on the `ingredients` table (make nullable)
- [ ] Generate new Drizzle migration (`pnpm db:generate`)

### Step 4: Ingredients Service Layer

- [ ] Create `apps/api/src/modules/ingredients/ingredients.service.ts`:
  - `createIngredient(householdId, data)` — validate uniqueness (case-insensitive), validate category, insert
  - `listIngredients(householdId)` — active ingredients with category, ordered by name
  - `getIngredient(householdId, ingredientId)` — single ingredient with category
  - `updateIngredient(householdId, ingredientId, data)` — partial update with uniqueness check
  - `deleteIngredient(householdId, ingredientId)` — check recipe usage, soft-delete
  - `searchOpenFoodFacts(query)` — text search or barcode lookup from OFF API

### Step 5: Shopping Categories Service Layer

- [ ] Create `apps/api/src/modules/ingredients/categories.service.ts`:
  - `listCategories(householdId)` — ordered by sortOrder
  - `createCategory(householdId, name)` — auto sort-order, isDefault=false
  - `updateCategory(householdId, categoryId, data)` — block rename of defaults
  - `deleteCategory(householdId, categoryId)` — block defaults, check usage
  - `reorderCategories(householdId, orderedIds)` — batch update sortOrder

### Step 6: Ingredients Route Handlers

- [ ] Create `apps/api/src/modules/ingredients/ingredients.routes.ts`:
  - `GET /ingredients` — list all active ingredients for household
  - `GET /ingredients/:id` — get single ingredient
  - `POST /ingredients` — create ingredient (validates body with CreateIngredientSchema)
  - `PATCH /ingredients/:id` — update ingredient (validates body with UpdateIngredientSchema)
  - `DELETE /ingredients/:id` — soft-delete ingredient
  - `GET /ingredients/search/openfoodfacts?q=` — OFF proxy search

### Step 7: Shopping Categories Route Handlers

- [ ] Create `apps/api/src/modules/ingredients/categories.routes.ts`:
  - `GET /shopping-categories` — list categories for household
  - `POST /shopping-categories` — create category
  - `PATCH /shopping-categories/:id` — update category
  - `DELETE /shopping-categories/:id` — delete category
  - `PUT /shopping-categories/reorder` — batch reorder

### Step 8: Ingredients Plugin Registration

- [ ] Create `apps/api/src/modules/ingredients/index.ts` — Fastify plugin registering ingredient + category routes
- [ ] Update `apps/api/src/index.ts` — register ingredients plugin with prefix `/ingredients` and categories with prefix `/shopping-categories`
- [ ] Update `apps/api/src/modules/core/household-resolver.ts` — add OFF search route to AUTH_ONLY_ROUTES (no household needed for search)

### Step 9: API Unit Tests

- [ ] Create `apps/api/src/modules/ingredients/__tests__/ingredients.service.test.ts`:
  - Creation validation (name uniqueness, nutrition non-negative)
  - Update with rename uniqueness
  - Deletion blocked when in use
  - Soft-delete sets deletedAt
- [ ] Create `apps/api/src/modules/ingredients/__tests__/categories.service.test.ts`:
  - Default category protection (no rename, no delete)
  - Custom category CRUD
  - Delete blocked when ingredients assigned
- [ ] Create `apps/api/src/modules/ingredients/__tests__/ingredients.pbt.test.ts`:
  - PBT-03: After editing ingredient nutrition, recipe total nutrition = sum((ingredient.macro ?? 0) \* qty / 100)

### Step 10: Web — Ingredient Feature Hooks & API

- [ ] Create `apps/web/src/features/ingredients/api.ts` — TanStack Query hooks:
  - `useIngredients()`, `useIngredient(id)`, `useCreateIngredient()`, `useUpdateIngredient()`, `useDeleteIngredient()`
  - `useOFFSearch(query)`, `useShoppingCategories()`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`, `useReorderCategories()`

### Step 11: Web — Ingredient Library Page

- [ ] Create `apps/web/src/routes/_authenticated/ingredients/index.tsx` — IngredientLibraryPage:
  - Virtual-scrolled list (`@tanstack/react-virtual`)
  - Client-side search filter
  - Ingredient list items showing name, category, nutrition summary
  - "New Ingredient" button

### Step 12: Web — Create/Edit Ingredient Pages

- [ ] Create `apps/web/src/routes/_authenticated/ingredients/new.tsx` — CreateIngredientPage:
  - React Hook Form + CreateIngredientSchema resolver
  - Name, unit, nutrition fields (optional), category select
  - OpenFoodFacts search section
- [ ] Create `apps/web/src/routes/_authenticated/ingredients/$ingredientId.edit.tsx` — EditIngredientPage:
  - Same form, pre-populated, with delete button (disabled if in use)

### Step 13: Web — OpenFoodFacts Search Component

- [ ] Create `apps/web/src/features/ingredients/components/off-search.tsx` — tabbed search UI:
  - Text search tab (debounced query)
  - Barcode input tab (manual entry)
  - Camera scan tab (BarcodeDetector API + fallback)
  - Results list with "Use this" button → pre-fills form
- [ ] Create `apps/web/src/features/ingredients/components/barcode-scanner.tsx`:
  - Camera stream + BarcodeDetector (EAN-13, EAN-8, UPC-A)
  - Permission handling + fallback message

### Step 14: Web — Category Management

- [ ] Create `apps/web/src/features/ingredients/components/category-manager.tsx`:
  - Modal/drawer with ordered list of categories
  - Add custom category
  - Rename custom categories (inline edit)
  - Delete custom categories (with in-use check)
  - Reorder (drag or up/down)
  - Default categories shown but not editable/deletable

### Step 15: Web — Route Wiring & Navigation

- [ ] Add ingredients routes to TanStack Router route tree
- [ ] Add "Ingredients" navigation link to app shell sidebar/nav
- [ ] Ensure route guards (authenticated + household selected)

### Step 16: Documentation Summary

- [ ] Create `aidlc-docs/construction/ingredients/code/code-generation-summary.md`

---

## Story Coverage

| Step      | Stories Covered                                                                |
| --------- | ------------------------------------------------------------------------------ |
| Steps 1–3 | Schema foundation for US-07, US-08, US-09, US-10                               |
| Steps 4–5 | Business logic for US-07 (create), US-09 (edit), US-10 (category), US-08 (OFF) |
| Steps 6–8 | HTTP layer for all stories                                                     |
| Step 9    | Test coverage for all stories + PBT-03                                         |
| Step 10   | Client data hooks for all stories                                              |
| Step 11   | US-07, US-09 (library view)                                                    |
| Step 12   | US-07 (create form), US-09 (edit form)                                         |
| Step 13   | US-08 (OFF search + barcode)                                                   |
| Step 14   | US-10 (category management)                                                    |
| Step 15   | Navigation and route wiring                                                    |

## File Count Estimate

| Area            | Files | Notes                                                                                                     |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------- |
| Shared new      | 2     | ingredient schemas, category schemas                                                                      |
| Shared modified | 2     | schemas/index.ts, types/index.ts                                                                          |
| API modified    | 3     | schema.ts, index.ts, household-resolver.ts                                                                |
| API new         | 5     | ingredients service, categories service, ingredient routes, category routes, plugin index                 |
| Tests new       | 3     | ingredients tests, categories tests, PBT tests                                                            |
| Web new         | 8     | hooks/api, library page, new page, edit page, OFF search, barcode scanner, category manager, route wiring |
| Migration       | 1     | Drizzle migration SQL                                                                                     |
| Docs            | 1     | code-generation-summary.md                                                                                |
| **Total**       | ~25   |                                                                                                           |
