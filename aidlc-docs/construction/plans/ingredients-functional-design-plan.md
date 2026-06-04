# Unit 2: Ingredients — Functional Design Plan

## Unit Context

**Unit**: Ingredients (Unit 2)
**Scope**: Ingredient library CRUD, OpenFoodFacts search, shopping categories
**Stories**: US-07, US-08, US-09, US-10
**Dependencies**: Unit 1 (Auth & Household) — authenticated user, household membership, seeded shopping categories

---

## Design Steps

- [x] Define ingredient domain entities and relationships (ingredient, shopping category, recipe_ingredients link)
- [x] Define ingredient CRUD business rules (creation, validation, soft-delete constraints)
- [x] Define OpenFoodFacts search and import business logic (proxy, caching, data mapping)
- [x] Define shopping category assignment rules (defaults, per-ingredient, relation to list grouping)
- [x] Define API route contracts for ingredient endpoints (input schemas, response shapes, status codes)
- [x] Define frontend component structure (ingredient library, create/edit forms, OFF search UI)

---

## Questions

### Q1: Ingredient Deletion Strategy

The schema uses soft-delete (`deletedAt`) for ingredients. What should happen when an ingredient is in use by one or more recipes?

A) Prevent deletion entirely — the user must first remove it from all recipes
B) Allow soft-delete — recipes referencing the ingredient continue to function but ingredient is hidden from the library list and cannot be added to new recipes
C) Allow soft-delete with a warning dialog listing affected recipes, then proceed as in B
D) Other (specify)

[Answer]: A

---

### Q2: Nutrition Data Units ("Per 100g" vs Flexible)

The schema stores `calories`, `protein`, `carbs`, `fat` directly on the ingredient. Requirements say "per 100 g, per ml, per item". How should we handle the nutrition reference quantity?

A) Always store nutrition values per 100g (or 100ml) — the `defaultUnit` on the ingredient indicates how recipe quantities are entered, but nutrition is always normalized to per-100-unit
B) Store nutrition per 1 `defaultUnit` — e.g., if the ingredient's unit is "item", nutrition is per 1 item; if "g", nutrition is per 1g
C) Store nutrition per an explicit user-specified "nutrition reference" quantity (e.g., "per 85g serving") with a reference-quantity field
D) Other (specify)

[Answer]: A

---

### Q3: OpenFoodFacts Search Scope

What should the OpenFoodFacts search support?

A) Text search by product name only
B) Text search by product name + barcode lookup
C) Text search by product name + barcode lookup + barcode scanning via camera (web)
D) Text search only — defer barcode entirely to a future phase

[Answer]: C

---

### Q4: OpenFoodFacts API Caching

The service design calls for an in-memory LRU cache with 24h TTL. Is this acceptable for your deployment?

A) Yes — in-memory LRU is fine (simplest, lost on restart but acceptable for search cache)
B) Prefer a persistent cache (e.g., SQLite table) to survive restarts
C) No caching needed — OpenFoodFacts is fast enough for a household app
D) Other (specify)

[Answer]: C

---

### Q5: Ingredient Name Uniqueness

Should ingredient names be unique within a household?

A) Yes — strictly unique (case-insensitive); prevent duplicates at creation time
B) Yes — unique by (name + defaultUnit) pair; allow "Flour (g)" and "Flour (cup)" to coexist
C) No uniqueness constraint — allow multiple ingredients with the same name (user responsible)
D) Warn on near-duplicates but allow creation

[Answer]: A

---

### Q6: Shopping Category Customization

Households start with 7 default categories (Produce, Dairy, Meat, Pantry, Frozen, Bakery, Other). Should users be able to customize categories in this unit?

A) No — use only the default set; custom categories are out of scope
B) Allow adding custom categories (but not deleting or renaming defaults)
C) Allow full CRUD on categories (add, rename, reorder, delete if no ingredients assigned)
D) Other (specify)

[Answer]: C

---

### Q7: Ingredient List Pagination/Search

The ingredient library page will grow over time. What should the initial UX be?

A) Simple list with client-side text filter (no server pagination) — fine for household-scale data (likely < 500 ingredients)
B) Server-side pagination with cursor/offset + search query parameter
C) Virtual-scrolled list on the client with a search filter
D) Other (specify)

[Answer]: C

---

### Q8: OpenFoodFacts Data Mapping

OpenFoodFacts returns rich product data. Which fields should we map/import?

A) Minimal: product name, calories, protein, carbs, fat (per 100g) — user fills in default unit and category themselves
B) Standard: product name, nutrition per 100g, suggested unit (from OFF packaging data), and best-guess category mapping
C) Maximal: include image URL, brand, allergens, serving size suggestion — store or display extra metadata
D) Other (specify)

[Answer]: A
