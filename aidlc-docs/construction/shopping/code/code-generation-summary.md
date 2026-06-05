# Shopping — Code Generation Summary

**Unit:** Unit 4 — Shopping  
**Stage:** Construction → Code Generation  
**Status:** COMPLETE  
**Date:** 2025-07-01

---

## What Was Built

All 13 steps of the [shopping-code-generation-plan](../../plans/shopping-code-generation-plan.md) were executed.

### Step 1 — Shared Types (`packages/shared/src/types/index.ts`)

Added five new interfaces after `ShoppingListItem`:

- `ShoppingListItemEnriched` — item with joined ingredient + category fields
- `ShoppingListGroup` — grouped items with category metadata
- `ShoppingListResponse` — `{ groups, totalItems }` envelope
- `ItemCandidate` — `{ ingredientId, quantity, unit }` for upsert operations
- `AddIngredientToListInput` — `{ ingredientId, quantity, unit }` (manual add)

### Step 2 — Shared Schemas (`packages/shared/src/schemas/shopping-list.ts`)

New TypeBox request/response schemas:

- `AddRecipeToListSchema` — `recipeId: integer≥1, targetBatchSize: integer≥1`
- `AddIngredientToListSchema` — `ingredientId: integer≥1, quantity: number>0, unit: UnitEnum`
- `UpdateItemQuantitySchema` — `quantity: number>0`
- `ShoppingListItemEnrichedSchema`, `ShoppingListGroupSchema`, `ShoppingListResponseSchema`

`packages/shared/src/schemas/index.ts` updated to `export * from './shopping-list.js'`.

### Step 3 — Shared Utilities (`packages/shared/src/shopping.ts`)

Three pure functions exported:

- `consolidateItems(items)` — groups by `ingredientId:unit`, sums quantities
- `addRecipeToList(recipeIngredients, baseBatchSize, targetBatchSize)` — scales each ingredient by `targetBatchSize / baseBatchSize`
- `groupByCategory(items)` — groups by `categoryId` (null → "Uncategorised"), sorts groups by `sortOrder` (null last), items by name ASC case-insensitive

`packages/shared/src/index.ts` updated to `export * from './shopping.js'`.

### Step 4 — PBT Tests (`packages/shared/src/shopping.test.ts`)

Vitest + fast-check property-based tests:

- `PBT-SH-01` — `consolidateItems` idempotency (consolidating twice equals once)
- `PBT-SH-02` — total quantity preserved across consolidation
- Unit tests for `addRecipeToList` scaling and `groupByCategory` sort/coverage invariants

`fast-check ^3.23.0` added to `packages/shared` devDependencies.

**Result:** 8 tests pass.

### Step 5 — Shopping List Service (`apps/api/src/modules/shopping/shopping-list.service.ts`)

Eight operations:

| Function              | Description                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `getShoppingList`     | Fetches enriched items joined with ingredient + category, calls `groupByCategory`                                   |
| `addRecipeToList`     | Validates recipe + household, scales ingredients, upserts via `ON CONFLICT DO UPDATE quantity += excluded.quantity` |
| `addIngredientToList` | Validates ingredient + household, upserts single candidate                                                          |
| `toggleTickedOff`     | Flips boolean, re-fetches enriched item                                                                             |
| `toggleHaveThis`      | Flips boolean, re-fetches enriched item                                                                             |
| `removeItem`          | Validates ownership, then deletes                                                                                   |
| `updateItemQuantity`  | Validates ownership + quantity > 0, then updates                                                                    |
| `clearShoppingList`   | Deletes all items for household                                                                                     |

Uses the `(householdId, ingredientId, unit)` unique index on `shopping_list_items` for upserts.

### Step 6 — Shopping List Routes (`apps/api/src/modules/shopping/shopping-list.routes.ts`)

Eight routes:

| Method | Path                                 | Description           |
| ------ | ------------------------------------ | --------------------- |
| GET    | `/shopping-list`                     | Get grouped list      |
| POST   | `/shopping-list/add-recipe`          | Add recipe (scaled)   |
| POST   | `/shopping-list/add-ingredient`      | Add single ingredient |
| PATCH  | `/shopping-list/items/:id/toggle`    | Toggle ticked-off     |
| PATCH  | `/shopping-list/items/:id/have-this` | Toggle have-this      |
| PATCH  | `/shopping-list/items/:id/quantity`  | Update quantity       |
| DELETE | `/shopping-list/items/:id`           | Remove item           |
| DELETE | `/shopping-list`                     | Clear entire list     |

### Step 7 — Plugin Registration

- Created `apps/api/src/modules/shopping/index.ts` exporting `shoppingPlugin`
- Registered `await server.register(shoppingPlugin)` in `apps/api/src/index.ts` after `recipesPlugin`

### Step 8 — API Route Tests (`apps/api/src/modules/shopping/__tests__/shopping-list.routes.test.ts`)

17 route tests using Vitest + Fastify inject + vi.mock:

- GET: returns grouped list
- POST add-recipe: success, 400 invalid body, 404 not found, 409 no ingredients
- POST add-ingredient: success, 404 not found, 400 invalid quantity
- PATCH toggle: success, 404 not found
- PATCH have-this: success
- PATCH quantity: success, 400 invalid, 404 not found
- DELETE item: success, 404 not found
- DELETE list: success

**Result:** 17/17 pass. Full API suite: 73 tests pass.

### Step 9 — Web Query Layer + View Model (`apps/web/src/features/shopping/`)

The Shopping web slice now includes a feature-local query layer and a small pure view model:

- `useShoppingList` — query with `['shopping-list', hhId]` key
- `useAddRecipeToList` — mutation, stores returned response in cache
- `useAddIngredientToList` — mutation, stores returned response in cache
- `useToggleTickedOff` — optimistic cache update + invalidate-on-settle
- `useToggleHaveThis` — optimistic cache update + invalidate-on-settle
- `useRestoreShoppingItem` — optimistic restore for done items, implemented without backend contract changes
- `useUpdateItemQuantity` — updates cached item after success
- `useRemoveItem` — optimistic removal + invalidate-on-settle
- `useClearShoppingList` — clears cached list after success
- `model.ts` — derives active groups vs done items and provides cache update helpers

### Step 10 — Shopping List Page (`apps/web/src/routes/shopping/index.tsx`)

The Shopping route is now a thin entry point that delegates to feature components under `apps/web/src/features/shopping/components/`.

Current UI includes:

- `shopping-page.tsx` — page shell with header actions, empty state, active-list-empty state, and modal orchestration
- `shopping-category-group.tsx` — grouped active items by shopping category
- `shopping-item-row.tsx` — checkbox tick-off, inline quantity edit, three-dot menu, and mobile swipe affordances
- `shopping-done-section.tsx` + `shopping-done-item-row.tsx` — dedicated Done area with Restore buttons
- `shopping-item-actions-menu.tsx` — Mantine menu for `Mark as have it` and `Delete item`
- `shopping-swipe-row.tsx` — mobile coarse-pointer swipe wrapper (right swipe reveals `Have it`, left swipe reveals `Delete`)
- TanStack Router file-based route at `/shopping/`

### Step 11 — AddIngredientModal (`apps/web/src/features/shopping/components/add-ingredient-modal.tsx`)

Modal props:

- `opened`, `onClose` — standard modal control
- `presetIngredientId?: number` — locks ingredient picker when provided (used from ingredient pages)

Form fields: ingredient Select (searchable, hidden when preset), quantity NumberInput, unit Select. The modal now lives under the Shopping feature `components/` folder and uses shared `UNITS` from `@bigbatch/shared` instead of a duplicated local list.

### Step 12 — Wire "Add to List" in Ingredient Pages (`apps/web/src/routes/ingredients/index.tsx`, `apps/web/src/routes/ingredients/$ingredientId.edit.tsx`)

- Ingredient Library: shopping cart `ActionIcon` on each ingredient row opens the Shopping modal with `presetIngredientId`
- Ingredient Detail/Edit page: added `Add to List` button in the page actions and rendered the same modal with `presetIngredientId`

### Step 13 — Nav, Route Tree, Typecheck, Tests, Summary

- Added "Shopping" nav button in `apps/web/src/routes/__root.tsx` after "Recipes"
- `routeTree.gen.ts` regenerated via `vite build` — `/shopping/` route registered
- Initial implementation validation: `pnpm typecheck` and `pnpm test` passed across the monorepo
- Remediation validation: `pnpm --filter @bigbatch/web typecheck` and `pnpm --filter @bigbatch/web test` passed (`19` web tests)

---

## Files Created

| File                                                                   | Purpose                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `packages/shared/src/schemas/shopping-list.ts`                         | TypeBox request/response schemas                                      |
| `packages/shared/src/shopping.ts`                                      | Pure shopping utility functions                                       |
| `packages/shared/src/shopping.test.ts`                                 | PBT + unit tests for utilities                                        |
| `apps/api/src/modules/shopping/shopping-list.service.ts`               | 8 service operations                                                  |
| `apps/api/src/modules/shopping/shopping-list.routes.ts`                | 8 Fastify routes                                                      |
| `apps/api/src/modules/shopping/index.ts`                               | Plugin export                                                         |
| `apps/api/src/modules/shopping/__tests__/shopping-list.routes.test.ts` | 17 route tests                                                        |
| `apps/web/src/features/shopping/api.ts`                                | 8 TanStack Query hooks                                                |
| `apps/web/src/features/shopping/model.ts`                              | Shopping view model + cache helpers                                   |
| `apps/web/src/features/shopping/model.test.ts`                         | Web tests for active/done derivation and cache helpers                |
| `apps/web/src/features/shopping/components/*`                          | Extracted shopping page, row, menu, modal, done section, and swipe UI |
| `apps/web/src/routes/shopping/index.tsx`                               | Shopping List page                                                    |

## Files Modified

| File                                                     | Change                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| `packages/shared/src/types/index.ts`                     | +5 interfaces                                   |
| `packages/shared/src/schemas/index.ts`                   | +export shopping-list                           |
| `packages/shared/src/index.ts`                           | +export shopping                                |
| `packages/shared/package.json`                           | +fast-check devDependency                       |
| `apps/api/src/index.ts`                                  | +shoppingPlugin registration                    |
| `apps/web/src/features/shopping/api.ts`                  | +optimistic toggle/remove/restore cache updates |
| `apps/web/src/routes/ingredients/index.tsx`              | +Add to List button + modal                     |
| `apps/web/src/routes/ingredients/$ingredientId.edit.tsx` | +Add to List button + modal                     |
| `apps/web/src/routes/__root.tsx`                         | +Shopping nav button                            |
| `apps/web/src/routeTree.gen.ts`                          | Regenerated (auto)                              |

---

## Key Design Decisions

- **UPSERT pattern**: `INSERT … ON CONFLICT (householdId, ingredientId, unit) DO UPDATE SET quantity += excluded.quantity` — adding a recipe or ingredient that already exists accumulates quantity rather than replacing it.
- **No new migrations**: The `shopping_list_items` table and its unique index pre-existed from Unit 1 foundation schema.
- **Service re-fetch after mutation**: Toggle and update operations re-fetch the enriched item after the update to return consistent response data.
- **`AddIngredientModal` preset mode**: When `presetIngredientId` is provided, the ingredient picker is hidden and replaced by a text display; the modal is usable from both the Shopping page (free-form) and Ingredient pages (preset).
- **Done area is client-derived**: The backend response shape stayed unchanged. The web feature derives `activeGroups` vs `doneItems` from `tickedOff` and `haveThis` locally.
- **Restore semantics**: Restore clears all done flags (`tickedOff`, `haveThis`) so the item deterministically returns to the active list.
- **Action density split by device**: Desktop retains a three-dot menu for `Have it` and `Delete`, while mobile coarse-pointer devices also get swipe-to-reveal actions for the same operations.
