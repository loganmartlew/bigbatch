# Unit 4: Shopping — Frontend Components

## Route

`/shopping` — Shopping List page (household-scoped, requires auth + active household)

---

## Component Hierarchy

```
ShoppingPage (route component)
├── ShoppingPageHeader
│   ├── Title: "Shopping List"
│   ├── AddRecipeButton     →  opens AddRecipeModal
│   ├── AddIngredientButton →  opens AddIngredientModal
│   └── ClearListButton     →  opens ClearListModal (disabled when list is empty)
├── ShoppingListContent
│   ├── EmptyState  (when groups.length === 0)
│   └── ShoppingCategoryGroup[]  (one per group in response)
│       ├── CategoryGroupHeader  (category name + item count)
│       └── ShoppingItemRow[]
│           ├── ItemDetails  (name, inline-editable quantity + unit)
│           └── ItemActions
│               ├── TickOffButton    (toggle tickedOff)
│               ├── HaveThisButton   (toggle haveThis)
│               └── RemoveButton     (delete this item)
├── AddRecipeModal
│   ├── RecipeSearchInput  (filters recipe list)
│   ├── RecipeList  (selectable, single-select)
│   ├── BatchSizeInput  (number input, min 1, default = recipe.batchSize)
│   └── AddButton  (submit)
├── AddIngredientModal
│   ├── IngredientSearchInput  (filters ingredient list)
│   ├── IngredientList  (selectable, single-select)
│   ├── QuantityInput  (positive number, decimals allowed; pre-fills 1)
│   ├── UnitSelect  (Unit enum; pre-fills ingredient.defaultUnit)
│   └── AddButton  (submit)
└── ClearListModal  (confirmation)
```

> **Cross-cutting — existing pages (Unit 2 wiring)**: The Ingredient Library page (`/ingredients`) and Ingredient Detail page (`/ingredients/:id`) each receive an "Add to List" action button during Unit 4 implementation. These open `AddIngredientModal` pre-seeded with the selected ingredient. This wiring is added to existing Unit 2 components; it does not change their core structure.

---

## Component Details

### `ShoppingPage`

**Purpose**: Route wrapper. Fetches the shopping list and coordinates modal visibility.

**State**:

- `addRecipeModalOpen: boolean`
- `addIngredientModalOpen: boolean`
- `addIngredientPreset: { ingredientId: number } | null` — set when opened from Ingredient Library/Detail
- `clearModalOpen: boolean`
- Shopping list data from TanStack Query: `useShoppingList()`

**API integration**:

- `GET /shopping-list` via `useShoppingList()` hook
- Mutations: `useAddRecipeToList()`, `useAddIngredientToList()`, `useToggleTickedOff()`, `useToggleHaveThis()`, `useRemoveItem()`, `useUpdateItemQuantity()`, `useClearShoppingList()`

**Behavior**:

- Renders `ShoppingCategoryGroup` for each group returned by the API
- Passes `totalItems` to header for enabling/disabling Clear button

---

### `ShoppingCategoryGroup`

**Purpose**: Renders a named category section (or "Uncategorized").

**Props**:

- `categoryName: string | null` — `null` renders "Uncategorized"
- `items: ShoppingListItemEnriched[]`
- `onToggleTickedOff: (itemId: number) => void`
- `onToggleHaveThis: (itemId: number) => void`
- `onRemove: (itemId: number) => void`
- `onUpdateQuantity: (itemId: number, quantity: number) => void`

**Behavior**:

- Displays category name as section header with item count badge
- Renders a `ShoppingItemRow` for each item

---

### `ShoppingItemRow`

**Purpose**: Single shopping list item with interaction buttons.

**Props**:

- `item: ShoppingListItemEnriched`
- `onToggleTickedOff: () => void`
- `onToggleHaveThis: () => void`
- `onRemove: () => void`
- `onUpdateQuantity: (quantity: number) => void`

**Local state**:

- `editing: boolean` — whether the quantity field is in inline-edit mode
- `editValue: string` — controlled input value while editing

**Visual states**:

- Default: ingredient name bold, quantity + unit muted
- `tickedOff = true`: name struck through, row dimmed
- `haveThis = true`: "Have this" badge shown alongside name
- Both flags can be active simultaneously; both effects are shown
- `editing = true`: quantity replaced with a small number input (pre-filled with current value)

**Behavior**:

- Tick Off button: icon button (checkbox-style); calls `PATCH /shopping-list/items/:id/toggle`; optimistic update
- Have This button: icon button (home/pantry icon); calls `PATCH /shopping-list/items/:id/have-this`; optimistic update
- Remove button: icon button (trash icon); calls `DELETE /shopping-list/items/:id`; optimistic removal from cached list
- Quantity display: clicking the quantity text enters inline-edit mode; on blur or Enter submits `PATCH /shopping-list/items/:id/quantity`; Escape cancels; invalid (≤ 0) input shows field error and does not submit

---

### `AddRecipeModal`

**Purpose**: Lets the user pick a recipe and target batch size, then adds it to the shopping list.

**State**:

- `search: string` — live filter for recipe picker
- `selectedRecipeId: number | null`
- `targetBatchSize: number` — initialized to selected recipe's `batchSize` when a recipe is chosen

**Form fields**:

- Recipe search input: text, client-side filter
- Recipe list: scroll-selectable, shows recipe name + current batchSize
- Batch size input: number, min 1, integer only; pre-fills when recipe selected; validates ≥ 1
- Submit button: "Add to List" — disabled until recipe + valid batch size selected

**API integration**:

- `GET /recipes` (via existing `useRecipes()` hook, with optional search param)
- `POST /shopping-list/add-recipe` → `useAddRecipeToList()` mutation

**Behavior**:

- On submit: call `addRecipeToList({ recipeId, targetBatchSize })`
- On success: close modal, invalidate `useShoppingList()` query
- On error: display inline error (e.g., "Recipe has no ingredients")
- Modal clears state when closed

---

### `AddIngredientModal`

**Purpose**: Lets the user pick an ingredient and specify a quantity + unit, then adds it to the shopping list. Can be opened from the Shopping List page, the Ingredient Library, or the Ingredient Detail page.

**Props**:

- `opened: boolean`
- `onClose: () => void`
- `presetIngredientId?: number` — when provided (opened from Library/Detail), the ingredient picker is pre-selected and locked

**State**:

- `search: string` — live filter for ingredient picker (hidden when `presetIngredientId` is set)
- `selectedIngredientId: number | null`
- `quantity: number` — positive number; initialized to 1
- `unit: string` — initialized to selected ingredient's `defaultUnit` when ingredient chosen

**Form fields**:

- Ingredient search input: text, client-side filter (omitted when pre-seeded)
- Ingredient list: scroll-selectable; shows ingredient name + defaultUnit (omitted when pre-seeded; shows locked ingredient name instead)
- Quantity input: positive number, decimals allowed, min > 0
- Unit select: Unit enum dropdown; pre-fills `defaultUnit`, user can override
- Submit button: "Add to List" — disabled until ingredient selected + quantity valid

**API integration**:

- `GET /ingredients` (via existing `useIngredients()` hook)
- `POST /shopping-list/add-ingredient` → `useAddIngredientToList()` mutation

**Behavior**:

- On ingredient selection: `unit` resets to the ingredient's `defaultUnit`; `quantity` resets to 1
- On submit: call `addIngredientToList({ ingredientId, quantity, unit })`
- On success: close modal, invalidate `useShoppingList()` query
- Modal clears search and selection state when closed (preset is re-applied on next open)

---

### `ClearListModal`

**Purpose**: Confirms before deleting all items from the shopping list.

**Props**:

- `opened: boolean`
- `onClose: () => void`
- `onConfirm: () => void` — calls `DELETE /shopping-list`

**Content**:

- Warning text: "This will remove all items from your shopping list. This action cannot be undone."
- Cancel button
- Confirm (destructive) button: "Clear List"

---

## State Management

All server state is managed via **TanStack Query** hooks:

| Hook                     | Method | Endpoint                             | Notes                                |
| ------------------------ | ------ | ------------------------------------ | ------------------------------------ |
| `useShoppingList`        | GET    | `/shopping-list`                     | Returns `ShoppingListResponse`       |
| `useAddRecipeToList`     | POST   | `/shopping-list/add-recipe`          | Invalidates `useShoppingList`        |
| `useAddIngredientToList` | POST   | `/shopping-list/add-ingredient`      | Invalidates `useShoppingList`        |
| `useToggleTickedOff`     | PATCH  | `/shopping-list/items/:id/toggle`    | Optimistic update                    |
| `useToggleHaveThis`      | PATCH  | `/shopping-list/items/:id/have-this` | Optimistic update                    |
| `useRemoveItem`          | DELETE | `/shopping-list/items/:id`           | Optimistic removal from cached list  |
| `useUpdateItemQuantity`  | PATCH  | `/shopping-list/items/:id/quantity`  | Optimistic update; replaces quantity |
| `useClearShoppingList`   | DELETE | `/shopping-list`                     | Invalidates `useShoppingList`        |

Optimistic updates for toggle operations update the cached `ShoppingListResponse` by flipping the flag on the matching item, then reconcile on mutation settle.

---

## User Interaction Flows

### Flow 1: Add a Recipe to the Shopping List (US-17)

```
User opens /shopping
  → clicks "Add Recipe" button
  → AddRecipeModal opens
  → user types to filter recipes
  → selects a recipe (batch size pre-fills)
  → optionally changes batch size
  → clicks "Add to List"
  → POST /shopping-list/add-recipe { recipeId, targetBatchSize }
  → modal closes; list refreshes with new/increased quantities
```

### Flow 2: Tick Off an Item (US-21)

```
User sees item in list
  → clicks tick-off button (or checkbox)
  → optimistic: item visually struck through immediately
  → PATCH /shopping-list/items/:id/toggle
  → on success: confirmed; on failure: rollback optimistic state + toast error
  → clicking again un-ticks the item
```

### Flow 3: Mark "I Have This" (US-19)

```
User sees item in list
  → clicks "I have this" icon
  → optimistic: "Have this" badge appears on item immediately
  → PATCH /shopping-list/items/:id/have-this
  → on success: confirmed; on failure: rollback
  → clicking again removes the badge
```

### Flow 5: Manually Add an Ingredient from Shopping List Page

```
User opens /shopping
  → clicks "Add Ingredient" button
  → AddIngredientModal opens (no preset)
  → user types to filter ingredients
  → selects an ingredient (unit pre-fills to defaultUnit; quantity defaults to 1)
  → optionally changes quantity and/or unit
  → clicks "Add to List"
  → POST /shopping-list/add-ingredient { ingredientId, quantity, unit }
  → modal closes; list refreshes (quantity accumulated if ingredient+unit already present)
```

### Flow 6: Manually Add an Ingredient from Ingredient Library

```
User opens /ingredients
  → clicks "Add to List" on an ingredient row
  → AddIngredientModal opens pre-seeded with that ingredient
  → ingredient picker is locked to that ingredient; unit pre-fills to defaultUnit
  → user enters quantity (and optionally overrides unit)
  → clicks "Add to List"
  → POST /shopping-list/add-ingredient { ingredientId, quantity, unit }
  → modal closes; success toast
```

### Flow 7: Manually Add an Ingredient from Ingredient Detail Page

```
User opens /ingredients/:id
  → clicks "Add to List" button
  → AddIngredientModal opens pre-seeded with that ingredient
  → same flow as Flow 6 from this point
```

### Flow 8: Remove an Individual Item (US-22 extended)

```
User sees item in list
  → clicks remove (trash) icon on the row
  → optimistic: item removed from list immediately
  → DELETE /shopping-list/items/:id
  → on success: confirmed; on failure: rollback + toast error
```

### Flow 9: Edit Item Quantity Inline

```
User sees item in list
  → clicks the quantity value
  → row enters edit mode: quantity replaced with a number input pre-filled with current value
  → user types new value
  → presses Enter or blurs the field
  → if valid (> 0): PATCH /shopping-list/items/:id/quantity { quantity }
    → optimistic update; reconcile on settle
  → if invalid: input shows validation error; does not submit
  → Escape cancels without submitting
```

### Flow 4: Clear the Shopping List (US-22)

```
User clicks "Clear List" button
  → ClearListModal opens with warning
  → user clicks "Clear List" (destructive confirm)
  → DELETE /shopping-list
  → modal closes; list empties; EmptyState shown
```

---

## Form Validation

### AddRecipeModal

| Field             | Rule                            | Message                         |
| ----------------- | ------------------------------- | ------------------------------- |
| `selectedRecipe`  | Required — must select a recipe | (submit button disabled)        |
| `targetBatchSize` | Integer ≥ 1                     | "Batch size must be at least 1" |

### AddIngredientModal

| Field                | Rule                                 | Message                               |
| -------------------- | ------------------------------------ | ------------------------------------- |
| `selectedIngredient` | Required — must select an ingredient | (submit button disabled)              |
| `quantity`           | Positive number > 0, decimals OK     | "Quantity must be greater than 0"     |
| `unit`               | Required, valid Unit enum value      | (select pre-filled, always has value) |

### ShoppingItemRow inline edit

| Field      | Rule                | Message                           |
| ---------- | ------------------- | --------------------------------- |
| `quantity` | Positive number > 0 | "Quantity must be greater than 0" |

---

## Route Registration

| Path        | Component      | Guards                            |
| ----------- | -------------- | --------------------------------- |
| `/shopping` | `ShoppingPage` | Auth required, household required |
