# BigBatch — Unit of Work Dependencies

## Dependency Matrix

| Unit                     | Depends On                             | Reason                                                                                                |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unit 0: Foundation       | —                                      | No dependencies; project scaffolding and infrastructure                                               |
| Unit 1: Auth & Household | Unit 0                                 | Requires server skeleton, DB schema, core middleware                                                  |
| Unit 2: Ingredients      | Unit 0, Unit 1                         | Requires auth (protected endpoints) and DB schema                                                     |
| Unit 3: Recipes          | Unit 0, Unit 1, Unit 2                 | Recipes reference ingredients; requires auth                                                          |
| Unit 4: Shopping         | Unit 0, Unit 1, Unit 2, Unit 3         | Shopping lists reference recipes and ingredients                                                      |
| Unit 5: Cook Events      | Unit 0, Unit 1, Unit 2, Unit 3, Unit 4 | Queued cooks reference recipes and ingredient snapshots, and readiness depends on shopping-list state |

## Execution Order (strict)

```
Unit 0: Foundation
    |
    v
Unit 1: Auth & Household
    |
    v
Unit 2: Ingredients
    |
    v
Unit 3: Recipes
    |
    v
Unit 4: Shopping
    |
    v
Unit 5: Cook Events
```

**Notes**:

- Unit 5 now depends on Unit 4 because queued-cook readiness and cleanup are derived from the consolidated shopping list.
- Within each unit, web and mobile client work is independent and can be done in parallel (Q2=C).

## Shared Package Build-Up

The `packages/shared` module grows incrementally across units:

| Unit   | Shared additions                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------- |
| Unit 0 | Base types (`User`, `UserHousehold`, `Household`, `Unit` enum), base schemas                       |
| Unit 1 | `RegisterSchema`, `LoginSchema`, auth-related type refinements                                     |
| Unit 2 | `Ingredient` type, `CreateIngredientSchema`, `UpdateIngredientSchema`                              |
| Unit 3 | `Recipe` types, recipe schemas, `nutrition` module, `scaling` module                               |
| Unit 4 | `shopping` module (`consolidateItems`, `addRecipeToList`, `groupByCategory`)                       |
| Unit 5 | `CookEvent` plus queued-cook types, dashboard response types, and queued-cook / cook-event schemas |

## API Module Build Order

Within the API, modules are built in this order (Q4=B):

1. `core` (Unit 0) — middleware, error handler, auth guard skeleton
2. `auth` (Unit 1) — registration, login, sessions, households
3. `ingredients` (Unit 2) — CRUD, OpenFoodFacts proxy
4. `recipes` (Unit 3) — CRUD, scale, duplicate, nutrition
5. `shopping-list` (Unit 4) — add recipe, consolidate, tick, clear
6. `cook-events` (Unit 5) — queue, readiness, cook-mode completion, history

## Cross-Unit Integration Points

| Integration Point       | Producer                    | Consumer                                | Mechanism                                                             |
| ----------------------- | --------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Auth session validation | Unit 1 (auth)               | All subsequent                          | Core middleware (onRequest hook)                                      |
| Household ID resolution | Unit 1 (auth)               | All subsequent                          | X-Household-Id header + middleware                                    |
| Ingredient lookup       | Unit 2                      | Unit 3 (recipes)                        | DB join (recipe_ingredients → ingredients)                            |
| Recipe lookup           | Unit 3                      | Unit 4 (shopping), Unit 5 (cook-events) | DB query by recipeId                                                  |
| Shopping state          | Unit 4                      | Unit 5 (cook-events)                    | DB query by `(householdId, ingredientId, unit)` plus completion flags |
| Shared pure functions   | Unit 3 (nutrition, scaling) | Unit 4 (shopping), Unit 5 (cook-events) | Import from packages/shared                                           |
