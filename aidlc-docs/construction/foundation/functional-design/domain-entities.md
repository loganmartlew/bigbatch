# Unit 0: Foundation — Domain Entities

## Overview

Complete database schema for BigBatch. All tables are defined upfront in Unit 0 so that Drizzle migrations are coherent. Entities are grouped by the unit that primarily owns them, but all are created together.

---

## ID Strategy

All entities use **auto-increment integer** primary keys (`INTEGER PRIMARY KEY AUTOINCREMENT` in SQLite/Turso).

## Timestamp Strategy

- **User-created content** (recipes, ingredients, cook_events): `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- **Transient data** (shopping_list_items, invites, sessions): `createdAt` only (hard delete)
- **Join/config tables** (user_households, recipe_ingredients, shopping_categories): `createdAt` only

## Soft Delete Rules

- Soft-deleted rows are excluded from all queries by default (WHERE deletedAt IS NULL)
- Soft-deleted recipes: cascade soft-delete to recipe_ingredients; shopping list items referencing them are unaffected (already added)
- Soft-deleted ingredients: prevent if referenced by any active recipe (require user to remove from recipes first)
- Cook events: soft-deleted independently (orphaned cook events for deleted recipes are still viewable)

---

## Entity Definitions

### `users`

| Column         | Type    | Constraints                         | Notes                   |
| -------------- | ------- | ----------------------------------- | ----------------------- |
| id             | INTEGER | PK, AUTOINCREMENT                   |                         |
| email          | TEXT    | NOT NULL, UNIQUE                    | Normalized to lowercase |
| firstName      | TEXT    | NOT NULL                            |                         |
| lastName       | TEXT    | NOT NULL                            |                         |
| hashedPassword | TEXT    | NOT NULL                            | argon2 hash             |
| createdAt      | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601                |
| updatedAt      | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601                |

**Indexes**: UNIQUE on `email`

---

### `households`

| Column    | Type    | Constraints                         | Notes             |
| --------- | ------- | ----------------------------------- | ----------------- |
| id        | INTEGER | PK, AUTOINCREMENT                   |                   |
| name      | TEXT    | NOT NULL                            |                   |
| ownerId   | INTEGER | NOT NULL, FK → users.id             | Household creator |
| createdAt | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                   |
| updatedAt | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                   |

---

### `user_households`

| Column      | Type    | Constraints                                 | Notes                              |
| ----------- | ------- | ------------------------------------------- | ---------------------------------- |
| userId      | INTEGER | NOT NULL, FK → users.id                     | Composite PK (userId, householdId) |
| householdId | INTEGER | NOT NULL, FK → households.id                | Composite PK                       |
| role        | TEXT    | NOT NULL, CHECK(role IN ('owner','member')) | owner or member                    |
| joinedAt    | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP         |                                    |

**Primary Key**: (userId, householdId)
**Indexes**: INDEX on `householdId`

---

### `household_invites`

| Column      | Type    | Constraints                         | Notes                             |
| ----------- | ------- | ----------------------------------- | --------------------------------- |
| id          | INTEGER | PK, AUTOINCREMENT                   |                                   |
| householdId | INTEGER | NOT NULL, FK → households.id        |                                   |
| token       | TEXT    | NOT NULL, UNIQUE                    | URL-safe random token for links   |
| code        | TEXT    | NOT NULL, UNIQUE                    | Short alphanumeric code (6 chars) |
| createdBy   | INTEGER | NOT NULL, FK → users.id             | Owner who generated invite        |
| expiresAt   | TEXT    | NOT NULL                            | createdAt + 24 hours              |
| createdAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                                   |

**Hard delete**: Expired invites are cleaned up periodically or on access.

---

### `sessions`

| Column    | Type    | Constraints                         | Notes            |
| --------- | ------- | ----------------------------------- | ---------------- |
| id        | TEXT    | PK                                  | Lucia session ID |
| userId    | INTEGER | NOT NULL, FK → users.id             |                  |
| expiresAt | TEXT    | NOT NULL                            | Session expiry   |
| createdAt | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                  |

**Hard delete**: Sessions are invalidated by deleting the row.

---

### `ingredients`

| Column      | Type    | Constraints                         | Notes                     |
| ----------- | ------- | ----------------------------------- | ------------------------- |
| id          | INTEGER | PK, AUTOINCREMENT                   |                           |
| householdId | INTEGER | NOT NULL, FK → households.id        |                           |
| name        | TEXT    | NOT NULL                            |                           |
| defaultUnit | TEXT    | NOT NULL                            | From Unit enum            |
| calories    | REAL    | NOT NULL, CHECK(calories >= 0)      | Per default unit quantity |
| protein     | REAL    | NOT NULL, CHECK(protein >= 0)       |                           |
| carbs       | REAL    | NOT NULL, CHECK(carbs >= 0)         |                           |
| fat         | REAL    | NOT NULL, CHECK(fat >= 0)           |                           |
| categoryId  | INTEGER | FK → shopping_categories.id, NULL   | NULL = "Other"            |
| createdAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                           |
| updatedAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                           |
| deletedAt   | TEXT    | NULL                                | Soft delete               |

**Indexes**: INDEX on `householdId`, INDEX on `(householdId, deletedAt)`

---

### `recipes`

| Column      | Type    | Constraints                         | Notes                       |
| ----------- | ------- | ----------------------------------- | --------------------------- |
| id          | INTEGER | PK, AUTOINCREMENT                   |                             |
| householdId | INTEGER | NOT NULL, FK → households.id        |                             |
| name        | TEXT    | NOT NULL                            |                             |
| description | TEXT    | NULL                                | Optional recipe description |
| batchSize   | INTEGER | NOT NULL, CHECK(batchSize > 0)      | Number of portions          |
| createdBy   | INTEGER | NOT NULL, FK → users.id             |                             |
| createdAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                             |
| updatedAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                             |
| deletedAt   | TEXT    | NULL                                | Soft delete                 |

**Indexes**: INDEX on `householdId`, INDEX on `(householdId, deletedAt)`

---

### `recipe_instructions`

| Column     | Type    | Constraints               | Notes                  |
| ---------- | ------- | ------------------------- | ---------------------- |
| id         | INTEGER | PK, AUTOINCREMENT         |                        |
| recipeId   | INTEGER | NOT NULL, FK → recipes.id | CASCADE on delete      |
| stepNumber | INTEGER | NOT NULL                  | 1-based ordering       |
| text       | TEXT    | NOT NULL                  | Plain text instruction |

**Unique**: (recipeId, stepNumber)
**Indexes**: INDEX on `recipeId`

---

### `recipe_ingredients`

| Column       | Type    | Constraints                   | Notes             |
| ------------ | ------- | ----------------------------- | ----------------- |
| id           | INTEGER | PK, AUTOINCREMENT             |                   |
| recipeId     | INTEGER | NOT NULL, FK → recipes.id     | CASCADE on delete |
| ingredientId | INTEGER | NOT NULL, FK → ingredients.id |                   |
| quantity     | REAL    | NOT NULL, CHECK(quantity > 0) |                   |
| unit         | TEXT    | NOT NULL                      | From Unit enum    |

**Indexes**: INDEX on `recipeId`, INDEX on `ingredientId`

---

### `shopping_categories`

| Column      | Type    | Constraints                         | Notes                    |
| ----------- | ------- | ----------------------------------- | ------------------------ |
| id          | INTEGER | PK, AUTOINCREMENT                   |                          |
| householdId | INTEGER | NOT NULL, FK → households.id        |                          |
| name        | TEXT    | NOT NULL                            |                          |
| sortOrder   | INTEGER | NOT NULL, DEFAULT 0                 | For display ordering     |
| isDefault   | INTEGER | NOT NULL, DEFAULT 0                 | 1 = seeded from defaults |
| createdAt   | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                          |

**Unique**: (householdId, name)
**Indexes**: INDEX on `householdId`

**Default categories** (seeded when household is created): Produce, Dairy, Meat, Pantry, Frozen, Bakery, Other. Each household gets its own copy. Users can delete defaults, add custom, or rename.

---

### `shopping_list_items`

| Column       | Type    | Constraints                         | Notes          |
| ------------ | ------- | ----------------------------------- | -------------- |
| id           | INTEGER | PK, AUTOINCREMENT                   |                |
| householdId  | INTEGER | NOT NULL, FK → households.id        |                |
| ingredientId | INTEGER | NOT NULL, FK → ingredients.id       |                |
| quantity     | REAL    | NOT NULL, CHECK(quantity > 0)       |                |
| unit         | TEXT    | NOT NULL                            | From Unit enum |
| tickedOff    | INTEGER | NOT NULL, DEFAULT 0                 | Boolean (0/1)  |
| haveThis     | INTEGER | NOT NULL, DEFAULT 0                 | Boolean (0/1)  |
| createdAt    | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                |

**Hard delete**: Items are removed when list is cleared.
**Unique**: (householdId, ingredientId, unit) — consolidation key
**Indexes**: INDEX on `householdId`

---

### `cook_events`

| Column    | Type    | Constraints                         | Notes                     |
| --------- | ------- | ----------------------------------- | ------------------------- |
| id        | INTEGER | PK, AUTOINCREMENT                   |                           |
| recipeId  | INTEGER | NOT NULL, FK → recipes.id           | NOT cascade — orphaned OK |
| userId    | INTEGER | NOT NULL, FK → users.id             |                           |
| date      | TEXT    | NOT NULL                            | ISO 8601 date             |
| batchSize | INTEGER | NOT NULL, CHECK(batchSize > 0)      |                           |
| notes     | TEXT    | NULL                                |                           |
| createdAt | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                           |
| updatedAt | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP |                           |
| deletedAt | TEXT    | NULL                                | Soft delete               |

**Indexes**: INDEX on `recipeId`, INDEX on `userId`

---

## Entity Relationship Summary

```
users ──┬── user_households ──── households
        │                            │
        │                            ├── ingredients ──── shopping_categories
        │                            │       │
        │                            ├── recipes ──── recipe_ingredients ──→ ingredients
        │                            │     │
        │                            │     └── recipe_instructions
        │                            │
        │                            ├── shopping_list_items ──→ ingredients
        │                            │
        │                            └── household_invites
        │
        ├── cook_events ──→ recipes
        └── sessions
```

## Unit Enum Values

`g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `cup`, `item`
