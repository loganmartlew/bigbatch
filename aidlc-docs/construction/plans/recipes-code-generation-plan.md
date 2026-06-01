# Unit 3: Recipes — Code Generation Plan

## Sync Note

- Synced against the active source tree on 2026-06-01.
- The recipe unit has been implemented. The authoritative implementation snapshot now lives in `aidlc-docs/construction/recipes/code/code-generation-summary.md`.
- Final web execution used a layout route split (`$recipeId.tsx` + `$recipeId.index.tsx`) and later UX follow-up work added inline ingredient creation, sortable steps, Mantine delete confirmation, duplicate/delete error states, and a shared recipe form.
- API validation coverage landed as route tests plus property-based tests rather than a dedicated `recipes.service.test.ts` file.

## Pre-conditions

- Unit 2 (Ingredients) is implemented and approved
- DB schema has `recipes`, `recipe_instructions`, `recipe_ingredients` tables
- Shared types have `Recipe`, `RecipeIngredient`, `RecipeInstruction`, `NutritionInfo`
- Need to ADD: `recipe_tags` table, `recipe_tag_assignments` table, `source`/`prepTime`/`cookTime` columns on recipes

---

## Steps

- [x] **Step 1**: Schema migration — add `source`, `prepTime`, `cookTime` to recipes table; create `recipe_tags` and `recipe_tag_assignments` tables with relations
- [x] **Step 2**: Shared types update — add `RecipeTag`, update `Recipe` type with new fields; add `RecipeDetail`, `RecipeSummary` response types
- [x] **Step 3**: Shared schemas — create `packages/shared/src/schemas/recipe.ts` with CreateRecipeSchema, UpdateRecipeSchema, RecipeSchema, RecipeSummarySchema, TagSchema
- [x] **Step 4**: Shared nutrition utilities — create `packages/shared/src/nutrition.ts` with `computeIngredientNutrition`, `computeRecipeNutrition`, `computePerServing`
- [x] **Step 5**: Shared scaling utilities — create `packages/shared/src/scaling.ts` with `scaleQuantity`, `scaleIngredients`
- [x] **Step 6**: Recipes service — create `apps/api/src/modules/recipes/recipes.service.ts` with createRecipe, listRecipes, getRecipe, updateRecipe, deleteRecipe, duplicateRecipe, listTags
- [x] **Step 7**: Recipes routes — create `apps/api/src/modules/recipes/recipes.routes.ts` with all endpoint handlers
- [x] **Step 8**: Recipes plugin registration — create `apps/api/src/modules/recipes/index.ts` and register in main server
- [x] **Step 9**: API tests — route coverage plus PBT tests for nutrition/scaling
- [x] **Step 10**: Web API hooks — create `apps/web/src/features/recipes/api.ts` with TanStack Query hooks
- [x] **Step 11**: Recipes list page — `apps/web/src/routes/recipes/index.tsx` with search, tag filter, recipe cards
- [x] **Step 12**: Recipe detail page — implemented as a layout split across `apps/web/src/routes/recipes/$recipeId.tsx` and `apps/web/src/routes/recipes/$recipeId.index.tsx`
- [x] **Step 13**: Recipe create/edit pages — shared form wiring in `apps/web/src/routes/recipes/new.tsx` and `apps/web/src/routes/recipes/$recipeId.edit.tsx`
- [x] **Step 14**: Cook mode — `apps/web/src/routes/recipes/$recipeId.cook.tsx` with step-by-step flow and wake-lock handling
- [x] **Step 15**: Route wiring & nav — regenerate route tree, add Recipes nav link
- [x] **Step 16**: Typecheck, test, documentation summary

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
