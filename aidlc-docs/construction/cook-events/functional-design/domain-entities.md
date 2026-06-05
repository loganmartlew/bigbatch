# Unit 5: Cook Events — Domain Entities

## Entity: QueuedCook (planned)

**Table**: `queued_cooks`  
**Ownership**: Household-scoped (`householdId` FK -> `households.id`)  
**Retention**: Operational rows only; active queue entries are deleted on finish or cancel

| Field                     | Type         | Constraints           | Notes                                         |
| ------------------------- | ------------ | --------------------- | --------------------------------------------- |
| `id`                      | integer (PK) | auto-increment        | Stable identity for one planned cook instance |
| `householdId`             | integer (FK) | NOT NULL              | Household scope                               |
| `recipeId`                | integer (FK) | NOT NULL              | References the source recipe                  |
| `createdByUserId`         | integer (FK) | NOT NULL              | User who queued the cook                      |
| `recipeBatchSizeSnapshot` | integer      | NOT NULL              | Recipe `batchSize` captured when queued       |
| `selectedBatchSize`       | integer      | NOT NULL, >= 1        | Current planned batch size                    |
| `createdAt`               | text (ISO)   | NOT NULL, default now |                                               |
| `updatedAt`               | text (ISO)   | NOT NULL, default now | Updated when batch size changes               |

**Derived fields** (not stored):

- `state: 'gatheringIngredients' | 'readyToCook'`
- `requiredIngredientsCount`
- `satisfiedIngredientsCount`

**Indexes**:

- `queued_cooks_household_idx` on (`householdId`)
- `queued_cooks_recipe_idx` on (`recipeId`)
- `queued_cooks_created_by_idx` on (`createdByUserId`)

---

## Entity: QueuedCookIngredient (planned)

**Table**: `queued_cook_ingredients`  
**Ownership**: Child of `queued_cooks`  
**Purpose**: Snapshot ingredient requirements for one queued cook and preserve the scaling baseline independent of later recipe ingredient edits

| Field              | Type          | Constraints           | Notes                                                                        |
| ------------------ | ------------- | --------------------- | ---------------------------------------------------------------------------- |
| `id`               | integer (PK)  | auto-increment        |                                                                              |
| `queuedCookId`     | integer (FK)  | NOT NULL              | References `queued_cooks.id`                                                 |
| `ingredientId`     | integer (FK)  | NOT NULL              | References `ingredients.id`                                                  |
| `unit`             | text (`Unit`) | NOT NULL              | Snapshot of recipe ingredient unit                                           |
| `baseQuantity`     | real          | NOT NULL, > 0         | Quantity captured from the recipe at queue time, before batch-size rescaling |
| `requiredQuantity` | real          | NOT NULL, > 0         | Current planned contribution for this queued cook                            |
| `createdAt`        | text (ISO)    | NOT NULL, default now |                                                                              |
| `updatedAt`        | text (ISO)    | NOT NULL, default now | Updated when queued batch size changes                                       |

**Uniqueness**:

- Unique on (`queuedCookId`, `ingredientId`, `unit`) to avoid duplicate linked requirement rows for the same queued cook.

**Relations**:

- belongs to `queued_cooks`
- belongs to `ingredients`

---

## Entity: ShoppingListItem (existing, reused)

Unit 5 does not replace the Unit 4 shopping table. It reuses the existing consolidated shopping rows in `shopping_list_items`.

| Field          | Type    | Relevant Unit 5 meaning                                                               |
| -------------- | ------- | ------------------------------------------------------------------------------------- |
| `ingredientId` | integer | Used to match a queued ingredient requirement                                         |
| `unit`         | text    | Must match the queued ingredient unit                                                 |
| `quantity`     | real    | Compared against `requiredQuantity` to determine whether a row is dedicated or shared |
| `tickedOff`    | boolean | One of the two completion flags that can satisfy readiness                            |
| `haveThis`     | boolean | One of the two completion flags that can satisfy readiness                            |

**Important derived concept**:

- `shoppingRow.quantity == queuedContribution.requiredQuantity` -> dedicated row for cleanup purposes
- `shoppingRow.quantity > queuedContribution.requiredQuantity` -> shared row; retain on finish/cancel cleanup

---

## Entity: CookEvent (existing, reused)

**Table**: `cook_events`  
**Ownership**: Recipe-linked, household-resolved through recipe membership  
**Retention**: Historical record persists after queue completion and after recipe soft-delete

| Field       | Type         | Notes                                             |
| ----------- | ------------ | ------------------------------------------------- |
| `id`        | integer (PK) |                                                   |
| `recipeId`  | integer (FK) | References the cooked recipe                      |
| `userId`    | integer (FK) | User who completed the cook                       |
| `date`      | text         | User-visible cook date; editable after creation   |
| `batchSize` | integer      | Batch size used when the queued cook was finished |
| `notes`     | text \| null | Editable after creation                           |
| `createdAt` | text         | Technical creation timestamp                      |
| `updatedAt` | text         | Technical update timestamp                        |
| `deletedAt` | text \| null | Soft-delete marker if future removal is added     |

---

## Derived View Models

### QueuedCookSummary

Used by the Cooks dashboard queue list.

| Field                       | Type                    | Notes                            |
| --------------------------- | ----------------------- | -------------------------------- | ------- |
| `id`                        | number                  | queued cook id                   |
| `recipeId`                  | number                  |                                  |
| `recipeName`                | string                  | live from current recipe         |
| `selectedBatchSize`         | number                  |                                  |
| `state`                     | `'gatheringIngredients' | 'readyToCook'`                   | derived |
| `requiredIngredientsCount`  | number                  |                                  |
| `satisfiedIngredientsCount` | number                  | derived from shopping completion |
| `createdByDisplayName`      | string                  | user-facing queue attribution    |
| `createdAt`                 | string                  |                                  |

### CookEventDetail

Used by dashboard history and inline recipe history.

| Field             | Type           | Notes                                      |
| ----------------- | -------------- | ------------------------------------------ |
| `id`              | number         |                                            |
| `recipeId`        | number         |                                            |
| `recipeName`      | string         | joined from current or soft-deleted recipe |
| `userId`          | number         |                                            |
| `userDisplayName` | string         | joined from users                          |
| `date`            | string         | editable calendar date                     |
| `batchSize`       | number         |                                            |
| `notes`           | string \| null | editable                                   |
| `createdAt`       | string         | technical timestamp                        |
| `updatedAt`       | string         | technical timestamp                        |

### CooksDashboardResponse

```ts
interface CooksDashboardResponse {
  queue: QueuedCookSummary[];
  history: CookEventDetail[];
}
```

---

## Relationship Diagram

```text
Household
  |
  +--< queued_cooks >-- Recipe
  |         |
  |         +--< queued_cook_ingredients >-- Ingredient
  |
  +--< shopping_list_items >-- Ingredient
  |
  +--< cook_events >-- Recipe
               |
               +-- User
```

---

## Key Invariants

1. A queued cook may exist multiple times for the same recipe; `queuedCookId` is the unique active identity.
2. `selectedBatchSize` is always a positive integer.
3. Every queued cook has at least one queued ingredient requirement.
4. Readiness is derived entirely from current shopping-list state plus linked queued ingredient requirements.
5. Shared shopping rows are never auto-removed on finish/cancel cleanup.
6. Cook events remain historical records after the queued cook row is removed.
