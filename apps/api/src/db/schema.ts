import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  userHouseholds: many(userHouseholds),
  sessions: many(sessions),
  queuedCooks: many(queuedCooks),
  cookEvents: many(cookEvents),
  passwordResetTokens: many(passwordResetTokens),
}));

// ─── Households ──────────────────────────────────────────────

export const households = sqliteTable('households', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const householdsRelations = relations(households, ({ one, many }) => ({
  owner: one(users, {
    fields: [households.ownerId],
    references: [users.id],
  }),
  userHouseholds: many(userHouseholds),
  ingredients: many(ingredients),
  recipes: many(recipes),
  queuedCooks: many(queuedCooks),
  shoppingListItems: many(shoppingListItems),
  shoppingCategories: many(shoppingCategories),
  invites: many(householdInvites),
}));

// ─── User–Household Join ─────────────────────────────────────

export const userHouseholds = sqliteTable(
  'user_households',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    role: text('role', { enum: ['owner', 'member'] }).notNull(),
    joinedAt: text('joined_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  table => [
    primaryKey({ columns: [table.userId, table.householdId] }),
    index('user_households_household_idx').on(table.householdId),
  ],
);

export const userHouseholdsRelations = relations(userHouseholds, ({ one }) => ({
  user: one(users, {
    fields: [userHouseholds.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [userHouseholds.householdId],
    references: [households.id],
  }),
}));

// ─── Household Invites ───────────────────────────────────────

export const householdInvites = sqliteTable('household_invites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  householdId: integer('household_id')
    .notNull()
    .references(() => households.id),
  token: text('token').notNull().unique(),
  code: text('code').notNull().unique(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const householdInvitesRelations = relations(
  householdInvites,
  ({ one }) => ({
    household: one(households, {
      fields: [householdInvites.householdId],
      references: [households.id],
    }),
    creator: one(users, {
      fields: [householdInvites.createdBy],
      references: [users.id],
    }),
  }),
);

// ─── Sessions (Lucia) ────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ─── Ingredients ─────────────────────────────────────────────

export const ingredients = sqliteTable(
  'ingredients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    name: text('name').notNull(),
    defaultUnit: text('default_unit').notNull(),
    calories: real('calories'),
    protein: real('protein'),
    carbs: real('carbs'),
    fat: real('fat'),
    categoryId: integer('category_id').references(() => shoppingCategories.id),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    deletedAt: text('deleted_at'),
  },
  table => [
    index('ingredients_household_idx').on(table.householdId),
    index('ingredients_household_active_idx').on(
      table.householdId,
      table.deletedAt,
    ),
  ],
);

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  household: one(households, {
    fields: [ingredients.householdId],
    references: [households.id],
  }),
  category: one(shoppingCategories, {
    fields: [ingredients.categoryId],
    references: [shoppingCategories.id],
  }),
  recipeIngredients: many(recipeIngredients),
  queuedCookIngredients: many(queuedCookIngredients),
}));

// ─── Recipes ─────────────────────────────────────────────────

export const recipes = sqliteTable(
  'recipes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    name: text('name').notNull(),
    description: text('description'),
    source: text('source'),
    prepTime: integer('prep_time'),
    cookTime: integer('cook_time'),
    batchSize: integer('batch_size').notNull(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    deletedAt: text('deleted_at'),
  },
  table => [
    index('recipes_household_idx').on(table.householdId),
    index('recipes_household_active_idx').on(
      table.householdId,
      table.deletedAt,
    ),
  ],
);

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  household: one(households, {
    fields: [recipes.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [recipes.createdBy],
    references: [users.id],
  }),
  instructions: many(recipeInstructions),
  ingredients: many(recipeIngredients),
  tagAssignments: many(recipeTagAssignments),
  queuedCooks: many(queuedCooks),
  cookEvents: many(cookEvents),
}));

// ─── Recipe Instructions ─────────────────────────────────────

export const recipeInstructions = sqliteTable(
  'recipe_instructions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    text: text('text').notNull(),
  },
  table => [
    uniqueIndex('recipe_instructions_step_idx').on(
      table.recipeId,
      table.stepNumber,
    ),
    index('recipe_instructions_recipe_idx').on(table.recipeId),
  ],
);

export const recipeInstructionsRelations = relations(
  recipeInstructions,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeInstructions.recipeId],
      references: [recipes.id],
    }),
  }),
);

// ─── Recipe Ingredients ──────────────────────────────────────

export const recipeIngredients = sqliteTable(
  'recipe_ingredients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
  },
  table => [
    index('recipe_ingredients_recipe_idx').on(table.recipeId),
    index('recipe_ingredients_ingredient_idx').on(table.ingredientId),
  ],
);

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

// ─── Recipe Tags ─────────────────────────────────────────────

export const recipeTags = sqliteTable(
  'recipe_tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    name: text('name').notNull(),
  },
  table => [
    uniqueIndex('recipe_tags_household_name_idx').on(
      table.householdId,
      table.name,
    ),
    index('recipe_tags_household_idx').on(table.householdId),
  ],
);

export const recipeTagsRelations = relations(recipeTags, ({ one, many }) => ({
  household: one(households, {
    fields: [recipeTags.householdId],
    references: [households.id],
  }),
  assignments: many(recipeTagAssignments),
}));

// ─── Recipe Tag Assignments ──────────────────────────────────

export const recipeTagAssignments = sqliteTable(
  'recipe_tag_assignments',
  {
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => recipeTags.id, { onDelete: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.recipeId, table.tagId] }),
    index('recipe_tag_assignments_tag_idx').on(table.tagId),
  ],
);

export const recipeTagAssignmentsRelations = relations(
  recipeTagAssignments,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeTagAssignments.recipeId],
      references: [recipes.id],
    }),
    tag: one(recipeTags, {
      fields: [recipeTagAssignments.tagId],
      references: [recipeTags.id],
    }),
  }),
);

// ─── Shopping Categories ─────────────────────────────────────

export const shoppingCategories = sqliteTable(
  'shopping_categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isDefault: integer('is_default', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  table => [
    uniqueIndex('shopping_categories_household_name_idx').on(
      table.householdId,
      table.name,
    ),
    index('shopping_categories_household_idx').on(table.householdId),
  ],
);

export const shoppingCategoriesRelations = relations(
  shoppingCategories,
  ({ one, many }) => ({
    household: one(households, {
      fields: [shoppingCategories.householdId],
      references: [households.id],
    }),
    ingredients: many(ingredients),
  }),
);

// ─── Shopping List Items ─────────────────────────────────────

export const shoppingListItems = sqliteTable(
  'shopping_list_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    tickedOff: integer('ticked_off', { mode: 'boolean' })
      .notNull()
      .default(false),
    haveThis: integer('have_this', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  table => [
    uniqueIndex('shopping_list_items_consolidation_idx').on(
      table.householdId,
      table.ingredientId,
      table.unit,
    ),
    index('shopping_list_items_household_idx').on(table.householdId),
  ],
);

export const shoppingListItemsRelations = relations(
  shoppingListItems,
  ({ one }) => ({
    household: one(households, {
      fields: [shoppingListItems.householdId],
      references: [households.id],
    }),
    ingredient: one(ingredients, {
      fields: [shoppingListItems.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

// ─── Queued Cooks ───────────────────────────────────────────

export const queuedCooks = sqliteTable(
  'queued_cooks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    householdId: integer('household_id')
      .notNull()
      .references(() => households.id),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    recipeBatchSizeSnapshot: integer('recipe_batch_size_snapshot').notNull(),
    selectedBatchSize: integer('selected_batch_size').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  table => [
    index('queued_cooks_household_idx').on(table.householdId),
    index('queued_cooks_recipe_idx').on(table.recipeId),
    index('queued_cooks_created_by_idx').on(table.createdBy),
  ],
);

export const queuedCooksRelations = relations(queuedCooks, ({ one, many }) => ({
  household: one(households, {
    fields: [queuedCooks.householdId],
    references: [households.id],
  }),
  recipe: one(recipes, {
    fields: [queuedCooks.recipeId],
    references: [recipes.id],
  }),
  creator: one(users, {
    fields: [queuedCooks.createdBy],
    references: [users.id],
  }),
  ingredients: many(queuedCookIngredients),
}));

export const queuedCookIngredients = sqliteTable(
  'queued_cook_ingredients',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    queuedCookId: integer('queued_cook_id')
      .notNull()
      .references(() => queuedCooks.id, { onDelete: 'cascade' }),
    ingredientId: integer('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    unit: text('unit').notNull(),
    baseQuantity: real('base_quantity').notNull(),
    requiredQuantity: real('required_quantity').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  table => [
    uniqueIndex('queued_cook_ingredients_unique_idx').on(
      table.queuedCookId,
      table.ingredientId,
      table.unit,
    ),
    index('queued_cook_ingredients_queued_cook_idx').on(table.queuedCookId),
    index('queued_cook_ingredients_ingredient_idx').on(table.ingredientId),
  ],
);

export const queuedCookIngredientsRelations = relations(
  queuedCookIngredients,
  ({ one }) => ({
    queuedCook: one(queuedCooks, {
      fields: [queuedCookIngredients.queuedCookId],
      references: [queuedCooks.id],
    }),
    ingredient: one(ingredients, {
      fields: [queuedCookIngredients.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

// ─── Cook Events ─────────────────────────────────────────────

export const cookEvents = sqliteTable(
  'cook_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    date: text('date').notNull(),
    batchSize: integer('batch_size').notNull(),
    notes: text('notes'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    deletedAt: text('deleted_at'),
  },
  table => [
    index('cook_events_recipe_idx').on(table.recipeId),
    index('cook_events_user_idx').on(table.userId),
  ],
);

export const cookEventsRelations = relations(cookEvents, ({ one }) => ({
  recipe: one(recipes, {
    fields: [cookEvents.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [cookEvents.userId],
    references: [users.id],
  }),
}));

// ─── Password Reset Tokens ──────────────────────────────────

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);
