# Unit 3: Recipes — Business Logic Model

## Service Functions

### recipes.service.ts

| Function          | Inputs                        | Output          | Description                                                            |
| ----------------- | ----------------------------- | --------------- | ---------------------------------------------------------------------- |
| `createRecipe`    | householdId, userId, data     | RecipeDetail    | Creates recipe + instructions + ingredients + tags atomically          |
| `listRecipes`     | householdId, filters?         | RecipeSummary[] | Lists non-deleted recipes with optional search/tag filter              |
| `getRecipe`       | householdId, recipeId         | RecipeDetail    | Full recipe with instructions, ingredients (enriched), tags, nutrition |
| `updateRecipe`    | householdId, recipeId, data   | RecipeDetail    | Partial update, replaces sub-collections if provided                   |
| `deleteRecipe`    | householdId, recipeId         | void            | Soft-delete                                                            |
| `duplicateRecipe` | householdId, userId, recipeId | RecipeDetail    | Deep copy with "(copy)" suffix                                         |
| `listTags`        | householdId                   | TagWithCount[]  | All household tags with recipe usage counts                            |

### nutrition.ts (shared utility in packages/shared)

| Function                     | Inputs                                   | Output        | Description                                    |
| ---------------------------- | ---------------------------------------- | ------------- | ---------------------------------------------- |
| `computeIngredientNutrition` | ingredient nutrition, quantity           | NutritionInfo | Scale nutrition for a single recipe ingredient |
| `computeRecipeNutrition`     | recipeIngredients (with ingredient data) | NutritionInfo | Sum all ingredient nutrition                   |
| `computePerServing`          | totalNutrition, batchSize                | NutritionInfo | Divide total by servings                       |

### scaling.ts (shared utility in packages/shared)

| Function           | Inputs                                        | Output             | Description                     |
| ------------------ | --------------------------------------------- | ------------------ | ------------------------------- |
| `scaleQuantity`    | baseQuantity, baseBatchSize, targetBatchSize  | number             | Scale a single quantity         |
| `scaleIngredients` | ingredients[], baseBatchSize, targetBatchSize | ScaledIngredient[] | Scale all ingredient quantities |

---

## Data Flow: Create Recipe

```
POST /recipes
  → validate body (CreateRecipeSchema)
  → resolve household (X-Household-Id)
  → begin transaction
    → INSERT recipe row
    → IF instructions: INSERT recipe_instructions (bulk)
    → IF ingredients: INSERT recipe_ingredients (bulk, validate ingredientIds exist in household)
    → IF tags: upsert tags (find-or-create by name in household), INSERT recipe_tag_assignments
  → commit transaction
  → fetch full recipe detail (with joins)
  → return { data: recipeDetail }
```

## Data Flow: Get Recipe (with nutrition)

```
GET /recipes/:id
  → resolve household
  → SELECT recipe WHERE id = :id AND householdId = :hid AND deletedAt IS NULL
  → 404 if not found
  → SELECT recipe_instructions ORDER BY stepNumber
  → SELECT recipe_ingredients JOIN ingredients (get name + nutrition)
  → SELECT recipe_tag_assignments JOIN recipe_tags (get tag names)
  → compute nutrition live:
    → for each recipe_ingredient: scale ingredient nutrition by quantity
    → sum into total NutritionInfo
  → return { data: { ...recipe, instructions, ingredients, tags, nutrition } }
```

## Data Flow: List Recipes (with filters)

```
GET /recipes?search=...&tags=...
  → resolve household
  → base query: SELECT recipes WHERE householdId = :hid AND deletedAt IS NULL
  → IF search: AND LOWER(name) LIKE '%' || LOWER(:search) || '%'
  → IF tags: AND recipe has ALL specified tags (subquery)
  → SELECT tag names for each recipe (batch)
  → return { data: recipeSummaries[] }
```

## Data Flow: Update Recipe

```
PATCH /recipes/:id
  → validate body (UpdateRecipeSchema)
  → resolve household
  → SELECT recipe (verify exists + ownership)
  → begin transaction
    → UPDATE recipe fields (only provided ones)
    → IF instructions provided: DELETE all + re-INSERT
    → IF ingredients provided: DELETE all + re-INSERT (validate ingredientIds)
    → IF tags provided: DELETE all assignments + upsert tags + INSERT assignments
    → UPDATE updatedAt
  → commit transaction
  → fetch full recipe detail
  → return { data: recipeDetail }
```

## Data Flow: Duplicate Recipe

```
POST /recipes/:id/duplicate
  → resolve household
  → SELECT source recipe (full detail)
  → 404 if not found or deleted
  → begin transaction
    → INSERT new recipe with name "{name} (copy)", createdBy = current user
    → COPY instructions, ingredients, tag assignments
  → commit transaction
  → fetch full new recipe detail
  → return { data: newRecipeDetail }
```

## Data Flow: Delete Recipe

```
DELETE /recipes/:id
  → resolve household
  → SELECT recipe (verify exists + ownership)
  → UPDATE recipes SET deletedAt = datetime('now') WHERE id = :id
  → return 204
```

---

## Error Cases

| Scenario                          | Error Code           | HTTP Status |
| --------------------------------- | -------------------- | ----------- |
| Recipe not found (or deleted)     | RECIPE_NOT_FOUND     | 404         |
| Ingredient not found in household | INGREDIENT_NOT_FOUND | 400         |
| Not a household member            | FORBIDDEN            | 403         |
| Not authenticated                 | UNAUTHORIZED         | 401         |
| Invalid input                     | VALIDATION_ERROR     | 400         |

---

## Property-Based Testing Targets (PBT)

### PBT-04: Nutrition computation is additive

For any set of recipe ingredients with known nutrition, the total recipe nutrition equals the sum of individual scaled nutritions.

### PBT-05: Scaling is reversible

For any recipe with batchSize B scaled to target T, scaling back to B produces the original quantities (within floating-point tolerance).

### PBT-06: Per-serving nutrition is invariant under scaling

For any recipe, `computePerServing(computeRecipeNutrition(ingredients), batchSize)` produces the same result regardless of what target batchSize the UI shows.

### PBT-07: Duplicate produces independent copy

After duplication, modifying the duplicate's ingredients/instructions/tags does not affect the original (verified via separate DB reads — integration-level).
