# Unit 5: Cook Events — Business Logic Model

## Service: `cook-events`

This unit expands beyond simple event logging. The service layer now orchestrates four linked concerns:

1. queued-cook creation and maintenance
2. shopping-backed readiness derivation
3. revised cook-mode entry and completion
4. cook-event history and editing

---

## Derived Concepts

### Derived queued-cook state

Queued cooks do not persist a stored workflow status column for `gathering ingredients` vs `ready to cook`.

```text
readyToCook = for every queued_cook_ingredient row:
  there exists a matching shopping_list_items row for the same
  (householdId, ingredientId, unit)
  AND shopping row quantity >= queued contribution quantity
  AND (shopping row tickedOff = true OR shopping row haveThis = true)

If any linked requirement fails the predicate, state = gatheringIngredients.
If all linked requirements pass, state = readyToCook.
```

### Shared shopping-row cleanup rule

Queue cleanup is derived from the relationship between a queued cook's linked ingredient contribution and the current consolidated shopping row.

```text
If shoppingRow.quantity == queuedContribution.requiredQuantity
  -> the row is dedicated to this queued cook and may be removed on finish/cancel cleanup.

If shoppingRow.quantity > queuedContribution.requiredQuantity
  -> the row is shared with another source (another queued cook and/or pre-existing shopping quantity)
     and automatic cleanup is skipped.
```

---

## Operation: `createQueuedCook`

**Input**: `householdId`, `userId`, `recipeId`, `{ targetBatchSize }`  
**Output**: `QueuedCookDetail`  
**Authorization**: Authenticated user, member of household

```text
1. Validate recipe exists, belongs to household, and is not soft-deleted.
2. Validate targetBatchSize is an integer >= 1.
3. Load current recipe batchSize and recipe_ingredients rows.
4. If recipe has no ingredients -> ConflictError.
5. INSERT queued_cooks row with:
   - householdId
   - recipeId
   - createdByUserId
   - recipeBatchSizeSnapshot = recipe.batchSize
   - selectedBatchSize = targetBatchSize
6. For each recipe ingredient:
   - baseQuantity = recipe_ingredient.quantity
   - requiredQuantity = scale(baseQuantity, recipe.batchSize, targetBatchSize)
   - INSERT queued_cook_ingredients row with snapshot quantities and unit.
7. UPSERT required quantities into shopping_list_items using the existing Unit 4 consolidation rule.
8. Return queued cook detail with derived state.
```

---

## Operation: `listCooksDashboard`

**Input**: `householdId`  
**Output**: `{ queue: QueuedCookSummary[], history: CookEventDetail[] }`  
**Authorization**: Authenticated user, member of household

```text
1. SELECT active queued_cooks for household.
2. JOIN recipes for current name/description and creator-facing metadata.
3. JOIN queued_cook_ingredients for each queued cook.
4. Load current matching shopping_list_items rows by (ingredientId, unit).
5. Derive each queued cook's state:
   - gatheringIngredients if any linked ingredient is unresolved
   - readyToCook if all linked ingredients are satisfied
6. SELECT recent cook_events for household, newest-first.
7. JOIN users for cook-event display names.
8. JOIN recipes (including soft-deleted recipes) for display labels where possible.
9. Return queue + history in a single dashboard response.
```

---

## Operation: `updateQueuedCookBatchSize`

**Input**: `householdId`, `queuedCookId`, `{ targetBatchSize }`  
**Output**: Updated `QueuedCookDetail`  
**Authorization**: Authenticated user, member of household

```text
1. Fetch queued cook and verify it belongs to household.
2. Derive current state.
3. If state != gatheringIngredients -> ConflictError("Batch size can only be edited while gathering ingredients").
4. Validate targetBatchSize is an integer >= 1.
5. For each queued_cook_ingredients row:
   a. newRequiredQuantity = scale(baseQuantity, queuedCook.recipeBatchSizeSnapshot, targetBatchSize)
   b. delta = newRequiredQuantity - currentRequiredQuantity
   c. If delta > 0: UPSERT delta into shopping_list_items
   d. If delta < 0: decrement shopping_list_items.quantity by |delta| (never below 0)
   e. UPDATE queued_cook_ingredients.requiredQuantity = newRequiredQuantity
6. UPDATE queued_cooks.selectedBatchSize and updatedAt.
7. Return refreshed queued cook detail with derived state.
```

---

## Operation: `cancelQueuedCook`

**Input**: `householdId`, `queuedCookId`, `{ removeShoppingItems: boolean }`  
**Output**: `{ removedFromQueue: true, shoppingCleanup: CleanupSummary }`  
**Authorization**: Authenticated user, member of household

```text
1. Fetch queued cook and linked queued_cook_ingredients.
2. If removeShoppingItems = true:
   For each linked ingredient requirement:
   a. Find matching shopping_list_items row by (householdId, ingredientId, unit)
   b. If no row exists: continue
   c. If shoppingRow.quantity == requiredQuantity:
      - DELETE shopping row
      - record cleanup = removed
   d. If shoppingRow.quantity > requiredQuantity:
      - retain shopping row unchanged
      - record cleanup = sharedRetained
3. DELETE queued_cook_ingredients rows.
4. DELETE queued_cooks row.
5. Return queue removal result + cleanup summary.
```

---

## Operation: `getQueuedCookForCookMode`

**Input**: `householdId`, `queuedCookId`  
**Output**: `CookModePayload`  
**Authorization**: Authenticated user, member of household

```text
1. Fetch queued cook and verify household ownership.
2. Derive current state.
3. If state != readyToCook -> ConflictError("Queued cook is not ready to cook").
4. Load recipe detail from current recipes tables:
   - instructions are always live from the current recipe definition
   - recipe metadata is live from the current recipe definition
5. Load queued_cook_ingredients snapshot rows for ingredients list.
6. Return:
   - queued cook id
   - recipe metadata
   - selectedBatchSize
   - queued ingredient list (snapshot quantities)
   - live instructions
```

---

## Operation: `finishQueuedCook`

**Input**: `householdId`, `queuedCookId`, `userId`  
**Output**: `{ cookEvent, shoppingCleanup: CleanupSummary }`  
**Authorization**: Authenticated user, member of household

```text
1. Fetch queued cook and linked ingredient rows.
2. Re-derive state from current shopping list.
3. If state != readyToCook -> ConflictError("Queued cook is no longer ready to cook").
4. INSERT cook_events row with:
   - recipeId = queuedCook.recipeId
   - userId = current user
   - date = today (default)
   - batchSize = queuedCook.selectedBatchSize
   - notes = null
5. For each linked ingredient requirement:
   a. Find matching shopping row
   b. If shoppingRow.quantity == requiredQuantity -> DELETE shopping row
   c. If shoppingRow.quantity > requiredQuantity -> retain row unchanged
6. DELETE queued_cook_ingredients rows.
7. DELETE queued_cooks row.
8. Return created cook event + cleanup summary.
```

---

## Operation: `listRecipeCookHistory`

**Input**: `householdId`, `recipeId`  
**Output**: `CookEventDetail[]` newest-first  
**Authorization**: Authenticated user, member of household

```text
1. Validate recipe belongs to household.
2. SELECT cook_events WHERE recipeId = :recipeId AND deletedAt IS NULL
3. JOIN users for display name
4. ORDER BY date DESC, createdAt DESC
5. Return recipe-scoped cook history
```

---

## Operation: `updateCookEvent`

**Input**: `householdId`, `cookEventId`, `{ date?, notes? }`  
**Output**: Updated `CookEventDetail`  
**Authorization**: Any authenticated household member

```text
1. Fetch cook event by id.
2. Verify the related recipe belongs to the same household.
3. Validate date if provided (any valid calendar date accepted).
4. Validate notes length if provided.
5. UPDATE cook_events date/notes and updatedAt.
6. Return refreshed cook-event detail.
```

---

## API Route Contracts

| Method | Path                        | Purpose                                              |
| ------ | --------------------------- | ---------------------------------------------------- |
| POST   | `/recipes/:id/queued-cooks` | Create a queued cook from recipe detail              |
| GET    | `/cooks`                    | Get cooks dashboard queue + history                  |
| PATCH  | `/cooks/:id/batch-size`     | Update queued batch size while gathering ingredients |
| DELETE | `/cooks/:id`                | Cancel/remove queued cook                            |
| GET    | `/cooks/:id/cook-mode`      | Get cook-mode payload for a ready queued cook        |
| POST   | `/cooks/:id/finish`         | Finish queued cook and create cook event             |
| GET    | `/recipes/:id/cook-events`  | Get inline recipe history                            |
| PATCH  | `/cook-events/:id`          | Edit cook-event date and/or notes                    |

All household-scoped routes require `X-Household-Id` and use membership validation via the existing household resolver.

---

## Testable Properties (PBT-01)

| ID        | Category  | Target               | Property                                                                                                                                                                                                        |
| --------- | --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PBT-CE-01 | Invariant | readiness derivation | A queued cook is `readyToCook` if and only if every linked queued ingredient has a matching completed shopping row with quantity greater than or equal to the queued contribution.                              |
| PBT-CE-02 | Invariant | batch-size updates   | Recomputing queued ingredient requirements for a new batch size preserves ingredient count and scales each requirement linearly from the stored base snapshot.                                                  |
| PBT-CE-03 | Stateful  | queue lifecycle      | Across random sequences of create, resize, cancel, and finish operations, active queued cooks and resulting cook-event history stay consistent with the model, and shared shopping rows are never auto-removed. |

No strong round-trip property was identified for this unit. PBT focus should stay on invariants plus stateful lifecycle modeling.
