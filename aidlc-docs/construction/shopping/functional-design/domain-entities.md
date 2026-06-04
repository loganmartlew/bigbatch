# Unit 4: Shopping — Domain Entities

## Core Entities

### ShoppingListItem (persisted)

Stored in `shopping_list_items`. One row per **(householdId, ingredientId, unit)** — the DB unique index enforces this consolidation constraint.

| Field          | Type    | Notes                                                    |
| -------------- | ------- | -------------------------------------------------------- |
| `id`           | integer | PK, auto-increment                                       |
| `householdId`  | integer | FK → households.id                                       |
| `ingredientId` | integer | FK → ingredients.id                                      |
| `quantity`     | real    | Accumulated quantity; always > 0                         |
| `unit`         | string  | Mirrors ingredient unit used in recipe (the `Unit` enum) |
| `tickedOff`    | boolean | In-cart / bought; default false                          |
| `haveThis`     | boolean | Already owned at home; default false                     |
| `createdAt`    | string  | ISO datetime                                             |

### ShoppingListItemEnriched (API response shape)

Extends the persisted row with joined ingredient and category data. Used in all API responses for the shopping list.

| Field                   | Type           | Notes                                |
| ----------------------- | -------------- | ------------------------------------ |
| `id`                    | number         |                                      |
| `householdId`           | number         |                                      |
| `ingredientId`          | number         |                                      |
| `ingredientName`        | string         | From `ingredients.name`              |
| `ingredientDefaultUnit` | string         | From `ingredients.defaultUnit`       |
| `categoryId`            | number \| null | From `ingredients.categoryId`        |
| `categoryName`          | string \| null | From `shopping_categories.name`      |
| `categorySortOrder`     | number \| null | From `shopping_categories.sortOrder` |
| `quantity`              | number         |                                      |
| `unit`                  | string         |                                      |
| `tickedOff`             | boolean        |                                      |
| `haveThis`              | boolean        |                                      |
| `createdAt`             | string         |                                      |

### ShoppingListGroup (grouping view model)

Used by the `groupByCategory` shared utility and the API `GET /shopping-list` response.

| Field          | Type                       | Notes                                                           |
| -------------- | -------------------------- | --------------------------------------------------------------- |
| `categoryId`   | number \| null             | `null` → Uncategorized group                                    |
| `categoryName` | string \| null             | `null` → Uncategorized group                                    |
| `sortOrder`    | number                     | Category `sortOrder`; uncategorized group sorts last (Infinity) |
| `items`        | ShoppingListItemEnriched[] | Items in this category, ordered by ingredient name              |

### ShoppingListResponse (full API response)

Returned by `GET /shopping-list`.

| Field        | Type                | Notes                                          |
| ------------ | ------------------- | ---------------------------------------------- |
| `groups`     | ShoppingListGroup[] | Ordered by `sortOrder` ASC; uncategorized last |
| `totalItems` | number              | Count of all items across all groups           |

---

## Utility Input Types (packages/shared)

### ItemCandidate

Minimal shape used as input and output of `consolidateItems`, `addRecipeToList`, and `addIngredientToList`.

```ts
interface ItemCandidate {
  ingredientId: number;
  quantity: number;
  unit: string;
}
```

### AddIngredientToListInput

Request body shape for the manual add-ingredient API endpoint.

```ts
interface AddIngredientToListInput {
  ingredientId: number; // must exist, active, same household
  quantity: number; // any positive number; decimals allowed
  unit: string; // any Unit enum value; defaults to ingredient.defaultUnit in UI
}
```

---

## Entity Relationships

```
Household ──< ShoppingListItem >── Ingredient ──> ShoppingCategory
                  (1 row per householdId + ingredientId + unit)
```

- A household's shopping list is the full set of `ShoppingListItem` rows for that `householdId`.
- Each item references exactly one `Ingredient` (which may reference a `ShoppingCategory`).
- Items with no category on their ingredient are "Uncategorized" in the grouped view.
- Shopping categories are household-scoped (same `shoppingCategories` table used by the ingredient library).

---

## State Flags: tickedOff vs haveThis

These are **independent, coexisting states** on each item:

| Flag        | Meaning                                    | Visual treatment       |
| ----------- | ------------------------------------------ | ---------------------- |
| `tickedOff` | Item placed in cart / physically purchased | Strikethrough + dimmed |
| `haveThis`  | Item already owned at home, won't buy      | Different badge/icon   |

Both flags remain visible in the list. Neither flag hides or removes the item — only "Clear" removes items.

---

## Key Invariants

1. At most **one** `ShoppingListItem` per `(householdId, ingredientId, unit)` — enforced by DB unique index.
2. `quantity` is always **> 0**; the upsert adds quantities, and inline quantity edits must also enforce > 0.
3. The grouped view always contains **every** item in exactly **one** group — named category or "Uncategorized".
4. "Clear" removes **all** items for the household, regardless of flag state.
5. Individual items can be removed via `DELETE /shopping-list/items/:id` without affecting other items.
6. Inline quantity edits via `PATCH /shopping-list/items/:id/quantity` replace (not accumulate) the stored quantity.
