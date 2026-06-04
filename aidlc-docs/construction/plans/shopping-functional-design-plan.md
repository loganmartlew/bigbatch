# Unit 4: Shopping — Functional Design Plan

## Unit Context

**Unit**: Shopping (Unit 4)
**Scope**: Shopping list generation from recipes, consolidation, tick-off, "I have this", grouping by category, clear
**Stories**: US-17, US-18, US-19, US-20, US-21, US-22
**Dependencies**: Unit 2 (Ingredients — ingredient library + categories), Unit 3 (Recipes — recipe + ingredient data)

**Existing schema**: `shopping_list_items` and `shopping_categories` tables already defined in `apps/api/src/db/schema.ts`.  
**Existing shared types**: `ShoppingListItem` in `packages/shared/src/types/index.ts`.  
**No existing API module or shared utility functions** for shopping yet.

---

## Design Steps

- [x] Define shopping list domain model and enriched response shapes
- [x] Define `packages/shared` utility modules: `consolidateItems`, `addRecipeToList`, `groupByCategory`
- [x] Define shopping list API operation contracts (routes, inputs, outputs, status codes)
- [x] Define business rules: consolidation, "I have this" vs tick-off, clear semantics, scale on add
- [x] Define frontend component structure (Shopping List page, grouped layout, add-from-recipe flow)

---

## Questions

### Q1: Scale Factor When Adding Recipe to Shopping List

When a user adds a recipe to the shopping list, can they specify a serving scale?

A) Yes — the user picks a target batch size (or multiplier) at the point of adding; ingredient quantities are scaled accordingly before being consolidated into the list
B) No — the recipe's current batch size is always used as-is; scaling is out of scope for the shopping add flow
C) Yes — but only allow a simple integer multiplier (×1, ×2, ×3 …) rather than an arbitrary batch size
D) Other (specify)

[Answer]: A

---

### Q2: Consolidation Logic for Repeated Adds

If a user adds the same recipe twice (or two recipes that share an ingredient+unit pair), what should happen?

A) Quantities are summed additively — adding again increases the total quantity for that ingredient+unit pair (idempotency only applies within a single consolidate call, not across add-recipe calls)
B) The second add is silently ignored — each ingredient+unit pair can only appear once and the quantity is not increased by re-adding
C) The user gets a warning before the second add, then can confirm to sum quantities or cancel
D) Other (specify)

[Answer]: A

---

### Q3: "I Have This" vs "Tick Off" Semantics

The database has two separate boolean flags: `haveThis` and `tickedOff`. What is the intended distinction?

A) **Tick off** = physically placed in cart / bought; **I have this** = already owned at home — they are separate states that coexist and are both visible in the list
B) They are functionally identical — only one flag should actually be used; the other is a legacy artifact
C) **"I have this"** hides the item from the list but does not delete it; **tick off** is a temporary "in cart" marker that is cleared on next session
D) Other (specify)

[Answer]: A

---

### Q4: Clear Shopping List Behavior

What does "clear" mean for the shopping list?

A) Remove **all** items from the list (regardless of their tickedOff or haveThis state)
B) Remove only items where `tickedOff = true`
C) Remove only items where `tickedOff = true` OR `haveThis = true`
D) Present the user with a choice: "Clear ticked items" vs "Clear entire list"
E) Other (specify)

[Answer]: A

---

### Q5: Grouped Display — Category Ordering

When items are grouped by category, how should the categories be ordered in the display?

A) By the category's `sortOrder` field (the same order used in the ingredient library)
B) Alphabetically by category name
C) By the order items were added to the list (most recently added category group appears last)
D) Fixed priority order defined by the household (same as shopping category sort in ingredients)
E) Other (specify — note: A and D may be equivalent since sortOrder is already managed per-household)

[Answer]: A

---

### Q6: Items With No Category

Some ingredients may not have a `categoryId` assigned. Where should their list items appear in the grouped view?

A) In a catch-all "Other" group at the bottom (using the seeded "Other" default shopping category)
B) In an "Uncategorized" group that appears separately from named categories (at top or bottom)
C) Silently grouped under the first available category
D) Inline at the top of the list, ungrouped, before the categorized groups
E) Other (specify)

[Answer]: B, since households may or may not have an 'Other' category

---

### Q7: Shopping List Enrichment in API Response

The database `shopping_list_items` row only stores `ingredientId`. Should the API response include enriched ingredient data (name, unit, category) inline?

A) Yes — include ingredient `name`, `defaultUnit`, and `categoryId`/`categoryName` in each list item response (avoids extra client-side fetches)
B) No — return raw list item rows only; the client already has ingredients cached and can join them client-side
C) Yes — include ingredient name and category, but not full nutrition data
D) Other (specify)

[Answer]: A

---

### Q8: Add-Recipe Entry Point in the Web UI

From where in the web app can a user add a recipe to the shopping list?

A) From the Recipe Detail page only (a single "Add to Shopping List" button)
B) From both the Recipe List page (quick-add) and the Recipe Detail page
C) From Recipe Detail only, but also discoverable via a dedicated "Add recipes" button on the Shopping List page itself (which navigates to recipe selection)
D) Other (specify)

[Answer]: A

---

### Q9: `consolidateItems` Input Shape

The `consolidateItems` shared utility takes a list of shopping item candidates and merges same (ingredientId + unit) pairs. What is the expected input type?

A) An array of `{ ingredientId, quantity, unit }` objects — purely the minimal candidate shape, no db ids
B) An array of full `ShoppingListItem` rows — merge existing list items by summing quantities
C) Two separate arrays: the current list (full `ShoppingListItem[]`) and new candidates to merge in (`{ ingredientId, quantity, unit }[]`) — the function returns the merged result
D) Other (specify)

[Answer]: A

---

### Q10: PBT Scope for Shopping

The story map specifies two property-based test invariants for Unit 4. Please confirm the intended scope:

- **Idempotency**: `consolidate(consolidate(x)) = consolidate(x)` — running consolidation twice gives the same result as once
- **Quantity preservation**: The sum of all quantities across the merged list equals the sum of all input quantities for the same (ingredientId + unit) key

A) Both invariants should be covered with fast-check, targeting the pure `consolidateItems` function in `packages/shared`
B) Only the idempotency invariant is worth the investment; skip quantity preservation
C) Both invariants, and also add a PBT for `groupByCategory` (all items appear in exactly one group, no items are lost)
D) Other (specify)

[Answer]: A
