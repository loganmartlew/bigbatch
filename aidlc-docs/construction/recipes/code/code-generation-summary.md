# Unit 3: Recipes — Code Generation Summary

## Sync Note

- Synced against the current source tree on 2026-06-01.
- This summary reflects the active workspace only: `apps/api`, `apps/web`, and `packages/shared`.
- Unit 3 is implemented in source and marked approved in `aidlc-docs/aidlc-state.md`.
- The web slice includes post-implementation UX fixes completed after the initial recipe delivery.

## Overview

Unit 3 implements the Recipes domain slice including recipe CRUD, duplication, tag filtering, computed nutrition, serving-size scaling, cook mode, and shared recipe create/edit flows on the web.

## Files Created

### Shared (`packages/shared/`)

| File                    | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `src/schemas/recipe.ts` | TypeBox schemas for recipe create/update/filter validation                  |
| `src/nutrition.ts`      | Pure nutrition helpers for ingredient, total-recipe, and per-serving values |
| `src/scaling.ts`        | Pure scaling helpers for recipe quantities                                  |

### API (`apps/api/`)

| File                                                   | Purpose                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `drizzle/0002_kind_thundra.sql`                        | Migration adding recipe tags and recipe metadata columns              |
| `src/modules/recipes/index.ts`                         | Fastify plugin registering recipe routes                              |
| `src/modules/recipes/recipes.routes.ts`                | Recipe CRUD, duplicate, and tag-list endpoints                        |
| `src/modules/recipes/recipes.service.ts`               | Recipe business logic, nutrition assembly, duplication, and tag logic |
| `src/modules/recipes/__tests__/recipes.routes.test.ts` | Route tests covering authenticated create and duplicate flows         |
| `src/modules/recipes/__tests__/recipes.pbt.test.ts`    | Property tests for nutrition additivity and scaling invariants        |

### Web (`apps/web/`)

| File                                                              | Purpose                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/features/recipes/api.ts`                                     | TanStack Query hooks for recipe queries and mutations                    |
| `src/features/recipes/components/ingredient-picker.tsx`           | Searchable ingredient combobox with inline create action                 |
| `src/features/recipes/components/sortable-step.tsx`               | Drag-and-drop instruction row using dnd-kit                              |
| `src/features/recipes/components/confirm-delete-recipe-modal.tsx` | Mantine confirmation modal for recipe deletion                           |
| `src/features/recipes/components/recipe-form.tsx`                 | Shared create/edit recipe form with tag input, ingredient rows, and DnD  |
| `src/routes/recipes/index.tsx`                                    | Recipe library page with search and tag filtering                        |
| `src/routes/recipes/new.tsx`                                      | New recipe page using the shared recipe form                             |
| `src/routes/recipes/$recipeId.tsx`                                | Parent layout route for detail/edit/cook children                        |
| `src/routes/recipes/$recipeId.index.tsx`                          | Recipe detail page with scaling, duplicate, delete, and nutrition panels |
| `src/routes/recipes/$recipeId.edit.tsx`                           | Recipe edit page using the shared recipe form                            |
| `src/routes/recipes/$recipeId.cook.tsx`                           | Recipe cook-mode workflow                                                |

## Files Modified

| File                                                               | Changes                                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `packages/shared/src/types/index.ts`                               | Added recipe, tag, summary, detail, and nutrition/scaling-related types      |
| `packages/shared/src/schemas/index.ts`                             | Re-exported recipe schemas                                                   |
| `packages/shared/src/index.ts`                                     | Re-exported recipe schemas and pure nutrition/scaling helpers                |
| `apps/api/src/db/schema.ts`                                        | Added recipe metadata columns, recipe tags, and recipe-tag assignment schema |
| `apps/api/src/index.ts`                                            | Registered `recipesPlugin`                                                   |
| `apps/web/src/routes/__root.tsx`                                   | Added Recipes navigation link                                                |
| `apps/web/src/routes/ingredients/new.tsx`                          | Reused extracted ingredient form after recipe UX follow-up                   |
| `apps/web/src/features/ingredients/components/ingredient-form.tsx` | Extracted reusable ingredient form used by the recipe modal                  |
| `apps/web/src/lib/api-client.ts`                                   | Fixed no-body POST handling so recipe duplication does not send empty JSON   |
| `apps/web/src/lib/api-client.test.ts`                              | Added regression coverage for no-body POST requests                          |

## API Endpoints

| Method | Path                     | Description                                                       |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| GET    | `/recipes`               | List household recipes with optional search/tag filter            |
| GET    | `/recipes/:id`           | Get full recipe detail with instructions, tags, and nutrition     |
| POST   | `/recipes`               | Create a recipe                                                   |
| PATCH  | `/recipes/:id`           | Update a recipe                                                   |
| DELETE | `/recipes/:id`           | Soft-delete a recipe                                              |
| POST   | `/recipes/:id/duplicate` | Duplicate a recipe, including instructions, ingredients, and tags |
| GET    | `/tags`                  | List household recipe tags with counts                            |

## Web UX Outcomes

- Recipe detail uses a TanStack Router layout split: `$recipeId.tsx` provides the parent `Outlet`, and `$recipeId.index.tsx` renders the detail page.
- Recipe create/edit flows share one form component and strip blank ingredient rows before submit.
- Users can create a new household ingredient inline from a recipe form via a Mantine modal and auto-select it back into the active ingredient row.
- Instruction steps support drag-and-drop reordering with `@dnd-kit`.
- Duplicate and delete actions surface Mantine `Alert` errors instead of failing silently.
- Delete confirmations use a Mantine modal instead of browser `confirm()`.

## Testing and Validation

- API route tests cover authenticated recipe creation and duplication.
- Property-based tests cover nutrition additivity, reversible scaling, and per-serving invariance under scaling.
- Web regression coverage verifies that no-body `POST` requests omit the JSON content-type header, preventing Fastify duplicate-route failures.
- Recent validation in the current workspace passed `pnpm typecheck` and `pnpm test` after the recipe UX follow-up.

## Current Scope Boundaries

- Recipes are fully implemented for API, shared contracts, and the web app.
- Shopping list and cook-event feature units remain unimplemented beyond the foundation schema types/tables.
- No active `apps/mobile` package exists in the workspace.
