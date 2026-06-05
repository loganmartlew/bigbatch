import { describe, it, expect } from 'vitest';
import * as schema from '../db/schema.js';

describe('Database Schema', () => {
  it('exports all 14 tables', () => {
    const tables = [
      schema.users,
      schema.households,
      schema.userHouseholds,
      schema.householdInvites,
      schema.sessions,
      schema.ingredients,
      schema.recipes,
      schema.recipeInstructions,
      schema.recipeIngredients,
      schema.shoppingCategories,
      schema.shoppingListItems,
      schema.queuedCooks,
      schema.queuedCookIngredients,
      schema.cookEvents,
    ];

    expect(tables).toHaveLength(14);
    for (const table of tables) {
      expect(table).toBeDefined();
    }
  });

  it('users table has required columns', () => {
    const columns = Object.keys(schema.users);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('firstName');
    expect(columns).toContain('lastName');
    expect(columns).toContain('hashedPassword');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('recipes table has soft delete column', () => {
    const columns = Object.keys(schema.recipes);
    expect(columns).toContain('deletedAt');
  });

  it('ingredients table has soft delete column', () => {
    const columns = Object.keys(schema.ingredients);
    expect(columns).toContain('deletedAt');
  });

  it('cookEvents table has soft delete column', () => {
    const columns = Object.keys(schema.cookEvents);
    expect(columns).toContain('deletedAt');
  });
});
