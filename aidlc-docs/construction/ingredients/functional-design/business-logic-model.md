# Unit 2: Ingredients — Business Logic Model

## Service: `ingredients`

### Operation: createIngredient

**Input**: `householdId`, `{ name, defaultUnit, calories?, protein?, carbs?, fat?, categoryId? }`  
**Output**: Created `Ingredient` object  
**Authorization**: Authenticated user, member of household

```text
1. Trim name; validate length 1–200
2. Validate defaultUnit ∈ UNITS
3. If nutrition values provided: validate each ≥ 0
4. If categoryId provided: verify category exists in same household
5. Check uniqueness: query ingredients WHERE householdId = ? AND LOWER(name) = LOWER(?) AND deletedAt IS NULL
6. If duplicate found → ValidationError("Ingredient name already exists")
7. INSERT ingredient row
8. Return created ingredient with category info
```

---

### Operation: listIngredients

**Input**: `householdId`  
**Output**: Array of active `Ingredient` objects with category name  
**Authorization**: Authenticated user, member of household

```text
1. SELECT * FROM ingredients WHERE householdId = ? AND deletedAt IS NULL
2. JOIN shopping_categories for category name
3. ORDER BY name ASC (case-insensitive)
4. Return full list (client handles virtual scrolling and filtering)
```

---

### Operation: getIngredient

**Input**: `householdId`, `ingredientId`  
**Output**: Single `Ingredient` object with category  
**Authorization**: Authenticated user, member of household

```text
1. SELECT ingredient WHERE id = ? AND householdId = ? AND deletedAt IS NULL
2. If not found → NotFoundError
3. Return ingredient with category info
```

---

### Operation: updateIngredient

**Input**: `householdId`, `ingredientId`, partial `{ name?, defaultUnit?, calories?, protein?, carbs?, fat?, categoryId? }`  
**Output**: Updated `Ingredient` object  
**Authorization**: Authenticated user, member of household

```text
1. Fetch existing ingredient (must exist, active, same household)
2. If name changed: validate length, check case-insensitive uniqueness (exclude self)
3. If defaultUnit changed: validate ∈ UNITS
4. If nutrition fields provided: validate each ≥ 0 (null allowed to clear)
5. If categoryId changed: verify category exists in same household (or null to unset)
6. UPDATE ingredient SET ... , updatedAt = now()
7. Return updated ingredient
```

---

### Operation: deleteIngredient

**Input**: `householdId`, `ingredientId`  
**Output**: void (204)  
**Authorization**: Authenticated user, member of household

```text
1. Fetch ingredient (must exist, active, same household)
2. Check usage: SELECT COUNT(*) FROM recipe_ingredients WHERE ingredientId = ?
3. If count > 0 → ConflictError("Ingredient is used by N recipe(s) and cannot be deleted")
4. UPDATE ingredient SET deletedAt = now()
5. Return 204
```

---

### Operation: searchOpenFoodFacts

**Input**: `query` (text string or barcode number)  
**Output**: Array of OFF result objects (max 20)  
**Authorization**: Authenticated user (no household scope needed for search)

```text
1. Determine search type:
   - If query matches /^\d{8,13}$/ → barcode lookup
   - Otherwise → text search
2. Call OpenFoodFacts API:
   - Barcode: GET https://world.openfoodfacts.org/api/v2/product/{barcode}
   - Text: GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1&page_size=20
3. If API error/timeout → return { results: [], error: true, message: "OpenFoodFacts unavailable" }
4. Map response → extract for each product:
   - name: product_name or generic_name
   - calories: nutriments.energy-kcal_100g ?? 0
   - protein: nutriments.proteins_100g ?? 0
   - carbs: nutriments.carbohydrates_100g ?? 0
   - fat: nutriments.fat_100g ?? 0
5. Return mapped results array (max 20)
```

---

## Service: `shopping-categories`

### Operation: listCategories

**Input**: `householdId`  
**Output**: Ordered array of `ShoppingCategory` objects  
**Authorization**: Authenticated user, member of household

```text
1. SELECT * FROM shopping_categories WHERE householdId = ? ORDER BY sortOrder ASC
2. Return array
```

---

### Operation: createCategory

**Input**: `householdId`, `{ name }`  
**Output**: Created `ShoppingCategory` object  
**Authorization**: Authenticated user, member of household

```text
1. Trim name; validate length 1–100
2. Uniqueness enforced by DB index (householdId, name)
3. Compute sortOrder = max(existing sortOrders) + 1
4. INSERT shopping_categories row with isDefault = false
5. Return created category
```

---

### Operation: updateCategory

**Input**: `householdId`, `categoryId`, `{ name?, sortOrder? }`  
**Output**: Updated `ShoppingCategory` object  
**Authorization**: Authenticated user, member of household

```text
1. Fetch category (must exist, same household)
2. If category.isDefault AND name is being changed → ForbiddenError("Cannot rename default categories")
3. If name changed: validated by unique index on insert/update
4. If sortOrder changed: update field
5. UPDATE category
6. Return updated category
```

---

### Operation: deleteCategory

**Input**: `householdId`, `categoryId`  
**Output**: void (204)  
**Authorization**: Authenticated user, member of household

```text
1. Fetch category (must exist, same household)
2. If category.isDefault → ForbiddenError("Cannot delete default categories")
3. Check usage: SELECT COUNT(*) FROM ingredients WHERE categoryId = ? AND deletedAt IS NULL
4. If count > 0 → ConflictError("Category has N ingredient(s) assigned; reassign them first")
5. DELETE FROM shopping_categories WHERE id = ?
6. Return 204
```

---

### Operation: reorderCategories

**Input**: `householdId`, `orderedIds: number[]`  
**Output**: void (204)  
**Authorization**: Authenticated user, member of household

```text
1. Validate all IDs belong to the household
2. UPDATE each category's sortOrder to match its index in the array
3. Return 204
```

---

## API Route Contracts

### Ingredients

| Method | Path                                | Body/Params            | Response                        | Status        |
| ------ | ----------------------------------- | ---------------------- | ------------------------------- | ------------- |
| GET    | `/ingredients`                      | —                      | `{ data: [...] }`               | 200           |
| GET    | `/ingredients/:id`                  | —                      | `{ data: {...} }`               | 200 / 404     |
| POST   | `/ingredients`                      | CreateIngredientSchema | `{ data: {...} }`               | 201 / 409     |
| PATCH  | `/ingredients/:id`                  | UpdateIngredientSchema | `{ data: {...} }`               | 200 / 404/409 |
| DELETE | `/ingredients/:id`                  | —                      | —                               | 204 / 404/409 |
| GET    | `/ingredients/search/openfoodfacts` | `?q=...`               | `{ data: [...], error?: bool }` | 200           |

### Shopping Categories

| Method | Path                           | Body/Params                | Response          | Status        |
| ------ | ------------------------------ | -------------------------- | ----------------- | ------------- |
| GET    | `/shopping-categories`         | —                          | `{ data: [...] }` | 200           |
| POST   | `/shopping-categories`         | `{ name }`                 | `{ data: {...} }` | 201 / 409     |
| PATCH  | `/shopping-categories/:id`     | `{ name?, sortOrder? }`    | `{ data: {...} }` | 200 / 403/404 |
| DELETE | `/shopping-categories/:id`     | —                          | —                 | 204 / 403/409 |
| PUT    | `/shopping-categories/reorder` | `{ orderedIds: number[] }` | —                 | 204           |

All household-scoped routes require the `X-Household-Id` header and validate membership via existing middleware.

---

## Error Codes

| Error            | HTTP | When                                                      |
| ---------------- | ---- | --------------------------------------------------------- |
| ValidationError  | 400  | Invalid input (name length, negative nutrition, bad unit) |
| NotFoundError    | 404  | Ingredient/category not found or soft-deleted             |
| ConflictError    | 409  | Name uniqueness violation, delete-while-in-use            |
| ForbiddenError   | 403  | Attempt to rename/delete a default category               |
| ExternalApiError | 200  | OFF unavailable (returned in body with `error: true`)     |
