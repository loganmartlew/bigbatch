import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  buildShoppingLookup,
  deriveQueuedCookProgress,
  quantitiesMatch,
  rescaleRequiredQuantity,
} from '../cook-events.logic.js';

describe('PBT-CE-01: readiness derivation', () => {
  it('is ready iff every requirement is satisfied by a completed shopping row', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            ingredientId: fc.integer({ min: 1, max: 500 }),
            requiredQuantity: fc.float({
              min: Math.fround(0.1),
              max: Math.fround(1000),
              noNaN: true,
            }),
            unit: fc.constantFrom(
              'g',
              'kg',
              'ml',
              'l',
              'tbsp',
              'tsp',
              'cup',
              'item',
            ),
          }),
          {
            minLength: 1,
            maxLength: 8,
            selector: requirement =>
              `${requirement.ingredientId}:${requirement.unit}`,
          },
        ),
        fc.boolean(),
        (rawRequirements, shouldSatisfyAll) => {
          const requirements = rawRequirements.map((requirement, index) => ({
            ...requirement,
            id: index + 1,
          }));

          const shoppingRows = requirements.map((requirement, index) => ({
            id: index + 1,
            ingredientId: requirement.ingredientId,
            quantity: shouldSatisfyAll
              ? requirement.requiredQuantity
              : index === 0
                ? Math.max(0, requirement.requiredQuantity - 0.5)
                : requirement.requiredQuantity,
            unit: requirement.unit,
            tickedOff: shouldSatisfyAll || index !== 0,
            haveThis: false,
          }));

          const progress = deriveQueuedCookProgress(
            requirements,
            buildShoppingLookup(shoppingRows),
          );

          expect(progress.requiredIngredientsCount).toBe(requirements.length);
          expect(progress.state).toBe(
            shouldSatisfyAll ? 'readyToCook' : 'gatheringIngredients',
          );
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('PBT-CE-02: resize scaling', () => {
  it('rescales linearly from the stored base quantity and batch size', () => {
    fc.assert(
      fc.property(
        fc.float({
          min: Math.fround(0.1),
          max: Math.fround(10_000),
          noNaN: true,
        }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (baseQuantity, baseBatchSize, targetA, targetB) => {
          const first = rescaleRequiredQuantity(
            baseQuantity,
            baseBatchSize,
            targetA,
          );
          const second = rescaleRequiredQuantity(
            baseQuantity,
            baseBatchSize,
            targetB,
          );

          expect(first / targetA).toBeCloseTo(second / targetB, 4);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('quantitiesMatch', () => {
  it('treats tiny floating-point differences as equal', () => {
    expect(quantitiesMatch(1, 1 + 1e-7)).toBe(true);
    expect(quantitiesMatch(1, 1.01)).toBe(false);
  });
});
