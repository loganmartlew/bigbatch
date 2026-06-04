# Unit 4: Shopping — Business Rules

## BR-SH-01: Household Scoping

All shopping list operations are scoped to the requesting user's active household via the `X-Household-Id` header. The household is resolved and membership validated before any query or mutation.

- A user may only view or modify shopping list items belonging to their active household.
- The `householdId` from the resolved context is always used; the client never supplies it in the request body.

---

## BR-SH-02: One Row Per (householdId, ingredientId, unit)

There must be at most one `shopping_list_items` row per `(householdId, ingredientId, unit)` combination.

- Enforced at the database level by a unique index.
- The `addRecipeToList` operation uses an UPSERT (INSERT … ON CONFLICT … DO UPDATE SET quantity += excluded.quantity) to respect this constraint.
- There is no separate "merge" step — consolidation happens in the upsert itself.

---

## BR-SH-03: Scale Factor Must Be Positive

When adding a recipe to the shopping list, `targetBatchSize` must be a positive integer (≥ 1).

- `targetBatchSize < 1` → ValidationError.
- `targetBatchSize` is not required to be a multiple of `recipe.batchSize`; any positive integer is accepted.

---

## BR-SH-04: Recipe Must Belong to Household and Be Active

The recipe referenced by `recipeId` must:

- Exist (`SELECT` returns a row)
- Belong to the same `householdId`
- Not be soft-deleted (`deletedAt IS NULL`)

Failure → NotFoundError (404). Intentionally returns 404 (not 403) to avoid leaking existence of recipes belonging to other households.

---

## BR-SH-05: Recipe Must Have Ingredients to Add

A recipe with no `recipe_ingredients` rows cannot be added to the shopping list.

Failure → ConflictError (409): "Recipe has no ingredients and cannot be added to the shopping list."

---

## BR-SH-06: Quantity Accumulation on Repeated Adds

Adding the same recipe (or multiple recipes that share an ingredient+unit pair) increases the quantity for that pair additively. There is no deduplication warning — amounts simply accumulate.

- This is intentional: a user cooking two batches of the same recipe wants double the quantities.

---

## BR-SH-07: Tick-Off and Have-This Are Independent Flags

`tickedOff` and `haveThis` are separate, independent booleans on each item.

- Setting one does not affect the other.
- Both can be true simultaneously.
- Neither flag hides or removes the item from the list.
- Visual distinction is the UI's responsibility.

---

## BR-SH-08: Toggle Operations Are Boolean Flips

`PATCH /shopping-list/items/:id/toggle` and `PATCH /shopping-list/items/:id/have-this` always flip (NOT) the current flag value. There is no request body needed.

- If `tickedOff` is `false` → becomes `true`; if `true` → becomes `false`.
- Same logic applies to `haveThis`.

---

## BR-SH-09: Clear Removes All Items

`DELETE /shopping-list` removes **every** `shopping_list_items` row for the household regardless of `tickedOff`, `haveThis`, or any other state.

- No partial clear variants.
- Returns 204 No Content.
- The client is responsible for confirming intent (confirmation dialog in the UI).

---

## BR-SH-10: Grouped Display Ordering

Items are grouped by shopping category when presented to the client:

1. Groups are ordered by `shopping_categories.sortOrder` ASC.
2. Items within a group are ordered by `ingredientName` ASC (case-insensitive).
3. Items whose ingredient has no `categoryId` form a single **"Uncategorized"** group, which always appears **last** (sort position = Infinity).

---

## BR-SH-11: Uncategorized Group Identity

An ingredient with `categoryId = NULL` produces items in the "Uncategorized" group, not in any named category. This group is synthetic — it has no `id` in the DB and is constructed at read-time.

- `categoryId: null`, `categoryName: null` in the response.
- The seeded "Other" category is a real category and only applies to ingredients explicitly assigned to it.

---

## BR-SH-12: Item Ownership Validation for Mutations

For `PATCH /shopping-list/items/:id/*` operations:

- The item must exist AND belong to the requesting household.
- If not found or belongs to a different household → NotFoundError (404).

---

## BR-SH-13: Enrichment Is Always Included

`GET /shopping-list` always returns enriched items. There is no "raw" list endpoint. Every item includes:

- `ingredientName` (from joined `ingredients.name`)
- `ingredientDefaultUnit` (from `ingredients.defaultUnit`)
- `categoryId`, `categoryName`, `categorySortOrder` (from left-joined `shopping_categories`)

---

## BR-SH-14: Manual Ingredient Add — Ingredient Must Be Active and Household-Owned

When a user manually adds an ingredient to the shopping list, the ingredient must:

- Exist in the database
- Belong to the same `householdId` as the request
- Not be soft-deleted (`deletedAt IS NULL`)

Failure → NotFoundError (404). Returns 404 (not 403) to avoid leaking existence across households.

---

## BR-SH-15: Manual Add Quantity Must Be a Positive Number

The `quantity` field in `POST /shopping-list/add-ingredient` must be a positive number greater than zero. Decimals are allowed (e.g. 0.5, 1.25).

- `quantity ≤ 0` → ValidationError
- No maximum is enforced

---

## BR-SH-16: Manual Add Unit Defaults to Ingredient's `defaultUnit`; Override Allowed

The `unit` supplied in a manual add must be a valid value from the `Unit` enum. The UI pre-fills the ingredient's `defaultUnit` but the user may choose any other valid unit. The API accepts any valid `Unit` enum value regardless of the ingredient's `defaultUnit`.

---

## BR-SH-17: Manual Add Uses Same UPSERT Consolidation as Recipe Add

If a `(householdId, ingredientId, unit)` row already exists when a manual add is submitted, the entered quantity is summed into the existing row's quantity. No warning is shown — the accumulation is silent (same as recipe-based add).

---

## BR-SH-18: Individual Item Removal

`DELETE /shopping-list/items/:id` removes exactly one item regardless of its `tickedOff` or `haveThis` state. The item must belong to the requesting household (same ownership check as other item mutations). Returns 204 No Content.

---

## BR-SH-19: Inline Quantity Edit Must Be Positive

`PATCH /shopping-list/items/:id/quantity` **replaces** (does not accumulate) the stored quantity.

- `quantity ≤ 0` → ValidationError
- Decimals are allowed
- The item must belong to the requesting household

---

## Validation Rules Summary

| Field                       | Rule                                   | Error           |
| --------------------------- | -------------------------------------- | --------------- |
| `recipeId`                  | Required, positive integer             | ValidationError |
| `targetBatchSize`           | Required, integer ≥ 1                  | ValidationError |
| Recipe existence            | Must exist + active + same hh          | NotFoundError   |
| Recipe ingredients          | At least one ingredient required       | ConflictError   |
| `ingredientId` (manual add) | Required, positive integer             | ValidationError |
| Ingredient existence        | Must exist + active + same hh          | NotFoundError   |
| `quantity` (add / edit)     | Required, number > 0, decimals allowed | ValidationError |
| `unit` (manual add)         | Required, valid Unit enum value        | ValidationError |
| Item ownership              | Item must belong to household          | NotFoundError   |
| Quantity edit value         | Must be > 0                            | ValidationError |
