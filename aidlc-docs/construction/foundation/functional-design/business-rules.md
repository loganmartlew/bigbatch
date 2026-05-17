# Unit 0: Foundation — Business Rules

## Soft Delete Rules

| Entity              | Delete Type | Cascade Behavior                                                         |
| ------------------- | ----------- | ------------------------------------------------------------------------ |
| users               | N/A         | Users cannot be deleted (future: account deactivation)                   |
| households          | N/A         | Households cannot be deleted (future: archive)                           |
| ingredients         | Soft        | Block if referenced by any active recipe; set deletedAt                  |
| recipes             | Soft        | Cascade soft-delete to recipe_ingredients; cook_events remain (orphaned) |
| cook_events         | Soft        | Independent soft delete                                                  |
| shopping_list_items | Hard        | Removed when list is cleared or item is removed                          |
| household_invites   | Hard        | Deleted when expired or consumed                                         |
| sessions            | Hard        | Deleted on logout or expiry                                              |
| user_households     | Hard        | Deleted when member is removed from household                            |
| shopping_categories | Hard        | Block if any ingredient references this category; reassign to NULL first |
| recipe_instructions | Hard        | Cascade with recipe (replaced on recipe update)                          |
| recipe_ingredients  | Hard        | Cascade with recipe soft-delete (or re-created on recipe update)         |

## Invite Rules

- Invites expire after **24 hours** from creation
- Each invite generates both a **token** (URL-safe, for link sharing) and a **code** (6-character alphanumeric, for verbal sharing)
- Only the household **owner** can generate invites
- Expired invites are rejected at join time; periodic cleanup is optional
- A user can join the same household only once (unique constraint on user_households)
- A user who is already a member receives a clear error, not a duplicate row

## Shopping Category Rules

- When a household is created, the default categories are seeded: **Produce, Dairy, Meat, Pantry, Frozen, Bakery, Other**
- Each household gets its own copy of categories (rows in `shopping_categories`)
- Households can **delete** any category (including defaults), **add** custom categories, and **rename** existing ones
- Deleting a category sets `categoryId = NULL` on all ingredients that referenced it (they fall under uncategorized/"Other" in the UI)
- `isDefault` flag is informational only (to distinguish seeded vs. user-created); it has no behavioral impact
- `sortOrder` controls display order; new categories get `MAX(sortOrder) + 1`

## Recipe Instruction Rules

- Instructions are an **ordered array of plain text steps**
- Each step has a `stepNumber` (1-based, sequential, no gaps)
- When a recipe is updated, all existing instructions are deleted and re-inserted (replace strategy) to avoid reordering complexity
- Empty instruction text is not allowed

## Entity Scoping Rules

- All domain data (ingredients, recipes, shopping lists, cook events, categories) is **scoped to a household**
- Every query for domain data includes `WHERE householdId = ?` derived from the `X-Household-Id` request header
- Users can only access data for households they belong to (validated by auth middleware)

## Timestamp Rules

- All timestamps stored as ISO 8601 text strings in UTC
- `createdAt` is set on INSERT, never updated
- `updatedAt` is set on INSERT and updated on every UPDATE
- `deletedAt` is NULL for active records, set to current timestamp on soft delete

## ID Rules

- Auto-increment integers for all primary keys
- IDs are sequential and may be exposed in URLs (acceptable for a household-scoped app)
- No global uniqueness guarantees across database instances (acceptable for single-DB Turso architecture)
