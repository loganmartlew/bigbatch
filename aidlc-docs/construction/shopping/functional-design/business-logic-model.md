# Unit 4: Shopping — Business Logic Model

## Shared Utilities (`packages/shared`)

### `consolidateItems(items: ItemCandidate[]): ItemCandidate[]`

Pure function. Groups input by `(ingredientId, unit)` key and sums quantities within each group.

```text
Input:  ItemCandidate[] — may contain duplicate (ingredientId, unit) pairs
Output: ItemCandidate[] — one entry per unique (ingredientId, unit) pair, quantities summed

1. Build a Map keyed by `${ingredientId}:${unit}`
2. For each item:
   a. If key exists in Map: accumulated.quantity += item.quantity
   b. Else: Map.set(key, { ...item })
3. Return Array.from(map.values())
```

**PBT invariants**:

- **Idempotency**: `consolidateItems(consolidateItems(x))` is equivalent to `consolidateItems(x)` (same keys and quantities, order may vary)
- **Quantity preservation**: For each `(ingredientId, unit)` key, the sum of quantities in the output equals the sum of all input quantities sharing that key

---

### `addRecipeToList(recipeIngredients, baseBatchSize, targetBatchSize): ItemCandidate[]`

Pure function. Scales recipe ingredient quantities for a target batch and returns candidates ready for consolidation.

```text
Input:
  recipeIngredients: { ingredientId: number; quantity: number; unit: string }[]
  baseBatchSize: number  (the recipe's stored batchSize)
  targetBatchSize: number  (user's chosen batch size)

Output: ItemCandidate[]

1. scaleFactor = targetBatchSize / baseBatchSize
2. For each ingredient:
   a. scaledQuantity = ingredient.quantity * scaleFactor
   b. Yield { ingredientId, quantity: scaledQuantity, unit: ingredient.unit }
3. Return resulting array (NOT yet consolidated — caller consolidates)
```

---

### `groupByCategory(items: ShoppingListItemEnriched[]): ShoppingListGroup[]`

Pure function. Partitions enriched items into category groups, sorted by `categorySortOrder`.

```text
Input:  ShoppingListItemEnriched[]
Output: ShoppingListGroup[]

1. Build a Map<categoryId|null, ShoppingListGroup>
2. For each item:
   a. key = item.categoryId ?? null
   b. If group not in Map: Map.set(key, {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        sortOrder: item.categorySortOrder ?? Infinity,  // uncategorized sorts last
        items: []
      })
   c. Map.get(key).items.push(item)
3. For each group: sort items by ingredientName ASC (case-insensitive)
4. Sort groups by sortOrder ASC (Infinity = uncategorized last)
5. Return Array.from(map.values())
```

---

## API Service: `shopping-list.service.ts`

### Operation: `getShoppingList`

**Route**: `GET /shopping-list`  
**Input**: `householdId`  
**Output**: `ShoppingListResponse`

```text
1. SELECT shopping_list_items
     JOIN ingredients ON ingredients.id = shopping_list_items.ingredient_id
     LEFT JOIN shopping_categories ON shopping_categories.id = ingredients.category_id
   WHERE shopping_list_items.household_id = :householdId
   ORDER BY shopping_list_items.created_at ASC

2. Map rows to ShoppingListItemEnriched[]

3. Call groupByCategory(items) → ShoppingListGroup[]

4. Return { data: { groups, totalItems: items.length } }
```

---

### Operation: `addRecipeToList`

**Route**: `POST /shopping-list/add-recipe`  
**Input**: `householdId`, `{ recipeId, targetBatchSize }`  
**Output**: `ShoppingListResponse` (full refreshed list)

```text
1. Fetch recipe: SELECT * FROM recipes WHERE id = :recipeId AND householdId = :householdId AND deletedAt IS NULL
2. If not found → NotFoundError("Recipe not found")

3. Fetch recipe ingredients:
   SELECT recipe_ingredients WHERE recipeId = :recipeId

4. If no ingredients → ConflictError("Recipe has no ingredients; cannot add to list")

5. Call addRecipeToList(recipeIngredients, recipe.batchSize, targetBatchSize) → candidates[]

6. For each candidate: UPSERT into shopping_list_items:
   INSERT INTO shopping_list_items (household_id, ingredient_id, quantity, unit, ticked_off, have_this)
   VALUES (:householdId, :ingredientId, :quantity, :unit, false, false)
   ON CONFLICT (household_id, ingredient_id, unit)
   DO UPDATE SET quantity = shopping_list_items.quantity + excluded.quantity

7. Return getShoppingList(householdId)
```

---

### Operation: `toggleTickedOff`

**Route**: `PATCH /shopping-list/items/:id/toggle`  
**Input**: `householdId`, `itemId`  
**Output**: `ShoppingListItemEnriched`

```text
1. Fetch item: SELECT * FROM shopping_list_items WHERE id = :id AND household_id = :householdId
2. If not found → NotFoundError
3. UPDATE shopping_list_items SET ticked_off = NOT ticked_off WHERE id = :id
4. Return refreshed enriched item
```

---

### Operation: `toggleHaveThis`

**Route**: `PATCH /shopping-list/items/:id/have-this`  
**Input**: `householdId`, `itemId`  
**Output**: `ShoppingListItemEnriched`

```text
1. Fetch item: SELECT * FROM shopping_list_items WHERE id = :id AND household_id = :householdId
2. If not found → NotFoundError
3. UPDATE shopping_list_items SET have_this = NOT have_this WHERE id = :id
4. Return refreshed enriched item
```

---

### Operation: `addIngredientToList`

**Route**: `POST /shopping-list/add-ingredient`  
**Input**: `householdId`, `{ ingredientId, quantity, unit }`  
**Output**: `ShoppingListResponse` (full refreshed list)

```text
1. Validate quantity > 0 (any positive number, decimals allowed)
2. Validate unit ∈ Unit enum
3. Fetch ingredient: SELECT * FROM ingredients WHERE id = :ingredientId AND householdId = :householdId AND deletedAt IS NULL
4. If not found → NotFoundError("Ingredient not found")

5. UPSERT into shopping_list_items:
   INSERT INTO shopping_list_items (household_id, ingredient_id, quantity, unit, ticked_off, have_this)
   VALUES (:householdId, :ingredientId, :quantity, :unit, false, false)
   ON CONFLICT (household_id, ingredient_id, unit)
   DO UPDATE SET quantity = shopping_list_items.quantity + excluded.quantity

6. Return getShoppingList(householdId)
```

---

### Operation: `removeItem`

**Route**: `DELETE /shopping-list/items/:id`  
**Input**: `householdId`, `itemId`  
**Output**: `void` (204)

```text
1. Fetch item: SELECT * FROM shopping_list_items WHERE id = :id AND household_id = :householdId
2. If not found → NotFoundError
3. DELETE FROM shopping_list_items WHERE id = :id
4. Return 204 No Content
```

---

### Operation: `updateItemQuantity`

**Route**: `PATCH /shopping-list/items/:id/quantity`  
**Input**: `householdId`, `itemId`, `{ quantity }`  
**Output**: `ShoppingListItemEnriched`

```text
1. Validate quantity > 0
2. Fetch item: SELECT * FROM shopping_list_items WHERE id = :id AND household_id = :householdId
3. If not found → NotFoundError
4. UPDATE shopping_list_items SET quantity = :quantity WHERE id = :id
5. Return refreshed enriched item
```

---

### Operation: `clearShoppingList`

**Route**: `DELETE /shopping-list`  
**Input**: `householdId`  
**Output**: `void` (204)

```text
1. DELETE FROM shopping_list_items WHERE household_id = :householdId
2. Return 204 No Content
```

---

## Data Flow Diagrams

### Add Recipe to Shopping List

```
POST /shopping-list/add-recipe { recipeId, targetBatchSize }
  → resolve household (X-Household-Id)
  → validate body (AddRecipeToListSchema)
  → fetch recipe + ingredients (validate householdId, deletedAt)
  → addRecipeToList(ingredients, recipe.batchSize, targetBatchSize) → candidates[]
  → for each candidate: UPSERT (sum quantities on conflict)
  → getShoppingList(householdId) → ShoppingListResponse
  → return { data: ShoppingListResponse }
```

### Get Shopping List (Grouped)

```
GET /shopping-list
  → resolve household
  → SELECT items JOIN ingredients LEFT JOIN categories
  → map to ShoppingListItemEnriched[]
  → groupByCategory() → ShoppingListGroup[]
  → return { data: { groups, totalItems } }
```

### Toggle Item Flag

```
PATCH /shopping-list/items/:id/toggle  (or /have-this)
  → resolve household
  → fetch item (must belong to household)
  → flip boolean flag
  → return { data: enrichedItem }
```

### Add Ingredient Manually

```
POST /shopping-list/add-ingredient { ingredientId, quantity, unit }
  → resolve household
  → validate body (AddIngredientToListSchema)
  → fetch ingredient (validate householdId, deletedAt)
  → UPSERT (sum quantities on conflict)
  → getShoppingList(householdId) → ShoppingListResponse
  → return { data: ShoppingListResponse }
```

### Remove Individual Item

```
DELETE /shopping-list/items/:id
  → resolve household
  → fetch item (must belong to household)
  → DELETE row
  → 204 No Content
```

### Update Item Quantity (Inline Edit)

```
PATCH /shopping-list/items/:id/quantity { quantity }
  → resolve household
  → validate quantity > 0
  → fetch item (must belong to household)
  → UPDATE quantity
  → return { data: enrichedItem }
```

### Clear List

```
DELETE /shopping-list
  → resolve household
  → DELETE all items for household
  → 204 No Content
```
