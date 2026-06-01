import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeIngredientNutrition,
  computeRecipeNutrition,
  computePerServing,
} from '@bigbatch/shared';
import { scaleQuantity, scaleIngredients } from '@bigbatch/shared';

const nutritionArb = fc.record({
  calories: fc.oneof(
    fc.constant(null),
    fc.float({ min: 0, max: Math.fround(1000), noNaN: true }),
  ),
  protein: fc.oneof(
    fc.constant(null),
    fc.float({ min: 0, max: Math.fround(200), noNaN: true }),
  ),
  carbs: fc.oneof(
    fc.constant(null),
    fc.float({ min: 0, max: Math.fround(500), noNaN: true }),
  ),
  fat: fc.oneof(
    fc.constant(null),
    fc.float({ min: 0, max: Math.fround(200), noNaN: true }),
  ),
});

describe('PBT-04: Nutrition computation is additive', () => {
  it('total equals sum of individual computations', () => {
    const ingredientArb = fc.record({
      nutrition: nutritionArb,
      quantity: fc.float({
        min: Math.fround(0.1),
        max: Math.fround(5000),
        noNaN: true,
      }),
    });

    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        items => {
          const total = computeRecipeNutrition(items);
          let expectedCalories = 0;
          let expectedProtein = 0;
          let expectedCarbs = 0;
          let expectedFat = 0;
          for (const item of items) {
            const ind = computeIngredientNutrition(
              item.nutrition,
              item.quantity,
            );
            expectedCalories += ind.calories;
            expectedProtein += ind.protein;
            expectedCarbs += ind.carbs;
            expectedFat += ind.fat;
          }
          expect(total.calories).toBeCloseTo(expectedCalories, 5);
          expect(total.protein).toBeCloseTo(expectedProtein, 5);
          expect(total.carbs).toBeCloseTo(expectedCarbs, 5);
          expect(total.fat).toBeCloseTo(expectedFat, 5);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('PBT-05: Scaling is reversible', () => {
  it('scaling up then back produces original quantity', () => {
    fc.assert(
      fc.property(
        fc.float({
          min: Math.fround(0.1),
          max: Math.fround(10000),
          noNaN: true,
        }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (quantity, baseBatch, targetBatch) => {
          const scaled = scaleQuantity(quantity, baseBatch, targetBatch);
          const restored = scaleQuantity(scaled, targetBatch, baseBatch);
          expect(restored).toBeCloseTo(quantity, 3);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('PBT-06: Per-serving nutrition is invariant under scaling', () => {
  it('per-serving stays constant regardless of target batch size', () => {
    fc.assert(
      fc.property(
        fc.record({
          calories: fc.float({ min: 0, max: Math.fround(5000), noNaN: true }),
          protein: fc.float({ min: 0, max: Math.fround(500), noNaN: true }),
          carbs: fc.float({ min: 0, max: Math.fround(500), noNaN: true }),
          fat: fc.float({ min: 0, max: Math.fround(500), noNaN: true }),
        }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (totalNutrition, baseBatch, targetBatch) => {
          const perServingBase = computePerServing(totalNutrition, baseBatch);
          // When scaling, total changes but per-serving stays the same
          const scaledTotal = {
            calories: (totalNutrition.calories / baseBatch) * targetBatch,
            protein: (totalNutrition.protein / baseBatch) * targetBatch,
            carbs: (totalNutrition.carbs / baseBatch) * targetBatch,
            fat: (totalNutrition.fat / baseBatch) * targetBatch,
          };
          const perServingScaled = computePerServing(scaledTotal, targetBatch);
          expect(perServingScaled.calories).toBeCloseTo(
            perServingBase.calories,
            3,
          );
          expect(perServingScaled.protein).toBeCloseTo(
            perServingBase.protein,
            3,
          );
          expect(perServingScaled.carbs).toBeCloseTo(perServingBase.carbs, 3);
          expect(perServingScaled.fat).toBeCloseTo(perServingBase.fat, 3);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('scaleIngredients', () => {
  it('scales all quantities proportionally', () => {
    const ingredients = [
      { quantity: 100 },
      { quantity: 200 },
      { quantity: 50 },
    ];
    const scaled = scaleIngredients(ingredients, 4, 8);
    expect(scaled[0]!.scaledQuantity).toBeCloseTo(200);
    expect(scaled[1]!.scaledQuantity).toBeCloseTo(400);
    expect(scaled[2]!.scaledQuantity).toBeCloseTo(100);
  });
});
