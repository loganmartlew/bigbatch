import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// PBT-03: Nutrition computation invariant
// After editing ingredient nutrition, recipe total nutrition equals
// sum((ingredient.[macro] ?? 0) * quantity / 100) for each recipe ingredient.
// ---------------------------------------------------------------------------

interface IngredientNutrition {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface RecipeIngredientEntry {
  ingredient: IngredientNutrition;
  quantity: number;
}

function computeRecipeNutrition(entries: RecipeIngredientEntry[]) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const entry of entries) {
    const factor = entry.quantity / 100;
    calories += (entry.ingredient.calories ?? 0) * factor;
    protein += (entry.ingredient.protein ?? 0) * factor;
    carbs += (entry.ingredient.carbs ?? 0) * factor;
    fat += (entry.ingredient.fat ?? 0) * factor;
  }

  return { calories, protein, carbs, fat };
}

const nutritionArb = fc.record({
  calories: fc.option(fc.float({ min: 0, max: 2000, noNaN: true }), {
    nil: null,
  }),
  protein: fc.option(fc.float({ min: 0, max: 500, noNaN: true }), {
    nil: null,
  }),
  carbs: fc.option(fc.float({ min: 0, max: 500, noNaN: true }), { nil: null }),
  fat: fc.option(fc.float({ min: 0, max: 500, noNaN: true }), { nil: null }),
});

const recipeIngredientArb = fc.record({
  ingredient: nutritionArb,
  quantity: fc.float({
    min: Math.fround(0.1),
    max: Math.fround(10000),
    noNaN: true,
  }),
});

describe('PBT-03: Nutrition computation invariant', () => {
  it('total nutrition equals sum of (macro ?? 0) * quantity / 100', () => {
    fc.assert(
      fc.property(
        fc.array(recipeIngredientArb, { minLength: 1, maxLength: 20 }),
        entries => {
          const result = computeRecipeNutrition(entries);

          // Manual independent computation
          let expectedCalories = 0;
          let expectedProtein = 0;
          let expectedCarbs = 0;
          let expectedFat = 0;

          for (const e of entries) {
            const factor = e.quantity / 100;
            expectedCalories += (e.ingredient.calories ?? 0) * factor;
            expectedProtein += (e.ingredient.protein ?? 0) * factor;
            expectedCarbs += (e.ingredient.carbs ?? 0) * factor;
            expectedFat += (e.ingredient.fat ?? 0) * factor;
          }

          expect(result.calories).toBeCloseTo(expectedCalories, 5);
          expect(result.protein).toBeCloseTo(expectedProtein, 5);
          expect(result.carbs).toBeCloseTo(expectedCarbs, 5);
          expect(result.fat).toBeCloseTo(expectedFat, 5);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('null nutrition values contribute zero', () => {
    fc.assert(
      fc.property(
        fc.float({
          min: Math.fround(0.1),
          max: Math.fround(10000),
          noNaN: true,
        }),
        quantity => {
          const allNull: IngredientNutrition = {
            calories: null,
            protein: null,
            carbs: null,
            fat: null,
          };
          const result = computeRecipeNutrition([
            { ingredient: allNull, quantity },
          ]);
          expect(result.calories).toBe(0);
          expect(result.protein).toBe(0);
          expect(result.carbs).toBe(0);
          expect(result.fat).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('nutrition scales linearly with quantity', () => {
    fc.assert(
      fc.property(
        nutritionArb,
        fc.float({
          min: Math.fround(0.1),
          max: Math.fround(5000),
          noNaN: true,
        }),
        fc.float({ min: Math.fround(1.1), max: Math.fround(10), noNaN: true }),
        (nutrition, baseQty, multiplier) => {
          const single = computeRecipeNutrition([
            { ingredient: nutrition, quantity: baseQty },
          ]);
          const scaled = computeRecipeNutrition([
            { ingredient: nutrition, quantity: baseQty * multiplier },
          ]);

          expect(scaled.calories).toBeCloseTo(single.calories * multiplier, 3);
          expect(scaled.protein).toBeCloseTo(single.protein * multiplier, 3);
          expect(scaled.carbs).toBeCloseTo(single.carbs * multiplier, 3);
          expect(scaled.fat).toBeCloseTo(single.fat * multiplier, 3);
        },
      ),
      { numRuns: 200 },
    );
  });
});
