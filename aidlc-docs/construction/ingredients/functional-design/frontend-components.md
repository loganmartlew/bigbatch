# Unit 2: Ingredients — Frontend Components

## Page: Ingredient Library (`/ingredients`)

**Route**: `src/routes/_authenticated/ingredients/index.tsx`  
**Feature folder**: `src/features/ingredients/`

### Layout

```text
┌─────────────────────────────────────────────────────┐
│  Ingredient Library                    [+ New]       │
├─────────────────────────────────────────────────────┤
│  [🔍 Search ingredients...]                          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │  Chicken Breast           Meat    per 100g  │    │
│  │  165 kcal  31g P  0g C  3.6g F             │    │
│  ├─────────────────────────────────────────────┤    │
│  │  Olive Oil               Pantry   per 100ml │    │
│  │  884 kcal  0g P  0g C  100g F              │    │
│  ├─────────────────────────────────────────────┤    │
│  │  ...  (virtual-scrolled)                    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Component Hierarchy

```text
IngredientsPage (route shell)
├── PageHeader (title + "New Ingredient" button)
├── IngredientSearchInput (client-side filter)
└── IngredientVirtualList
    └── IngredientListItem (repeated)
        ├── name, category badge, unit
        └── nutrition summary row
```

### Key Behaviors

- **Data fetching**: TanStack Query hook `useIngredients()` — fetches full list on mount
- **Virtual scrolling**: Use `@tanstack/react-virtual` or Mantine's ScrollArea with virtualization for large lists
- **Client-side filter**: Filters by ingredient name (case-insensitive substring match)
- **Click row**: Navigates to ingredient detail/edit page or opens edit drawer
- **New button**: Navigates to create form

---

## Page: Create Ingredient (`/ingredients/new`)

**Route**: `src/routes/_authenticated/ingredients/new.tsx`

### Layout

```text
┌─────────────────────────────────────────────────────┐
│  ← Back    New Ingredient                            │
├─────────────────────────────────────────────────────┤
│  Name: [________________________]                    │
│                                                      │
│  Default Unit: [  g  ▾]                              │
│                                                      │
│  ── Nutrition (per 100g) ──────────────────          │
│  Calories: [___]  Protein: [___]                     │
│  Carbs:    [___]  Fat:     [___]                     │
│                                                      │
│  Category: [ Produce ▾]  (optional)                  │
│                                                      │
│  ── Or import from OpenFoodFacts ───────             │
│  [🔍 Search OFF...] [📷 Scan Barcode]                │
│                                                      │
│            [Cancel]  [Save Ingredient]               │
└─────────────────────────────────────────────────────┘
```

### Component Hierarchy

```text
CreateIngredientPage (route shell)
├── PageHeader (back link + title)
└── IngredientForm
    ├── TextInput (name)
    ├── Select (defaultUnit — UNITS enum)
    ├── NutritionInputGroup
    │   ├── NumberInput (calories)
    │   ├── NumberInput (protein)
    │   ├── NumberInput (carbs)
    │   └── NumberInput (fat)
    ├── Select (categoryId — from shopping categories)
    ├── OpenFoodFactsSearch
    │   ├── TextInput (search query)
    │   ├── Button (scan barcode)
    │   └── OFFResultsList
    │       └── OFFResultItem (clickable → pre-fills form)
    └── FormActions (cancel + submit)
```

### Key Behaviors

- **Form library**: React Hook Form with TypeBox resolver (`CreateIngredientSchema`)
- **OFF pre-fill**: Selecting an OFF result calls `form.setValue()` for name, calories, protein, carbs, fat
- **Validation**: Client-side via shared schema; server returns 409 for name conflicts
- **Mutation**: `useCreateIngredient()` TanStack Query mutation → invalidates ingredients list
- **Success**: Navigate back to ingredient library

---

## Page: Edit Ingredient (`/ingredients/:id/edit`)

**Route**: `src/routes/_authenticated/ingredients/$ingredientId/edit.tsx`

Same form as Create but:

- Pre-populated with existing values
- Uses `UpdateIngredientSchema` (partial fields)
- Mutation: `useUpdateIngredient()`
- Delete button visible (disabled if ingredient is in use by recipes with tooltip explaining why)

---

## Component: OpenFoodFactsSearch

**Location**: `src/features/ingredients/components/off-search.tsx`

### Props

```typescript
interface OFFSearchProps {
  onSelect: (result: OFFResult) => void;
}
```

### Sub-components

```text
OpenFoodFactsSearch
├── Tabs or SegmentedControl: "Search" | "Barcode" | "Scan"
├── [Tab: Search]
│   ├── TextInput (debounced, triggers query after 300ms idle)
│   └── ResultsList
├── [Tab: Barcode]
│   ├── TextInput (numeric, lookup on submit)
│   └── ResultsList (single result)
└── [Tab: Scan]
    ├── BarcodeScanner (camera feed + detection)
    └── ResultDisplay (auto-lookup on detect)
```

### Key Behaviors

- **Search query**: `useOFFSearch(query)` TanStack Query hook, `enabled` when query.length ≥ 3
- **Barcode lookup**: `useOFFBarcode(barcode)` TanStack Query hook
- **Camera scanning**: Request camera permission, use BarcodeDetector API (with JS polyfill fallback)
- **Error state**: If OFF is unavailable, show inline alert "OpenFoodFacts is currently unavailable. You can enter data manually."
- **Loading state**: Skeleton rows while fetching

---

## Component: BarcodeScanner

**Location**: `src/features/ingredients/components/barcode-scanner.tsx`

### Behavior

```text
1. Request camera permission (getUserMedia)
2. Stream video to <video> element
3. Use BarcodeDetector API or fallback library to detect EAN-13/EAN-8/UPC-A
4. On detection → call onDetect(barcode) callback
5. Stop camera stream
6. If permission denied → show message "Camera access required for barcode scanning"
7. If BarcodeDetector unavailable and no fallback → show "Barcode scanning not supported in this browser"
```

---

## Feature: Shopping Categories Management

**Accessed from**: Household Settings page or Ingredient form category dropdown  
**UI pattern**: Modal/drawer with list of categories

### Component Hierarchy

```text
CategoryManagerModal
├── CategoryList (drag-to-reorder via sortOrder)
│   └── CategoryListItem
│       ├── name (editable inline for custom categories)
│       ├── badge "Default" (for isDefault)
│       ├── [Rename] button (custom only)
│       └── [Delete] button (custom only, disabled if has ingredients)
├── AddCategoryForm (name input + add button)
└── SaveOrder button (persists reorder)
```

### Key Behaviors

- **List**: `useShoppingCategories()` TanStack Query hook
- **Add**: `useCreateCategory()` mutation
- **Rename**: `useUpdateCategory()` mutation (inline edit)
- **Delete**: `useDeleteCategory()` mutation with confirmation
- **Reorder**: Drag-and-drop or up/down arrows → `useReorderCategories()` mutation
- **Default protection**: Default categories show no rename/delete controls

---

## TanStack Query Hooks Summary

| Hook                      | Method | Endpoint                               | Key                         |
| ------------------------- | ------ | -------------------------------------- | --------------------------- |
| `useIngredients()`        | GET    | `/ingredients`                         | `['ingredients', hhId]`     |
| `useIngredient(id)`       | GET    | `/ingredients/:id`                     | `['ingredients', hhId, id]` |
| `useCreateIngredient()`   | POST   | `/ingredients`                         | invalidates list            |
| `useUpdateIngredient()`   | PATCH  | `/ingredients/:id`                     | invalidates list + detail   |
| `useDeleteIngredient()`   | DELETE | `/ingredients/:id`                     | invalidates list            |
| `useOFFSearch(query)`     | GET    | `/ingredients/search/openfoodfacts?q=` | `['off-search', query]`     |
| `useShoppingCategories()` | GET    | `/shopping-categories`                 | `['categories', hhId]`      |
| `useCreateCategory()`     | POST   | `/shopping-categories`                 | invalidates categories      |
| `useUpdateCategory()`     | PATCH  | `/shopping-categories/:id`             | invalidates categories      |
| `useDeleteCategory()`     | DELETE | `/shopping-categories/:id`             | invalidates categories      |
| `useReorderCategories()`  | PUT    | `/shopping-categories/reorder`         | invalidates categories      |

---

## Shared Schema Usage (from `@bigbatch/shared`)

| Schema                    | Used By                              |
| ------------------------- | ------------------------------------ |
| `CreateIngredientSchema`  | API route validation + form resolver |
| `UpdateIngredientSchema`  | API route validation + form resolver |
| `IngredientSchema`        | API response typing                  |
| `OFFSearchResultSchema`   | API response typing                  |
| `CreateCategorySchema`    | API route validation                 |
| `UpdateCategorySchema`    | API route validation                 |
| `ReorderCategoriesSchema` | API route validation                 |
