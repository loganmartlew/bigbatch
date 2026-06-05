import { scaleQuantity, type QueuedCookState } from '@bigbatch/shared';

export interface QueuedCookRequirement {
  id: number;
  ingredientId: number;
  requiredQuantity: number;
  unit: string;
}

export interface ShoppingCompletionRow {
  id: number;
  ingredientId: number;
  quantity: number;
  unit: string;
  tickedOff: boolean;
  haveThis: boolean;
}

export interface QueuedCookProgress {
  state: QueuedCookState;
  satisfiedIngredientsCount: number;
  requiredIngredientsCount: number;
  satisfactionByRequirementId: Map<number, boolean>;
}

const FLOAT_TOLERANCE = 1e-6;

function makeShoppingKey(ingredientId: number, unit: string): string {
  return `${ingredientId}:${unit}`;
}

export function quantitiesMatch(left: number, right: number): boolean {
  return Math.abs(left - right) < FLOAT_TOLERANCE;
}

export function buildShoppingLookup(
  rows: ShoppingCompletionRow[],
): Map<string, ShoppingCompletionRow> {
  return new Map(
    rows.map(row => [makeShoppingKey(row.ingredientId, row.unit), row]),
  );
}

export function deriveQueuedCookProgress(
  requirements: QueuedCookRequirement[],
  shoppingLookup: Map<string, ShoppingCompletionRow>,
): QueuedCookProgress {
  const satisfactionByRequirementId = new Map<number, boolean>();
  let satisfiedIngredientsCount = 0;

  for (const requirement of requirements) {
    const shoppingRow = shoppingLookup.get(
      makeShoppingKey(requirement.ingredientId, requirement.unit),
    );
    const isSatisfied =
      shoppingRow != null &&
      shoppingRow.quantity + FLOAT_TOLERANCE >= requirement.requiredQuantity &&
      (shoppingRow.tickedOff || shoppingRow.haveThis);

    satisfactionByRequirementId.set(requirement.id, isSatisfied);

    if (isSatisfied) {
      satisfiedIngredientsCount += 1;
    }
  }

  return {
    state:
      requirements.length > 0 &&
      satisfiedIngredientsCount === requirements.length
        ? 'readyToCook'
        : 'gatheringIngredients',
    satisfiedIngredientsCount,
    requiredIngredientsCount: requirements.length,
    satisfactionByRequirementId,
  };
}

export function rescaleRequiredQuantity(
  baseQuantity: number,
  baseBatchSize: number,
  targetBatchSize: number,
): number {
  return scaleQuantity(baseQuantity, baseBatchSize, targetBatchSize);
}
