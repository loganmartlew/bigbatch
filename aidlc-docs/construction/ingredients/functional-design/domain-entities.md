# Unit 2: Ingredients — Domain Entities

## Entity: Ingredient

**Table**: `ingredients`  
**Ownership**: Household-scoped (`householdId` FK → `households.id`)  
**Soft-delete**: Yes (`deletedAt` nullable timestamp)

| Field       | Type         | Constraints                                 | Notes                                                    |
| ----------- | ------------ | ------------------------------------------- | -------------------------------------------------------- |
| id          | integer (PK) | auto-increment                              |                                                          |
| householdId | integer (FK) | NOT NULL, references households.id          | Household scope                                          |
| name        | text         | NOT NULL, unique per household (CI)         | Case-insensitive uniqueness enforced at service layer    |
| defaultUnit | text (Unit)  | NOT NULL, one of UNITS enum                 | Controls how recipe quantities reference this ingredient |
| calories    | real         | nullable                                    | Per 100g or 100ml (always normalized); null = unknown    |
| protein     | real         | nullable                                    | Per 100g or 100ml; null = unknown                        |
| carbs       | real         | nullable                                    | Per 100g or 100ml; null = unknown                        |
| fat         | real         | nullable                                    | Per 100g or 100ml; null = unknown                        |
| categoryId  | integer (FK) | nullable, references shopping_categories.id | Shopping category assignment                             |
| createdAt   | text (ISO)   | NOT NULL, default now                       |                                                          |
| updatedAt   | text (ISO)   | NOT NULL, default now                       |                                                          |
| deletedAt   | text (ISO)   | nullable                                    | Soft-delete marker                                       |

**Indexes**:

- `ingredients_household_idx` on (`householdId`)
- `ingredients_household_active_idx` on (`householdId`, `deletedAt`) — optimizes active-ingredient queries

**Relations**:

- belongs to `households` (via `householdId`)
- belongs to `shoppingCategories` (via `categoryId`, optional)
- has many `recipeIngredients` (via `ingredients.id` ← `recipe_ingredients.ingredientId`)

---

## Entity: ShoppingCategory

**Table**: `shopping_categories`  
**Ownership**: Household-scoped  
**Soft-delete**: No (hard delete when no ingredients assigned)

| Field       | Type         | Constraints                                   | Notes                             |
| ----------- | ------------ | --------------------------------------------- | --------------------------------- |
| id          | integer (PK) | auto-increment                                |                                   |
| householdId | integer (FK) | NOT NULL, references households.id            |                                   |
| name        | text         | NOT NULL, unique per household (unique index) | Case-sensitive uniqueness (index) |
| sortOrder   | integer      | NOT NULL, default 0                           | Display ordering                  |
| isDefault   | boolean      | NOT NULL, default false                       | True for system-seeded categories |
| createdAt   | text (ISO)   | NOT NULL, default now                         |                                   |

**Indexes**:

- `shopping_categories_household_name_idx` UNIQUE on (`householdId`, `name`)
- `shopping_categories_household_idx` on (`householdId`)

**Relations**:

- belongs to `households` (via `householdId`)
- has many `ingredients` (via `shopping_categories.id` ← `ingredients.categoryId`)

**Default seed** (created at household creation time):
Produce, Dairy, Meat, Pantry, Frozen, Bakery, Other — all with `isDefault=true`

---

## Entity: RecipeIngredient (Cross-Reference)

**Table**: `recipe_ingredients`  
**Role**: Links recipes to ingredients with a quantity and unit override

| Field        | Type         | Constraints                         | Notes                                      |
| ------------ | ------------ | ----------------------------------- | ------------------------------------------ |
| id           | integer (PK) | auto-increment                      |                                            |
| recipeId     | integer (FK) | NOT NULL, references recipes.id     |                                            |
| ingredientId | integer (FK) | NOT NULL, references ingredients.id |                                            |
| quantity     | real         | NOT NULL                            | Amount in the specified unit               |
| unit         | text (Unit)  | NOT NULL, one of UNITS enum         | May differ from ingredient's `defaultUnit` |

**Relations**:

- belongs to `recipes` (via `recipeId`)
- belongs to `ingredients` (via `ingredientId`)

---

## Nutrition Model

Nutrition values on `Ingredient` are **always stored per 100 units** of the ingredient's base measurement:

- For weight-based units (g, kg): per 100g
- For volume-based units (ml, l): per 100ml
- For discrete units (item, tbsp, tsp, cup): per 100 items/measures

All four nutrition fields are **optional (nullable)**. A null value means "unknown" — the user has not entered or imported that data. Partial nutrition is allowed (e.g., only calories filled in).

The `defaultUnit` field indicates how recipe quantities reference this ingredient (e.g., "g" means recipe uses grams). Nutrition computation divides recipe quantity by 100 then multiplies by the stored per-100 values. Null nutrition values are treated as 0 in computation but displayed as "—" in the UI.

**Formula**: `ingredientNutrition = (recipeIngredient.quantity / 100) * (ingredient.[macro] ?? 0)`

---

## Unit Enum (shared)

```typescript
const UNITS = ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'item'] as const;
type Unit = (typeof UNITS)[number];
```

---

## Entity Relationship Diagram

```text
+----------------+       +-------------------+       +------------------+
|   households   |1----*>| shopping_categories|       |     recipes      |
+----------------+       +-------------------+       +------------------+
        |                        |                          |
        | 1                      | 0..1                     | 1
        |                        |                          |
        v *                      v *                        v *
+----------------+                                  +-------------------+
|  ingredients   |--------------------------------->| recipe_ingredients|
+----------------+          1          *            +-------------------+
```
