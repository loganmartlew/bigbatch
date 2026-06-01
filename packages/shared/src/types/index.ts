// ─── Unit Enum ───────────────────────────────────────────────

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'tbsp',
  'tsp',
  'cup',
  'item',
] as const;
export type Unit = (typeof UNITS)[number];

// ─── User & Household ───────────────────────────────────────

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export type HouseholdRole = 'owner' | 'member';

export interface UserHousehold {
  userId: number;
  householdId: number;
  role: HouseholdRole;
  joinedAt: string;
}

export interface Household {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdInvite {
  id: number;
  householdId: number;
  token: string;
  code: string;
  createdBy: number;
  expiresAt: string;
  createdAt: string;
}

// ─── Ingredients ─────────────────────────────────────────────

export interface Ingredient {
  id: number;
  householdId: number;
  name: string;
  defaultUnit: Unit;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ShoppingCategory {
  id: number;
  householdId: number;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
}

// ─── Recipes ─────────────────────────────────────────────────

export interface Recipe {
  id: number;
  householdId: number;
  name: string;
  description: string | null;
  source: string | null;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  ingredientId: number;
  quantity: number;
  unit: Unit;
}

export interface RecipeInstruction {
  id: number;
  recipeId: number;
  stepNumber: number;
  text: string;
}

// ─── Recipe Tags ─────────────────────────────────────────────

export interface RecipeTag {
  id: number;
  householdId: number;
  name: string;
}

export interface TagWithCount {
  id: number;
  name: string;
  recipeCount: number;
}

// ─── Recipe Response Shapes ──────────────────────────────────

export interface RecipeIngredientDetail {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  nutrition: NutritionInfo | null;
}

export interface RecipeDetail {
  id: number;
  householdId: number;
  name: string;
  description: string | null;
  source: string | null;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  createdBy: number;
  instructions: RecipeInstruction[];
  ingredients: RecipeIngredientDetail[];
  tags: string[];
  nutrition: NutritionInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSummary {
  id: number;
  name: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  batchSize: number;
  tags: string[];
  createdAt: string;
}

// ─── Nutrition ───────────────────────────────────────────────

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Shopping List ───────────────────────────────────────────

export interface ShoppingListItem {
  id: number;
  householdId: number;
  ingredientId: number;
  quantity: number;
  unit: Unit;
  tickedOff: boolean;
  haveThis: boolean;
  createdAt: string;
}

// ─── Cook Events ─────────────────────────────────────────────

export interface CookEvent {
  id: number;
  recipeId: number;
  userId: number;
  date: string;
  batchSize: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
