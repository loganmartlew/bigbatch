import type { NutritionInfo } from './types/index.js';

export interface IngredientNutritionData {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

/**
 * Scale ingredient nutrition (stored per 100g) by the given quantity.
 * Null nutrition values contribute 0.
 */
export function computeIngredientNutrition(
  nutrition: IngredientNutritionData | null,
  quantity: number,
): NutritionInfo {
  if (!nutrition) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  return {
    calories: ((nutrition.calories ?? 0) / 100) * quantity,
    protein: ((nutrition.protein ?? 0) / 100) * quantity,
    carbs: ((nutrition.carbs ?? 0) / 100) * quantity,
    fat: ((nutrition.fat ?? 0) / 100) * quantity,
  };
}

export interface RecipeIngredientForNutrition {
  nutrition: IngredientNutritionData | null;
  quantity: number;
}

/**
 * Compute total nutrition for all recipe ingredients.
 */
export function computeRecipeNutrition(
  items: RecipeIngredientForNutrition[],
): NutritionInfo {
  const total: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of items) {
    const scaled = computeIngredientNutrition(item.nutrition, item.quantity);
    total.calories += scaled.calories;
    total.protein += scaled.protein;
    total.carbs += scaled.carbs;
    total.fat += scaled.fat;
  }
  return total;
}

/**
 * Compute per-serving nutrition by dividing totals by batch size.
 */
export function computePerServing(
  total: NutritionInfo,
  batchSize: number,
): NutritionInfo {
  if (batchSize <= 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return {
    calories: total.calories / batchSize,
    protein: total.protein / batchSize,
    carbs: total.carbs / batchSize,
    fat: total.fat / batchSize,
  };
}
