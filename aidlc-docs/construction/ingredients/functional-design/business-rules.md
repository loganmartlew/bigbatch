# Unit 2: Ingredients — Business Rules

## BR-ING-01: Ingredient Creation Validation

| Rule                     | Detail                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Name required            | `name` must be a non-empty string, trimmed, 1–200 characters                                                           |
| Name uniqueness          | Case-insensitive unique per household; reject creation if a non-deleted ingredient with the same lowercase name exists |
| Default unit required    | `defaultUnit` must be one of the UNITS enum values                                                                     |
| Nutrition optional       | `calories`, `protein`, `carbs`, `fat` are each nullable; if provided, must be ≥ 0                                      |
| Nutrition values per 100 | When provided, nutrition values represent "per 100g" (or per 100ml for volume-based ingredients)                       |
| Category optional        | `categoryId` may be null; if provided, must reference a valid `shopping_categories` row in the same household          |
| Schema validation        | All inputs validated via TypeBox schemas at the API boundary (SECURITY-05)                                             |

---

## BR-ING-02: Ingredient Update Validation

| Rule                      | Detail                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Partial updates allowed   | Only provided fields are updated; omitted fields are unchanged                                     |
| Name uniqueness on rename | If `name` is changed, the new name must pass the same case-insensitive uniqueness check            |
| Nutrition optional        | Same rules as creation: nullable, if provided must be ≥ 0                                          |
| Category reassignment     | `categoryId` can be changed to any valid category in the household, or set to null                 |
| UpdatedAt auto-refresh    | `updatedAt` is set to current timestamp on every update                                            |
| Nutrition propagation     | No explicit propagation needed — recipe nutrition is computed on read from current ingredient data |

---

## BR-ING-03: Ingredient Deletion

| Rule                        | Detail                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| In-use protection           | Cannot delete (soft or hard) if the ingredient is referenced by any `recipe_ingredients` row |
| Soft-delete mechanism       | Sets `deletedAt` to current timestamp; row remains in DB                                     |
| Already-deleted idempotency | If already soft-deleted, return success (no error)                                           |
| List exclusion              | Soft-deleted ingredients are excluded from library list queries                              |
| Restore not required        | No undelete/restore endpoint in this unit (future if needed)                                 |

---

## BR-ING-04: Ingredient Name Uniqueness

| Rule              | Detail                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Scope             | Per household — different households may have identically-named ingredients                                                       |
| Comparison        | Case-insensitive (`LOWER(name)` comparison)                                                                                       |
| Enforcement layer | Service layer (query before insert/update); no DB-level unique index on name alone since the column isn't lowered at the DB level |
| Deleted excluded  | Only non-deleted ingredients participate in uniqueness checks                                                                     |

---

## BR-ING-05: Shopping Category Rules

| Rule                               | Detail                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Default categories immutable names | Default categories (isDefault=true) cannot be renamed                                             |
| Default categories undeletable     | Default categories cannot be deleted                                                              |
| Custom category creation           | Household members can create additional categories with unique names                              |
| Custom category rename             | Custom categories (isDefault=false) can be renamed; new name must be unique in household          |
| Custom category reorder            | Any category's `sortOrder` can be changed                                                         |
| Custom category deletion           | Allowed only if no ingredients are assigned to it; ingredients must be reassigned first           |
| Name uniqueness                    | Enforced by existing unique index `shopping_categories_household_name_idx` on (householdId, name) |
| Sort order auto-assign             | New categories get `sortOrder = max(existing) + 1` unless explicitly specified                    |

---

## BR-ING-06: OpenFoodFacts Search

| Rule                       | Detail                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Search modes               | Text search by product name, barcode lookup by numeric string, barcode scan via camera                     |
| No caching                 | Results are fetched fresh from OpenFoodFacts API on each request                                           |
| Graceful degradation       | If OFF API is unreachable or returns error, return an empty results array with an error flag (SECURITY-15) |
| Data mapping (minimal)     | Extract: product name, calories, protein, carbs, fat (all per 100g)                                        |
| Missing nutrition          | If any macro is missing from OFF response, default to 0 for that field                                     |
| Result limit               | Return max 20 results per search to keep responses fast                                                    |
| User confirmation required | OFF results pre-fill the form; user must confirm/edit before saving                                        |
| Rate limiting              | Respect OFF API fair-use guidelines (no more than ~100 requests/minute)                                    |

---

## BR-ING-07: Household Scope Authorization

| Rule                            | Detail                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| All operations household-scoped | Every ingredient CRUD operation requires a valid `X-Household-Id` header             |
| Membership validation           | The authenticated user must be a member of the specified household                   |
| Cross-household isolation       | A user cannot read, modify, or delete ingredients belonging to a different household |
| Consistent with core module     | Relies on existing `household-resolver.ts` middleware (no ad-hoc parsing)            |

---

## BR-ING-08: Nutrition Computation on Recipe Read

| Rule                        | Detail                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Computed, not stored        | Recipe nutrition is calculated at read time from current ingredient data                                                                                                   |
| Formula per ingredient      | `macroContribution = (recipeIngredient.quantity / 100) * (ingredient.[macro] ?? 0)`                                                                                        |
| Total recipe nutrition      | Sum of all ingredient contributions                                                                                                                                        |
| Per-portion nutrition       | `totalNutrition / recipe.batchSize`                                                                                                                                        |
| Null handling               | Null nutrition values are treated as 0 in computation; recipes may have partial nutrition data                                                                             |
| Ingredient edit propagation | Because nutrition is computed on read, editing an ingredient's macros automatically affects all recipes using it — no explicit propagation step needed (satisfies FR-02.5) |

---

## BR-ING-09: Barcode Scanning (Web)

| Rule              | Detail                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Browser API       | Use Web `BarcodeDetector` API or a JS library fallback (e.g., `@nicolo-ribaudo/quagga2` or similar) |
| Camera permission | Must request camera permission; handle denial gracefully                                            |
| Supported formats | EAN-13, EAN-8, UPC-A (standard food barcodes)                                                       |
| Result handling   | Detected barcode triggers an OFF barcode lookup automatically                                       |
| Fallback          | If camera/BarcodeDetector not available, user can manually type the barcode number                  |

---

## PBT Properties (Unit 2)

| ID     | Type      | Property                                                                                                                                                   |
| ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PBT-03 | Invariant | After editing an ingredient's nutrition, for every recipe using it: `recipe.totalNutrition == sum((ingredient.[macro] ?? 0) * quantity / 100 for each ri)` |
