# Unit 2: Ingredients — Code Generation Summary

## Overview

Unit 2 implements the Ingredients domain slice including ingredient CRUD, shopping category management, OpenFoodFacts integration, and a full web UI with barcode scanning.

## Files Created

### packages/shared

| File                               | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `src/schemas/ingredient.ts`        | TypeBox schemas for ingredient API validation |
| `src/schemas/shopping-category.ts` | TypeBox schemas for category API validation   |

### apps/api

| File                                                            | Purpose                                               |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `src/modules/ingredients/index.ts`                              | Fastify plugin combining ingredient + category routes |
| `src/modules/ingredients/ingredients.routes.ts`                 | Ingredient CRUD + OFF search routes                   |
| `src/modules/ingredients/ingredients.service.ts`                | Ingredient business logic + OFF API client            |
| `src/modules/ingredients/categories.routes.ts`                  | Shopping category CRUD + reorder routes               |
| `src/modules/ingredients/categories.service.ts`                 | Category business logic                               |
| `src/modules/ingredients/__tests__/ingredients.service.test.ts` | Unit tests for ingredient service                     |
| `src/modules/ingredients/__tests__/categories.service.test.ts`  | Unit tests for category service                       |
| `src/modules/ingredients/__tests__/ingredients.pbt.test.ts`     | PBT-03 nutrition computation invariant                |
| `drizzle/0001_keen_romulus.sql`                                 | Migration making nutrition columns nullable           |

### apps/web

| File                                                       | Purpose                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| `src/features/ingredients/api.ts`                          | TanStack Query hooks for all ingredient/category operations |
| `src/features/ingredients/components/off-search.tsx`       | OpenFoodFacts search with tabs (search/barcode/scan)        |
| `src/features/ingredients/components/barcode-scanner.tsx`  | Camera + BarcodeDetector API                                |
| `src/features/ingredients/components/category-manager.tsx` | Modal with category CRUD + drag reorder                     |
| `src/routes/ingredients/index.tsx`                         | Ingredient library page                                     |
| `src/routes/ingredients/new.tsx`                           | Create ingredient form                                      |
| `src/routes/ingredients/$ingredientId.edit.tsx`            | Edit ingredient form                                        |

## Files Modified

| File                                              | Change                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| `packages/shared/src/index.ts`                    | Re-export ingredient and shopping-category schemas |
| `packages/shared/src/types/index.ts`              | Nutrition fields changed to `number \| null`       |
| `apps/api/src/db/schema.ts`                       | Removed `.notNull()` from nutrition columns        |
| `apps/api/src/index.ts`                           | Register `ingredientsPlugin`                       |
| `apps/api/src/modules/core/household-resolver.ts` | Added OFF search to AUTH_ONLY_ROUTES               |
| `apps/web/src/routes/__root.tsx`                  | Added Ingredients nav link                         |

## API Endpoints

| Method | Path                              | Description                                     |
| ------ | --------------------------------- | ----------------------------------------------- |
| GET    | /ingredients                      | List household ingredients (with category join) |
| GET    | /ingredients/:id                  | Get single ingredient                           |
| POST   | /ingredients                      | Create ingredient (unique name check)           |
| PATCH  | /ingredients/:id                  | Update ingredient (partial)                     |
| DELETE | /ingredients/:id                  | Soft-delete (blocks if used in recipes)         |
| GET    | /ingredients/search/openfoodfacts | Search OFF by name or barcode                   |
| GET    | /shopping-categories              | List household categories                       |
| POST   | /shopping-categories              | Create category                                 |
| PATCH  | /shopping-categories/:id          | Update category (blocks default rename)         |
| DELETE | /shopping-categories/:id          | Delete category (blocks default + in-use)       |
| PUT    | /shopping-categories/reorder      | Bulk reorder categories                         |

## Testing

- **Unit tests**: 48 passing (ingredients.service + categories.service)
- **PBT**: 2 property tests (nutrition scales linearly, null values contribute zero)
- **Typecheck**: All packages pass

## Design Decisions

- Nutrition fields (calories, protein, carbs, fat) are all optional/nullable per user request
- OFF search uses barcode detection regex to auto-switch between name/barcode lookup
- Ingredient deletion is soft-delete via `deletedAt` column
- Shopping categories seed defaults on household creation (already existed)
- Category reorder uses batch sort-order update
