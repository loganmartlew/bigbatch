/**
 * Scale a single quantity from base batch size to target batch size.
 */
export function scaleQuantity(
  baseQuantity: number,
  baseBatchSize: number,
  targetBatchSize: number,
): number {
  if (baseBatchSize <= 0) return baseQuantity;
  return (baseQuantity / baseBatchSize) * targetBatchSize;
}

export interface ScalableIngredient {
  quantity: number;
}

export interface ScaledIngredient<T extends ScalableIngredient> {
  original: T;
  scaledQuantity: number;
}

/**
 * Scale all ingredient quantities from base to target batch size.
 */
export function scaleIngredients<T extends ScalableIngredient>(
  ingredients: T[],
  baseBatchSize: number,
  targetBatchSize: number,
): ScaledIngredient<T>[] {
  return ingredients.map(ingredient => ({
    original: ingredient,
    scaledQuantity: scaleQuantity(
      ingredient.quantity,
      baseBatchSize,
      targetBatchSize,
    ),
  }));
}
