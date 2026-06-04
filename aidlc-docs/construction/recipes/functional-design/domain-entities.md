# Unit 3: Recipes — Domain Entities

## Entity: Recipe

Already defined in Unit 0 schema (`recipes` table). Requires schema migration to add `source`, `prepTime`, and `cookTime`.

| Field       | Type                         | Rules                                    |
| ----------- | ---------------------------- | ---------------------------------------- |
| id          | integer (PK, auto-increment) | Immutable                                |
| householdId | integer (FK → households)    | Not null, set on creation                |
| name        | text (not null)              | Trimmed, 1–200 chars                     |
| description | text (nullable)              | Optional free-text, max 2000 chars       |
| source      | text (nullable)              | Optional attribution (URL, book, person) |
| prepTime    | integer (nullable)           | Minutes, optional, ≥ 0                   |
| cookTime    | integer (nullable)           | Minutes, optional, ≥ 0                   |
| batchSize   | integer (not null)           | Default servings/portions, ≥ 1           |
| createdBy   | integer (FK → users)         | Not null, set on creation                |
| createdAt   | text (ISO 8601)              | Set on INSERT                            |
| updatedAt   | text (ISO 8601)              | Set on INSERT, updated on any edit       |
| deletedAt   | text (ISO 8601, nullable)    | Soft delete                              |

### Recipe API Response Shape

```typescript
{
  id: number;
  householdId: number;
  name: string;
  description: string | null;
  source: string | null;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  createdBy: number;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredientDetail[];
  tags: string[];
  nutrition: NutritionInfo | null; // computed live
  createdAt: string;
  updatedAt: string;
}
```

---

## Entity: RecipeInstruction

Already defined in Unit 0 schema (`recipe_instructions` table). Separate table for ordered steps.

| Field      | Type                         | Rules                             |
| ---------- | ---------------------------- | --------------------------------- |
| id         | integer (PK, auto-increment) | Immutable                         |
| recipeId   | integer (FK → recipes)       | Not null, cascade delete          |
| stepNumber | integer (not null)           | 1-based, unique per recipe        |
| text       | text (not null)              | Instruction content, 1–2000 chars |

### Constraints

- Unique index on `(recipeId, stepNumber)` already exists
- Steps are always returned ordered by `stepNumber`
- On recipe save, steps are replaced atomically (delete all + re-insert)

---

## Entity: RecipeIngredient

Already defined in Unit 0 schema (`recipe_ingredients` table).

| Field        | Type                         | Rules                     |
| ------------ | ---------------------------- | ------------------------- |
| id           | integer (PK, auto-increment) | Immutable                 |
| recipeId     | integer (FK → recipes)       | Not null, cascade delete  |
| ingredientId | integer (FK → ingredients)   | Not null                  |
| quantity     | real (not null)              | > 0                       |
| unit         | text (not null)              | Must be a valid Unit enum |

### RecipeIngredientDetail (API enriched shape)

```typescript
{
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  nutrition: NutritionInfo | null; // per-ingredient scaled nutrition
}
```

---

## Entity: RecipeTag (NEW)

New table required for custom tag support (many-to-many).

| Field       | Type                         | Rules                          |
| ----------- | ---------------------------- | ------------------------------ |
| id          | integer (PK, auto-increment) | Immutable                      |
| householdId | integer (FK → households)    | Not null, scoped to household  |
| name        | text (not null)              | Trimmed, lowercase, 1–50 chars |

### Constraints

- Unique index on `(householdId, name)` — no duplicate tag names within a household
- Tags are shared across all recipes in a household

---

## Entity: RecipeTagAssignment (NEW)

Join table between recipes and tags.

| Field    | Type                       | Rules    |
| -------- | -------------------------- | -------- |
| recipeId | integer (FK → recipes)     | Not null |
| tagId    | integer (FK → recipe_tags) | Not null |

### Constraints

- Composite primary key on `(recipeId, tagId)`
- Cascade delete from both sides (deleting a recipe removes assignments; deleting a tag removes assignments)

---

## Computed: NutritionInfo

Computed live at read time from recipe ingredients. Not stored.

```typescript
{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
```

### Computation

For each recipe ingredient:

- `scaledNutrition = ingredient.nutrition * (recipeIngredient.quantity / 100)`
- Null ingredient nutrition values contribute 0
- Total recipe nutrition = sum of all scaled ingredient values
- Per-serving nutrition = total / batchSize

---

## Scaling (Display-Time Only)

Scaling is a pure client-side computation. No server storage.

```typescript
function scaleQuantity(
  baseQuantity: number,
  baseBatchSize: number,
  targetBatchSize: number,
): number {
  return (baseQuantity / baseBatchSize) * targetBatchSize;
}
```

All ingredient quantities in a recipe are stored at the base `batchSize`. When a user selects a different serving count, the UI multiplies each quantity by `(targetServings / batchSize)`.
