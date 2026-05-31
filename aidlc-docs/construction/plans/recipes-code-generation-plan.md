# Unit 3: Recipes — Code Generation Plan

## Pre-conditions

- Unit 2 (Ingredients) is implemented and approved
- DB schema has `recipes`, `recipe_instructions`, `recipe_ingredients` tables
- Shared types have `Recipe`, `RecipeIngredient`, `RecipeInstruction`, `NutritionInfo`
- Need to ADD: `recipe_tags` table, `recipe_tag_assignments` table, `source`/`prepTime`/`cookTime` columns on recipes

---

## Steps

- [ ] **Step 1**: Schema migration — add `source`, `prepTime`, `cookTime` to recipes table; create `recipe_tags` and `recipe_tag_assignments` tables with relations
- [ ] **Step 2**: Shared types update — add `RecipeTag`, update `Recipe` type with new fields; add `RecipeDetail`, `RecipeSummary` response types
- [ ] **Step 3**: Shared schemas — create `packages/shared/src/schemas/recipe.ts` with CreateRecipeSchema, UpdateRecipeSchema, RecipeSchema, RecipeSummarySchema, TagSchema
- [ ] **Step 4**: Shared nutrition utilities — create `packages/shared/src/nutrition.ts` with `computeIngredientNutrition`, `computeRecipeNutrition`, `computePerServing`
- [ ] **Step 5**: Shared scaling utilities — create `packages/shared/src/scaling.ts` with `scaleQuantity`, `scaleIngredients`
- [ ] **Step 6**: Recipes service — create `apps/api/src/modules/recipes/recipes.service.ts` with createRecipe, listRecipes, getRecipe, updateRecipe, deleteRecipe, duplicateRecipe, listTags
- [ ] **Step 7**: Recipes routes — create `apps/api/src/modules/recipes/recipes.routes.ts` with all endpoint handlers
- [ ] **Step 8**: Recipes plugin registration — create `apps/api/src/modules/recipes/index.ts` and register in main server
- [ ] **Step 9**: API unit tests — `recipes.service.test.ts` + PBT tests for nutrition/scaling
- [ ] **Step 10**: Web API hooks — create `apps/web/src/features/recipes/api.ts` with TanStack Query hooks
- [ ] **Step 11**: Recipes list page — `apps/web/src/routes/recipes/index.tsx` with search, tag filter, recipe cards
- [ ] **Step 12**: Recipe detail page — `apps/web/src/routes/recipes/$recipeId.tsx` with full detail, nutrition, scaling UI
- [ ] **Step 13**: Recipe create/edit pages — `apps/web/src/routes/recipes/new.tsx` and `$recipeId.edit.tsx` with dynamic ingredient/step forms
- [ ] **Step 14**: Cook mode — `apps/web/src/routes/recipes/$recipeId.cook.tsx` with step-by-step, wake-lock, progress
- [ ] **Step 15**: Route wiring & nav — regenerate route tree, add Recipes nav link
- [ ] **Step 16**: Typecheck, test, documentation summary

---

## Step Details

### Step 1: Schema migration

**Files**: `apps/api/src/db/schema.ts`

- Add to `recipes` table: `source text('source')`, `prepTime integer('prep_time')`, `cookTime integer('cook_time')`
- Create `recipeTags` table: `id`, `householdId`, `name`, unique index on `(householdId, name)`
- Create `recipeTagAssignments` table: composite PK `(recipeId, tagId)`, cascade deletes
- Add relations for new tables
- Generate migration with `pnpm db:generate`

### Step 2: Shared types update

**Files**: `packages/shared/src/types/index.ts`

- Update `Recipe` interface: add `source`, `prepTime`, `cookTime`
- Add `RecipeTag` interface: `{ id, householdId, name }`
- Add `RecipeDetail` interface (full response with instructions, ingredients, tags, nutrition)
- Add `RecipeSummary` interface (list response)
- Add `RecipeIngredientDetail` (enriched with ingredient name + nutrition)

### Step 3: Shared schemas

**Files**: `packages/shared/src/schemas/recipe.ts`, update `packages/shared/src/index.ts`

- `CreateRecipeSchema`: name (required), description, source, prepTime, cookTime, batchSize (required), instructions (string[]), ingredients ({ingredientId, quantity, unit}[]), tags (string[])
- `UpdateRecipeSchema`: all fields optional
- `RecipeFiltersSchema`: search (string), tags (string)
- Re-export from index

### Step 4: Shared nutrition utilities

**Files**: `packages/shared/src/nutrition.ts`, update `packages/shared/src/index.ts`

- `computeIngredientNutrition(nutrition: {calories, protein, carbs, fat} | null, quantity: number): NutritionInfo`
- `computeRecipeNutrition(items: {nutrition, quantity}[]): NutritionInfo`
- `computePerServing(total: NutritionInfo, batchSize: number): NutritionInfo`
- Pure functions, no dependencies

### Step 5: Shared scaling utilities

**Files**: `packages/shared/src/scaling.ts`, update `packages/shared/src/index.ts`

- `scaleQuantity(baseQuantity, baseBatchSize, targetBatchSize): number`
- `scaleIngredients(ingredients, baseBatchSize, targetBatchSize): ScaledIngredient[]`
- Pure functions

### Step 6: Recipes service

**Files**: `apps/api/src/modules/recipes/recipes.service.ts`

- `createRecipe`: transaction — insert recipe + instructions + ingredients + tags
- `listRecipes`: query with optional search/tag filters, join tags for summary
- `getRecipe`: full detail with joins + live nutrition computation
- `updateRecipe`: transaction — update fields + replace sub-collections if provided
- `deleteRecipe`: soft-delete
- `duplicateRecipe`: transaction — deep copy with "(copy)" suffix
- `listTags`: all household tags with COUNT of assignments

### Step 7: Recipes routes

**Files**: `apps/api/src/modules/recipes/recipes.routes.ts`

| Method | Path                   | Handler         |
| ------ | ---------------------- | --------------- |
| GET    | /recipes               | listRecipes     |
| GET    | /recipes/:id           | getRecipe       |
| POST   | /recipes               | createRecipe    |
| PATCH  | /recipes/:id           | updateRecipe    |
| DELETE | /recipes/:id           | deleteRecipe    |
| POST   | /recipes/:id/duplicate | duplicateRecipe |
| GET    | /tags                  | listTags        |

### Step 8: Plugin registration

**Files**: `apps/api/src/modules/recipes/index.ts`, `apps/api/src/index.ts`

- Export `recipesPlugin` wrapping routes
- Register in main server after ingredients plugin

### Step 9: API unit tests

**Files**: `apps/api/src/modules/recipes/__tests__/recipes.service.test.ts`, `recipes.pbt.test.ts`

- Unit tests: CRUD operations with mocked DB
- PBT-04: Nutrition computation is additive
- PBT-05: Scaling is reversible
- PBT-06: Per-serving invariant under scaling

### Step 10: Web API hooks

**Files**: `apps/web/src/features/recipes/api.ts`

- `useRecipes(filters?)`, `useRecipe(id)`, `useCreateRecipe()`, `useUpdateRecipe()`, `useDeleteRecipe()`, `useDuplicateRecipe()`, `useTags()`

### Step 11: Recipes list page

**Files**: `apps/web/src/routes/recipes/index.tsx`

- Search input, tag filter (multi-select from existing tags)
- Recipe cards showing name, description snippet, prepTime+cookTime, tags
- Link to detail, create button

### Step 12: Recipe detail page

**Files**: `apps/web/src/routes/recipes/$recipeId.tsx`

- Full recipe display: name, description, source, times, tags
- Ingredient list with quantities (scalable)
- Serving scaler (number input adjusts displayed quantities)
- Nutrition panel (total + per-serving)
- Instructions as numbered list
- Actions: Edit, Duplicate, Cook Mode, Delete
- Scaling is purely display-time in the component state

### Step 13: Recipe create/edit pages

**Files**: `apps/web/src/routes/recipes/new.tsx`, `apps/web/src/routes/recipes/$recipeId.edit.tsx`

- React Hook Form with dynamic field arrays for ingredients and steps
- Ingredient picker (select from household ingredients)
- Tag input (combobox with existing tags + create new)
- Validation from shared TypeBox schemas

### Step 14: Cook mode

**Files**: `apps/web/src/routes/recipes/$recipeId.cook.tsx`

- Full-screen layout
- Step-by-step navigation (prev/next)
- Step completion checkboxes
- Collapsible ingredient sidebar
- Wake-lock via `navigator.wakeLock` (with fallback)
- Exit button returns to recipe detail

### Step 15: Route wiring & nav

- Run vite build to regenerate route tree
- Add "Recipes" nav link in `__root.tsx`

### Step 16: Finalize

- Run `pnpm typecheck`
- Run `pnpm test`
- Fix any issues
- Create `aidlc-docs/construction/recipes/code/code-generation-summary.md`
- Update `aidlc-docs/aidlc-state.md`
