# BigBatch — Component Methods

Method signatures for each API module and shared package module. Input/output types reference `packages/shared/types`. Detailed business rules (validation logic, edge cases, error paths) are deferred to Functional Design in the Construction phase.

---

## `apps/api` Modules

### Module: `auth`

| Method                                   | Input                                      | Output                                    | Purpose                                                   |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------- | --------------------------------------------------------- |
| `POST /auth/register`                    | `{ email, password, firstName, lastName }` | `{ user, session }`                       | Create account, hash password (argon2), create session    |
| `POST /auth/login`                       | `{ email, password }`                      | `{ user, session }`                       | Verify credentials, create session                        |
| `POST /auth/logout`                      | `(session cookie)`                         | `204 No Content`                          | Invalidate session                                        |
| `GET /auth/me`                           | `(session cookie)`                         | `{ user, households[] }`                  | Return current user and all households they belong to     |
| `GET /households`                        | `(session cookie)`                         | `{ households[] }`                        | List all households the user belongs to                   |
| `POST /households`                       | `{ name }`                                 | `{ household }`                           | Create household, set current user as owner               |
| `POST /households/join/link`             | `{ token }`                                | `{ household }`                           | Join household via invite link token                      |
| `POST /households/join/code`             | `{ code }`                                 | `{ household }`                           | Join household via invite code                            |
| `POST /households/:id/invites`           | `(owner session)`                          | `{ link, code, expiresAt }`               | Generate invite link and code (owner only)                |
| `GET /households/:id/members`            | `(session)`                                | `{ members[] }`                           | List household members                                    |
| `DELETE /households/:id/members/:userId` | `(owner session)`                          | `204 No Content`                          | Remove member (owner only)                                |

### Module: `recipes`

| Method                        | Input                | Output                             | Purpose                                      |
| ----------------------------- | -------------------- | ---------------------------------- | -------------------------------------------- |
| `POST /recipes`               | `CreateRecipeBody`   | `{ recipe }`                       | Create recipe in household                   |
| `GET /recipes`                | `(session)`          | `{ recipes[] }`                    | List household recipes                       |
| `GET /recipes/:id`            | `(session)`          | `{ recipe, nutrition }`            | Get recipe with computed nutrition           |
| `PUT /recipes/:id`            | `UpdateRecipeBody`   | `{ recipe }`                       | Update recipe fields                         |
| `DELETE /recipes/:id`         | `(session)`          | `204 No Content`                   | Delete recipe (with confirmation)            |
| `POST /recipes/:id/duplicate` | `(session)`          | `{ recipe }`                       | Duplicate recipe                             |
| `POST /recipes/:id/scale`     | `{ targetPortions }` | `{ scaledIngredients, nutrition }` | Scale recipe (does not persist unless saved) |

### Module: `ingredients`

| Method                                  | Input                  | Output              | Purpose                                 |
| --------------------------------------- | ---------------------- | ------------------- | --------------------------------------- |
| `POST /ingredients`                     | `CreateIngredientBody` | `{ ingredient }`    | Create ingredient in household library  |
| `GET /ingredients`                      | `(session)`            | `{ ingredients[] }` | List household ingredients              |
| `GET /ingredients/:id`                  | `(session)`            | `{ ingredient }`    | Get single ingredient                   |
| `PUT /ingredients/:id`                  | `UpdateIngredientBody` | `{ ingredient }`    | Update ingredient (nutrition, category) |
| `DELETE /ingredients/:id`               | `(session)`            | `204 No Content`    | Delete ingredient                       |
| `GET /ingredients/search-openfoodfacts` | `{ query }`            | `{ results[] }`     | Search OpenFoodFacts (cached proxy)     |

### Module: `shopping-list`

| Method                           | Input                       | Output                  | Purpose                                                  |
| -------------------------------- | --------------------------- | ----------------------- | -------------------------------------------------------- |
| `GET /shopping-list`             | `(session)`                 | `{ items[], groups[] }` | Get current household shopping list, grouped by category |
| `POST /shopping-list/add-recipe` | `{ recipeId, portions }`    | `{ items[] }`           | Add recipe ingredients to list (scaled, consolidated)    |
| `PATCH /shopping-list/items/:id` | `{ tickedOff?, haveThis? }` | `{ item }`              | Toggle tick-off or "I have this"                         |
| `DELETE /shopping-list`          | `(session)`                 | `204 No Content`        | Clear entire shopping list                               |

### Module: `cook-events`

| Method                          | Input                         | Output             | Purpose                                    |
| ------------------------------- | ----------------------------- | ------------------ | ------------------------------------------ |
| `POST /recipes/:id/cook-events` | `{ date, batchSize, notes? }` | `{ cookEvent }`    | Log a cook event                           |
| `GET /recipes/:id/cook-events`  | `(session)`                   | `{ cookEvents[] }` | List cook events for recipe (newest first) |

---

## `packages/shared` Modules

### Module: `nutrition`

| Function                       | Input                              | Output          | Purpose                                           |
| ------------------------------ | ---------------------------------- | --------------- | ------------------------------------------------- |
| `calculateTotalNutrition`      | `RecipeIngredient[]`               | `NutritionInfo` | Sum nutrition across all ingredients × quantities |
| `calculatePerPortionNutrition` | `NutritionInfo, batchSize: number` | `NutritionInfo` | Divide total by batch size                        |

### Module: `scaling`

| Function           | Input                                                          | Output               | Purpose                                  |
| ------------------ | -------------------------------------------------------------- | -------------------- | ---------------------------------------- |
| `scaleIngredients` | `RecipeIngredient[], fromPortions: number, toPortions: number` | `ScaledIngredient[]` | Scale quantities by ratio with rounding  |
| `roundQuantity`    | `value: number, unit: Unit`                                    | `number`             | Round to sensible increment for the unit |

### Module: `shopping`

| Function           | Input                                           | Output                               | Purpose                                                                          |
| ------------------ | ----------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `consolidateItems` | `ShoppingListItem[]`                            | `ShoppingListItem[]`                 | Merge duplicate ingredients (same ingredient + same unit) into single line items |
| `addRecipeToList`  | `ShoppingListItem[], Recipe, batchSize: number` | `ShoppingListItem[]`                 | Add scaled recipe ingredients and consolidate                                    |
| `groupByCategory`  | `ShoppingListItem[]`                            | `Record<string, ShoppingListItem[]>` | Group items by shopping category                                                 |

### Module: `schemas`

| Export                    | Type           | Purpose                                                              |
| ------------------------- | -------------- | -------------------------------------------------------------------- |
| `CreateRecipeSchema`      | TypeBox schema | Validate recipe creation request body                                |
| `UpdateRecipeSchema`      | TypeBox schema | Validate recipe update request body                                  |
| `CreateIngredientSchema`  | TypeBox schema | Validate ingredient creation request body                            |
| `UpdateIngredientSchema`  | TypeBox schema | Validate ingredient update request body                              |
| `ScaleRecipeSchema`       | TypeBox schema | Validate scale request body                                          |
| `AddToShoppingListSchema` | TypeBox schema | Validate add-recipe-to-list request body                             |
| `CreateCookEventSchema`   | TypeBox schema | Validate cook event creation                                         |
| `RegisterSchema`          | TypeBox schema | Validate registration request (email, password, firstName, lastName) |
| `LoginSchema`             | TypeBox schema | Validate login request                                               |

### Module: `types`

| Export             | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `Recipe`           | id, name, description, instructions[], batchSize, householdId, createdBy, createdAt, updatedAt |
| `RecipeIngredient` | recipeId, ingredientId, quantity, unit                                                         |
| `Ingredient`       | id, name, defaultUnit, calories, protein, carbs, fat, category, householdId                    |
| `NutritionInfo`    | calories, protein, carbs, fat                                                                  |
| `ShoppingList`     | id, householdId, items[]                                                                       |
| `ShoppingListItem` | id, ingredientId, ingredientName, quantity, unit, category, tickedOff, haveThis                |
| `CookEvent`        | id, recipeId, userId, date, batchSize, notes                                                   |
| `User`             | id, email, firstName, lastName, createdAt                                                      |
| `UserHousehold`    | userId, householdId, role (owner/member), joinedAt                                             |
| `Household`        | id, name, ownerId                                                                              |
| `Unit`             | enum: g, kg, ml, l, tbsp, tsp, cup, item                                                       |
