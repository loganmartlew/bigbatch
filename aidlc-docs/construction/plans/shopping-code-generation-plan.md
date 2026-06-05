# Unit 4: Shopping — Code Generation Plan

## Unit Context

**Unit**: Shopping (Unit 4)
**Scope**: Shopping list generation from recipes, manual ingredient add, consolidation, tick-off, "I have this", individual item remove/edit, grouping by category, clear
**Stories**: US-17, US-18, US-19, US-20, US-21, US-22
**Dependencies**: Unit 2 (Ingredients) and Unit 3 (Recipes) fully implemented

**Functional Design Artifacts**: `aidlc-docs/construction/shopping/functional-design/`

---

## Pre-conditions

- `shopping_list_items` and `shopping_categories` tables exist in DB schema — **no migration needed**
- `ShoppingListItem` base type exists in `packages/shared/src/types/index.ts` — needs enriched types added
- `shopping-category.ts` schemas exist in `packages/shared/src/schemas/` — no changes needed
- No `shopping-list` API module exists yet — fully greenfield
- No shopping-related web routes exist yet — fully greenfield
- Ingredient Library and Ingredient Detail pages exist (Unit 2) — need "Add to List" button wired in

---

## Steps

- [x] **Step 1**: Shared types — add `ShoppingListItemEnriched`, `ShoppingListGroup`, `ShoppingListResponse`, `ItemCandidate`, `AddIngredientToListInput` to `packages/shared/src/types/index.ts`
- [x] **Step 2**: Shared schemas — create `packages/shared/src/schemas/shopping-list.ts` with `AddRecipeToListSchema`, `AddIngredientToListSchema`, `UpdateItemQuantitySchema`, `ShoppingListItemEnrichedSchema`, `ShoppingListResponseSchema`; re-export from `packages/shared/src/schemas/index.ts`
- [x] **Step 3**: Shared utilities — create `packages/shared/src/shopping.ts` with `consolidateItems`, `addRecipeToList`, `groupByCategory`; export from `packages/shared/src/index.ts`
- [x] **Step 4**: PBT tests for shared utilities — create `packages/shared/src/shopping.test.ts` with fast-check invariants
- [x] **Step 5**: Shopping list service — create `apps/api/src/modules/shopping/shopping-list.service.ts` with all 7 service operations
- [x] **Step 6**: Shopping list routes — create `apps/api/src/modules/shopping/shopping-list.routes.ts` with all 8 endpoints
- [x] **Step 7**: Plugin registration — create `apps/api/src/modules/shopping/index.ts`; register in `apps/api/src/index.ts`
- [x] **Step 8**: API route tests — create `apps/api/src/modules/shopping/__tests__/shopping-list.routes.test.ts`
- [x] **Step 9**: Web TanStack Query hooks — create `apps/web/src/features/shopping/api.ts`
- [x] **Step 10**: Shopping List page — create `apps/web/src/routes/shopping/index.tsx` with full grouped UI
- [x] **Step 11**: Add Ingredient Modal component — create `apps/web/src/features/shopping/AddIngredientModal.tsx`
- [x] **Step 12**: Wire "Add to List" into existing Ingredient pages (Unit 2 touch)
- [x] **Step 13**: Route registration, nav link, typecheck, and code generation summary

---

## Step Details

### Step 1: Shared types

**File**: `packages/shared/src/types/index.ts`

Update `ShoppingListItem` to add enriched fields, or extend via new interfaces:

```ts
// Update existing ShoppingListItem — add optional enrichment fields, OR keep raw and add separate:

export interface ShoppingListItemEnriched {
  id: number;
  householdId: number;
  ingredientId: number;
  ingredientName: string;
  ingredientDefaultUnit: string;
  categoryId: number | null;
  categoryName: string | null;
  categorySortOrder: number | null;
  quantity: number;
  unit: string;
  tickedOff: boolean;
  haveThis: boolean;
  createdAt: string;
}

export interface ShoppingListGroup {
  categoryId: number | null;
  categoryName: string | null;
  sortOrder: number;
  items: ShoppingListItemEnriched[];
}

export interface ShoppingListResponse {
  groups: ShoppingListGroup[];
  totalItems: number;
}

export interface ItemCandidate {
  ingredientId: number;
  quantity: number;
  unit: string;
}
```

---

### Step 2: Shared schemas

**New file**: `packages/shared/src/schemas/shopping-list.ts`

```ts
AddRecipeToListSchema:
  recipeId: integer > 0
  targetBatchSize: integer >= 1

AddIngredientToListSchema:
  ingredientId: integer > 0
  quantity: number > 0
  unit: string (Unit enum values)

UpdateItemQuantitySchema:
  quantity: number > 0

ShoppingListItemEnrichedSchema: full response shape (mirrors type)

ShoppingListResponseSchema:
  groups: array of ShoppingListGroupSchema
  totalItems: integer
```

**Update**: `packages/shared/src/schemas/index.ts` — add `export * from './shopping-list.js'`

---

### Step 3: Shared utilities

**New file**: `packages/shared/src/shopping.ts`

```ts
export function consolidateItems(items: ItemCandidate[]): ItemCandidate[];
// Groups by `${ingredientId}:${unit}`, sums quantities

export function addRecipeToList(
  recipeIngredients: { ingredientId: number; quantity: number; unit: string }[],
  baseBatchSize: number,
  targetBatchSize: number,
): ItemCandidate[];
// Scales quantities by (targetBatchSize / baseBatchSize)

export function groupByCategory(
  items: ShoppingListItemEnriched[],
): ShoppingListGroup[];
// Partitions by categoryId; sorts groups by sortOrder (null → Infinity); sorts items within group by ingredientName ASC
```

**Update**: `packages/shared/src/index.ts` — add `export * from './shopping.js'`

---

### Step 4: PBT tests for shared utilities

**New file**: `packages/shared/src/shopping.test.ts`

Tests using Vitest + fast-check:

- **PBT-SH-01 — Idempotency**: For any `ItemCandidate[]`, `consolidateItems(consolidateItems(x))` deep-equals `consolidateItems(x)` (keys and quantities, order-insensitive)
- **PBT-SH-02 — Quantity preservation**: For any `ItemCandidate[]`, for each unique `(ingredientId, unit)` key, the output quantity equals the sum of all input quantities for that key
- **Unit test**: `addRecipeToList` scales correctly (scaleFactor = targetBatchSize / baseBatchSize applied to each quantity)
- **Unit test**: `groupByCategory` — all input items appear in exactly one group; groups are sorted by sortOrder; uncategorized (null) group is last

---

### Step 5: Shopping list service

**New file**: `apps/api/src/modules/shopping/shopping-list.service.ts`

Implements all 7 operations from the functional design:

| Function              | Route               | Key logic                                                              |
| --------------------- | ------------------- | ---------------------------------------------------------------------- |
| `getShoppingList`     | GET                 | JOIN ingredients + categories; call `groupByCategory`                  |
| `addRecipeToList`     | POST add-recipe     | Validate recipe exists + has ingredients; scale; UPSERT each candidate |
| `addIngredientToList` | POST add-ingredient | Validate ingredient; UPSERT                                            |
| `toggleTickedOff`     | PATCH toggle        | Flip `tickedOff`                                                       |
| `toggleHaveThis`      | PATCH have-this     | Flip `haveThis`                                                        |
| `removeItem`          | DELETE item         | DELETE single row                                                      |
| `updateItemQuantity`  | PATCH quantity      | Validate > 0; replace quantity                                         |
| `clearShoppingList`   | DELETE list         | DELETE all rows for household                                          |

All mutations validate household ownership on item fetches. All return enriched shapes or 204.

---

### Step 6: Shopping list routes

**New file**: `apps/api/src/modules/shopping/shopping-list.routes.ts`

| Method | Path                               | Handler             |
| ------ | ---------------------------------- | ------------------- |
| GET    | /shopping-list                     | getShoppingList     |
| POST   | /shopping-list/add-recipe          | addRecipeToList     |
| POST   | /shopping-list/add-ingredient      | addIngredientToList |
| PATCH  | /shopping-list/items/:id/toggle    | toggleTickedOff     |
| PATCH  | /shopping-list/items/:id/have-this | toggleHaveThis      |
| PATCH  | /shopping-list/items/:id/quantity  | updateItemQuantity  |
| DELETE | /shopping-list/items/:id           | removeItem          |
| DELETE | /shopping-list                     | clearShoppingList   |

All routes require auth guard + household resolver. Body validation via TypeBox schemas. Thin handlers delegating to service.

---

### Step 7: Plugin registration

**New file**: `apps/api/src/modules/shopping/index.ts`

- Export `shoppingPlugin` wrapping routes with prefix `/`

**Update**: `apps/api/src/index.ts`

- Register `shoppingPlugin` after `recipesPlugin`

---

### Step 8: API route tests

**New file**: `apps/api/src/modules/shopping/__tests__/shopping-list.routes.test.ts`

Coverage targets:

- `GET /shopping-list` — empty list; grouped list with categories; uncategorized item
- `POST /shopping-list/add-recipe` — success (quantities sum); recipe not found; recipe has no ingredients; invalid targetBatchSize
- `POST /shopping-list/add-ingredient` — success; ingredient not found; invalid quantity
- `PATCH /shopping-list/items/:id/toggle` — flips false→true→false; item not found
- `PATCH /shopping-list/items/:id/have-this` — flips flag; item not found
- `PATCH /shopping-list/items/:id/quantity` — valid update; quantity ≤ 0 rejected
- `DELETE /shopping-list/items/:id` — success; item not found
- `DELETE /shopping-list` — clears all items; idempotent on empty list

---

### Step 9: Web TanStack Query hooks

**New file**: `apps/web/src/features/shopping/api.ts`

```ts
useShoppingList(); // GET /shopping-list
useAddRecipeToList(); // POST /shopping-list/add-recipe
useAddIngredientToList(); // POST /shopping-list/add-ingredient
useToggleTickedOff(); // PATCH /shopping-list/items/:id/toggle
useToggleHaveThis(); // PATCH /shopping-list/items/:id/have-this
useUpdateItemQuantity(); // PATCH /shopping-list/items/:id/quantity
useRemoveItem(); // DELETE /shopping-list/items/:id
useClearShoppingList(); // DELETE /shopping-list
```

- Toggle mutations use optimistic updates (flip flag in cached `ShoppingListResponse`, roll back on error).
- `useRemoveItem` uses optimistic removal from the cached list.
- `useUpdateItemQuantity` uses optimistic quantity replace.
- `useAddRecipeToList`, `useAddIngredientToList`, `useClearShoppingList` invalidate `useShoppingList` on success.

---

### Step 10: Shopping List page

**New file**: `apps/web/src/routes/shopping/index.tsx`

Structure follows the component hierarchy in `frontend-components.md`:

- `ShoppingPageHeader` with "Add Recipe", "Add Ingredient", and "Clear List" buttons
- `ShoppingCategoryGroup` per group (category name + item count badge)
- `ShoppingItemRow` with inline-editable quantity, tick-off, have-this badge, remove button
- `AddRecipeModal` — recipe search + batch size input
- `AddIngredientModal` (imported from features/shopping)
- `ClearListModal` — confirmation dialog
- `EmptyState` when `totalItems === 0`

---

### Step 11: AddIngredientModal component

**New file**: `apps/web/src/features/shopping/AddIngredientModal.tsx`

Props:

```ts
interface AddIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  presetIngredientId?: number;
}
```

- When `presetIngredientId` is supplied: ingredient picker is hidden; ingredient name shown as static text; unit pre-fills to that ingredient's `defaultUnit`
- Quantity input: number, positive, decimals allowed; defaults to 1
- Unit select: `Unit` enum values; pre-fills `defaultUnit`; user can override
- On submit: `useAddIngredientToList()` → close + invalidate shopping list query

---

### Step 12: Wire "Add to List" into existing Ingredient pages

**Touch files** (Unit 2 existing code):

- `apps/web/src/routes/ingredients/index.tsx` — add an "Add to List" icon button per ingredient row; opens `AddIngredientModal` with `presetIngredientId`
- `apps/web/src/routes/ingredients/$ingredientId.tsx` (or equivalent detail route) — add "Add to List" button; opens `AddIngredientModal` with `presetIngredientId`

Both open the same `AddIngredientModal` component exported from `features/shopping`.

---

### Step 13: Route registration, nav, typecheck, summary

- Add `/shopping` route file under `apps/web/src/routes/shopping/` (TanStack Router file-based)
- Regenerate route tree: `pnpm --filter @bigbatch/web exec tsr generate` (or build)
- Add "Shopping" link to nav sidebar/header
- Run `pnpm typecheck` and `pnpm test` — fix any issues
- Create `aidlc-docs/construction/shopping/code/code-generation-summary.md`
