# Unit 3: Recipes — Business Rules

## Recipe CRUD Rules

### Create Recipe

- User must be authenticated and a member of the target household
- `name`: required, trimmed, 1–200 chars
- `description`: optional, max 2000 chars
- `source`: optional, max 500 chars (URL, book title, or person name)
- `prepTime`: optional, integer ≥ 0 (minutes)
- `cookTime`: optional, integer ≥ 0 (minutes)
- `batchSize`: required, integer ≥ 1
- `instructions`: optional array of step texts (re-numbered 1..N on save)
- `ingredients`: optional array of `{ ingredientId, quantity, unit }`
- `tags`: optional array of tag names (created if not existing in household)
- `createdBy` is set to the authenticated user's ID
- Recipe names do NOT need to be unique within a household (users may have "Pasta" variants)
- Returns the full recipe detail shape on creation

### Update Recipe

- User must be authenticated and a member of the recipe's household
- All fields are optional (partial update)
- `instructions`: if provided, replaces ALL steps atomically (delete + re-insert)
- `ingredients`: if provided, replaces ALL recipe ingredients atomically
- `tags`: if provided, replaces ALL tag assignments atomically (creates new tags if needed)
- `updatedAt` is refreshed on any change
- Returns the full recipe detail shape

### Get Recipe

- User must be authenticated and a member of the recipe's household
- Soft-deleted recipes are excluded (deletedAt IS NULL)
- Response includes instructions (ordered by stepNumber), ingredients (with ingredient name + nutrition), tags, and computed nutrition

### List Recipes

- User must be authenticated and a member of the household
- Returns only non-deleted recipes
- Supports optional filters:
  - `search`: case-insensitive partial match on recipe name
  - `tags`: comma-separated tag names (recipes must have ALL specified tags)
- Returns summary shape (no full instructions/ingredients): `{ id, name, description, prepTime, cookTime, batchSize, tags, createdAt }`
- Ordered by `name ASC` (default)

### Delete Recipe

- User must be authenticated and a member of the recipe's household
- Soft-delete: sets `deletedAt` to current timestamp
- Does NOT cascade to cook events (they retain historical reference)
- Returns `204 No Content`

---

## Recipe Duplication Rules

- User must be authenticated and a member of the source recipe's household
- Creates a new recipe with name `"{original name} (copy)"`
- Copies: description, source, prepTime, cookTime, batchSize, instructions, ingredients, tags
- Sets `createdBy` to the duplicating user
- The duplicate is independent — subsequent edits to either recipe do not affect the other
- Returns the full new recipe detail shape

---

## Tag Rules

### Tag Normalization

- Tags are trimmed and lowercased before storage
- Empty/whitespace-only tags are silently ignored
- Tags matching an existing household tag (case-insensitive) reuse the existing record
- A recipe can have 0–20 tags

### Tag Lifecycle

- Tags are created implicitly when first assigned to a recipe
- Tags with zero recipe assignments remain in the database (not garbage-collected) — they appear as suggestions
- Tag listing endpoint returns all household tags with usage counts
- No explicit tag deletion endpoint at this stage

---

## Nutrition Computation Rules

### Per-Ingredient Nutrition

Ingredient nutrition values are stored per 100g/100ml. To compute for a recipe ingredient:

```
scaledCalories = (ingredient.calories / 100) * recipeIngredient.quantity
```

Where `recipeIngredient.quantity` is in the ingredient's stored unit (which may differ from the recipe ingredient's unit — see Unit Handling below).

### Unit Handling for Nutrition

- Nutrition is only computed when the recipe ingredient's unit matches a weight/volume unit compatible with the ingredient's nutrition basis (per 100g)
- For `g`, `kg`: convert to grams, apply formula
- For `ml`, `l`: treat as equivalent to grams (density ≈ 1 assumption, standard for recipe apps)
- For `tbsp`, `tsp`, `cup`, `item`: nutrition is still computed using the raw quantity as-if grams (simplification — future improvement could add density/conversion tables)
- If an ingredient has no nutrition data (all null), it contributes 0 to totals

### Total Recipe Nutrition

- Sum of all per-ingredient scaled values
- Returned as `NutritionInfo` on recipe detail

### Per-Serving Nutrition

- `total / batchSize`
- Displayed in UI alongside total
- When scaling (display-time), per-serving remains constant — only total changes

---

## Scaling Rules (Display-Time)

- Scaling is purely a UI computation — no API endpoint
- User selects a target serving count
- Each ingredient quantity is multiplied by `(targetServings / batchSize)`
- Nutrition total scales proportionally; per-serving stays constant
- The selected serving count is NOT persisted

---

## Cook Mode Rules

- Cook mode is a full-screen UI state for stepping through recipe instructions
- Activates wake-lock (prevents screen sleep) if available via `navigator.wakeLock`
- Displays one step at a time with prev/next navigation
- Steps can be marked as "done" (checkbox) for visual progress
- Shows ingredient list in a collapsible sidebar for reference
- No timer functionality at this stage
- Exit cook mode returns to recipe detail

---

## Authorization Rules

- All recipe endpoints require authentication (valid session)
- All recipe endpoints require household membership (X-Household-Id header + membership check)
- Recipe detail/edit/delete endpoints verify the recipe belongs to the requesting household
- There is no per-user permission within a household — any member can CRUD any recipe
- No recipe sharing between households at this stage
