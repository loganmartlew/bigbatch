export type QueuedCookState = 'gatheringIngredients' | 'readyToCook';

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

export interface QueuedCook {
  id: number;
  householdId: number;
  recipeId: number;
  createdBy: number;
  recipeBatchSizeSnapshot: number;
  selectedBatchSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedCookIngredient {
  id: number;
  queuedCookId: number;
  ingredientId: number;
  unit: string;
  baseQuantity: number;
  requiredQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedCookIngredientDetail {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  requiredQuantity: number;
  isSatisfied: boolean;
}

export interface QueuedCookSummary {
  id: number;
  recipeId: number;
  recipeName: string;
  selectedBatchSize: number;
  state: QueuedCookState;
  requiredIngredientsCount: number;
  satisfiedIngredientsCount: number;
  createdBy: number;
  createdByName: string;
  createdAt: string;
}

export interface QueuedCookDetail extends QueuedCookSummary {
  ingredients: QueuedCookIngredientDetail[];
}

export interface CookEventDetail extends CookEvent {
  recipeName: string;
  userDisplayName: string;
}

export interface CooksDashboardResponse {
  queue: QueuedCookSummary[];
  history: CookEventDetail[];
}

export interface ShoppingCleanupSummary {
  removedItemIds: number[];
  retainedSharedItemIds: number[];
}

export interface CancelQueuedCookResult {
  removedFromQueue: true;
  shoppingCleanup: ShoppingCleanupSummary;
}

export interface FinishQueuedCookResult {
  cookEvent: CookEventDetail;
  shoppingCleanup: ShoppingCleanupSummary;
}

export interface CookModeStep {
  id: number;
  stepNumber: number;
  text: string;
}

export interface CookModePayload {
  queuedCookId: number;
  recipeId: number;
  recipeName: string;
  selectedBatchSize: number;
  ingredients: QueuedCookIngredientDetail[];
  instructions: CookModeStep[];
}
