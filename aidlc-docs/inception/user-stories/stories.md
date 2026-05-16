# BigBatch — User Stories

Stories are organised by **user journey** (Q1=A), at **medium granularity** (one story per user action, Q2=B), with **mixed acceptance criteria** (GWT for complex flows, checklist for simple validations, Q3=C) and **P0/P1/P2 priority tiers** (Q5=C).

**Priority key**: P0 = launch-critical, P1 = important, P2 = nice-to-have

---

## Journey 1: Getting Started (Sign Up, Household Setup)

### US-01: Register an Account

**As** a new user, **I want to** register with my email and password **so that** I have my own account in BigBatch.

**Priority**: P0  
**Refs**: FR-07.1  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I am on the registration page, when I enter a valid email and password, then my account is created and I am signed in.
- [ ] Given I enter an email already in use, when I submit, then I see an error message and am not registered.
- [ ] Password must be at least 8 characters.
- [ ] Password is checked against breached password lists (SECURITY-12).
- [ ] Registration endpoint is rate-limited (SECURITY-11).

---

### US-02: Sign In

**As** a registered user, **I want to** sign in with my email and password **so that** I can access my household's data.

**Priority**: P0  
**Refs**: FR-07.1, SECURITY-12  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given valid credentials, when I sign in, then I am authenticated and redirected to my household's home screen.
- [ ] Given invalid credentials, when I sign in, then I see a generic error (no information leak).
- [ ] Brute-force protection: after repeated failures, login is throttled or CAPTCHA is required.
- [ ] Session uses secure/httpOnly/sameSite cookies.

---

### US-03: Create a Household

**As** a newly registered user, **I want to** create a new household **so that** I can start using BigBatch and later invite others.

**Priority**: P0  
**Refs**: FR-07.2, Q6  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I have just registered and have no household, when I choose "Create household", then a new household is created and I am its owner.
- [ ] I am immediately able to create recipes and ingredients after creating a household.

---

### US-04: Join an Existing Household via Invite Link

**As** a new or existing user without a household, **I want to** join a household by clicking an invite link **so that** I can share recipes and shopping lists with my household.

**Priority**: P0  
**Refs**: FR-07.4, Q6  
**Persona**: Alex

**Acceptance Criteria**:

- [ ] Given a valid invite link, when I click it and am signed in, then I join the household as a member.
- [ ] Given a valid invite link, when I click it and am not signed in, then I am prompted to sign in or register, then joined to the household.
- [ ] Given an expired or invalid link, when I click it, then I see a clear error.

---

### US-05: Join an Existing Household via Invite Code

**As** a new or existing user without a household, **I want to** enter a short invite code **so that** I can join a household when a link isn't convenient (e.g., told verbally).

**Priority**: P0  
**Refs**: FR-07.4, Q6  
**Persona**: Alex

**Acceptance Criteria**:

- [ ] Given a valid invite code, when I enter it during onboarding, then I join the household as a member.
- [ ] Given an invalid or expired code, when I enter it, then I see a clear error.

---

### US-06: Generate Household Invite

**As** the household owner, **I want to** generate an invite link and invite code **so that** I can share them with people I want to join my household.

**Priority**: P0  
**Refs**: FR-07.4, Q6, Q7  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I am the household owner, when I go to household settings, then I can generate a new invite link and code.
- [ ] The invite link and code are unique and time-limited (expire after a configurable period).
- [ ] Only the household owner can generate invites (Q7=B).

---

## Journey 2: Building the Ingredient Library

### US-07: Create an Ingredient Manually

**As** a cook, **I want to** add a new ingredient with its nutritional data **so that** I can use it in my recipes.

**Priority**: P0  
**Refs**: FR-02.1, FR-02.2, FR-02.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I am on the ingredient creation form, when I enter name, unit (e.g., per 100 g), calories, protein, carbs, fat, and optionally a shopping category, then the ingredient is saved to the household library.
- [ ] Name is required; nutritional values must be non-negative numbers.
- [ ] Input is validated per SECURITY-05 (schema validation).

---

### US-08: Search and Import from OpenFoodFacts

**As** a cook, **I want to** search OpenFoodFacts for an ingredient and pre-fill its nutritional data **so that** I don't have to look up and type everything manually.

**Priority**: P1  
**Refs**: FR-02.4  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I am creating/editing an ingredient, when I search OpenFoodFacts by name or barcode, then matching results are displayed with their nutritional data.
- [ ] Given I select a result, when I confirm, then the ingredient form is pre-filled with the returned data.
- [ ] I can adjust any pre-filled value before saving.
- [ ] If OpenFoodFacts is unavailable, the search fails gracefully with an error message (SECURITY-15).

---

### US-09: Edit an Ingredient

**As** a cook, **I want to** update an ingredient's nutritional data or category **so that** all recipes using it reflect accurate values.

**Priority**: P0  
**Refs**: FR-02.5, FR-02.6  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I edit an ingredient and save, then all recipes using that ingredient show updated nutrition totals.
- [ ] Given I change an ingredient's shopping category, then future shopping lists use the new category.

**PBT Property** (PBT-03 — Invariant): After editing an ingredient's nutrition, for every recipe using it, `recipe.totalNutrition == sum(ingredient.nutrition * quantity for each ingredient)`.

---

### US-10: Assign Shopping Category to Ingredient

**As** a cook, **I want to** assign a category (produce, dairy, pantry, meat, etc.) to an ingredient **so that** shopping lists are automatically grouped.

**Priority**: P1  
**Refs**: FR-02.6, FR-04.3  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] A predefined set of categories is available (produce, dairy, pantry, meat, frozen, bakery, other).
- [ ] Default category is "other" if none assigned.
- [ ] Category is saved on the ingredient and used for shopping list grouping.

---

## Journey 3: Creating and Managing Recipes

### US-11: Create a Recipe

**As** a cook, **I want to** create a new recipe with ingredients, instructions, and a batch size **so that** I can reuse it for future cooks.

**Priority**: P0  
**Refs**: FR-01.1  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I fill in recipe name, add at least one ingredient (selected from library, with quantity and unit), add at least one instruction step, and set a batch size, when I save, then the recipe is created and visible to my household.
- [ ] Nutrition totals and per-portion values are calculated and displayed on save (FR-03.1, FR-03.2).
- [ ] All inputs validated per SECURITY-05.

**PBT Property** (PBT-03 — Invariant): `recipe.perPortionNutrition == recipe.totalNutrition / recipe.batchSize` for each macro.

---

### US-12: Edit a Recipe

**As** a cook, **I want to** edit any field of a saved recipe **so that** I can improve it over time.

**Priority**: P0  
**Refs**: FR-01.2  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I am viewing a recipe I can edit, when I change any field (name, ingredients, instructions, batch size) and save, then the recipe is updated.
- [ ] Nutrition values are recalculated on save.
- [ ] Only household members can edit household recipes (SECURITY-08).

---

### US-13: Duplicate a Recipe

**As** a cook, **I want to** duplicate a recipe **so that** I can create a variant without altering the original.

**Priority**: P1  
**Refs**: FR-01.3  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I view a recipe, when I choose "Duplicate", then a new recipe is created with the same ingredients, instructions, and batch size, prefixed with "Copy of".
- [ ] The duplicate is independently editable.

**PBT Property** (PBT-02 — Round-trip): `duplicate(recipe).ingredients == recipe.ingredients` and `duplicate(recipe).instructions == recipe.instructions` (structural equality, independent identity).

---

### US-14: Delete a Recipe

**As** a cook, **I want to** delete a recipe I no longer need **so that** my library stays clean.

**Priority**: P1  
**Refs**: FR-01.4  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I view a recipe, when I choose "Delete" and confirm, then the recipe is removed.
- [ ] Deletion requires confirmation to prevent accidental loss.
- [ ] Associated cook history entries are retained (orphaned but still viewable historically) or deleted — owner decides. _(Design decision — default: retain.)_

---

### US-15: Scale a Recipe

**As** a cook, **I want to** scale a recipe to a different number of portions **so that** ingredient quantities adjust automatically.

**Priority**: P0  
**Refs**: FR-01.5  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I view a recipe with batch size 8, when I scale to 12, then each ingredient quantity is multiplied by 12/8 with sensible rounding (nearest 5 g, 0.25 tsp).
- [ ] After scaling, I can manually override any individual ingredient quantity.
- [ ] Nutrition totals and per-portion values update to reflect the scaled quantities.
- [ ] Scaling does not permanently alter the saved recipe — it's a view/session-level adjustment (unless the user explicitly saves).

**PBT Properties**:

- (PBT-03 — Invariant): Scaling preserves ingredient count — `scaled.ingredients.length == original.ingredients.length`.
- (PBT-03 — Invariant): Per-portion nutrition is approximately equal before and after scaling (within rounding tolerance).
- (PBT-04 — Idempotency): Scaling to N then scaling to N again yields the same result — `scale(scale(recipe, N), N) == scale(recipe, N)`.

---

### US-16: View Recipe with Nutrition

**As** a household member, **I want to** view a recipe with its total and per-portion nutrition **so that** I know what's in each serving.

**Priority**: P0  
**Refs**: FR-03.1, FR-03.2, FR-03.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Recipe detail view shows total calories, protein, carbs, fat.
- [ ] Recipe detail view shows per-portion calories, protein, carbs, fat.
- [ ] Values update in real time if I adjust batch size.

---

## Journey 4: Shopping

### US-17: Add Recipe to Shopping List

**As** a cook, **I want to** add a recipe's ingredients to my shopping list with one action **so that** I don't have to manually transcribe everything.

**Priority**: P0  
**Refs**: FR-04.1  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I view a recipe (optionally scaled), when I tap "Add to shopping list", then all ingredients are added at the scaled quantities.
- [ ] If the shopping list already has the same ingredient, quantities are consolidated (FR-04.2).

**PBT Property** (PBT-04 — Idempotency): Adding the same recipe twice consolidates to double the quantity — `addToList(addToList(list, recipe), recipe).quantity(ingredient) == 2 * recipe.quantity(ingredient)`. More precisely, consolidation is idempotent: `consolidate(consolidate(list)) == consolidate(list)`.

---

### US-18: Consolidate Shopping List Across Recipes

**As** a cook, **I want** duplicate ingredients from multiple recipes to be merged into single line items **so that** my list is clean and easy to follow at the store.

**Priority**: P0  
**Refs**: FR-04.2  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I add 3 recipes each using 200 g onions, when I view the shopping list, then I see one "onions" line item showing 600 g.
- [ ] Consolidation works across different recipes and different scaling.
- [ ] Items with different units for the same ingredient are kept as separate line items (e.g., 2 cups milk + 100 ml milk stay separate — unit conversion is out of scope).

**PBT Properties**:

- (PBT-04 — Idempotency): `consolidate(consolidate(list)) == consolidate(list)`.
- (PBT-03 — Invariant): Total quantity of each ingredient across all line items is preserved after consolidation.

---

### US-19: Mark "I Have This" on Shopping List

**As** a cook, **I want to** mark ingredients I already have when generating a shopping list **so that** I only buy what I actually need.

**Priority**: P1  
**Refs**: FR-04.4  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I am viewing the shopping list, when I toggle "I have this" on an ingredient, then it is visually distinguished (e.g., greyed out or hidden) and excluded from the active list.
- [ ] This is per-list, not a persistent pantry — the flag resets when the list is cleared.

---

### US-20: Group Shopping List by Category

**As** a shopper, **I want** shopping list items grouped by category (produce, dairy, pantry, etc.) **so that** I can shop efficiently aisle by aisle.

**Priority**: P1  
**Refs**: FR-04.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Items are grouped by their ingredient's shopping category.
- [ ] Items with no category appear under "Other".
- [ ] Groups are displayed in a consistent order.

---

### US-21: Tick Off Shopping List Items

**As** a shopper, **I want to** tick off items as I shop **so that** I can track my progress through the store.

**Priority**: P0  
**Refs**: FR-04.5  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I am viewing the shopping list, when I tap an item, then it is marked as ticked off (visually struck through or moved to a "done" section).
- [ ] Ticked items persist until the list is cleared.
- [ ] Shopping list state is shared — if Alex ticks an item, Sam sees it (FR-04.6).

---

### US-22: Clear Shopping List

**As** a cook, **I want to** clear the shopping list when I'm done shopping **so that** I can start fresh for the next cook session.

**Priority**: P0  
**Refs**: Q8=B (persistent until cleared)  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given a shopping list with items, when I choose "Clear list" and confirm, then all items are removed.
- [ ] Clearing requires confirmation.

---

## Journey 5: Cooking

### US-23: Enter Cook Mode

**As** a cook in the kitchen, **I want to** open a recipe in cook mode **so that** I can follow the instructions hands-free with large readable text.

**Priority**: P0  
**Refs**: FR-05.1, FR-05.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I view a recipe, when I tap "Cook", then the recipe opens in a full-screen, large-text, distraction-free view showing instructions.
- [ ] Screen wake-lock is activated — the screen does not turn off while in cook mode (FR-05.3).
- [ ] Wake-lock is released when exiting cook mode.

---

### US-24: Follow Steps in Cook Mode

**As** a cook in the kitchen, **I want to** tick off instruction steps as I complete them **so that** I can track where I am in the recipe.

**Priority**: P0  
**Refs**: FR-05.2  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Each instruction step has a checkbox.
- [ ] Tapping a step marks it as done (visual change — e.g., struck through or dimmed).
- [ ] Progress is not persisted after exiting cook mode (cook mode is ephemeral per session).

---

## Journey 6: Logging and History

### US-25: Log a Cook Event

**As** a cook, **I want to** log that I cooked a recipe, with the batch size and optional notes **so that** I can track what I've made and reflect on it later.

**Priority**: P1  
**Refs**: FR-06.1, FR-06.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I have just exited cook mode (or I'm viewing a recipe), when I choose "Log cook", then I can enter/confirm the date, batch size, and optional notes.
- [ ] The cook event is associated with my user account.
- [ ] Default date is today; default batch size is the recipe's current batch size.

---

### US-26: View Cook History for a Recipe

**As** a household member, **I want to** see when a recipe was cooked, by whom, at what batch size, and with what notes **so that** I can learn from past cooks.

**Priority**: P1  
**Refs**: FR-06.2  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I view a recipe, when I navigate to its cook history, then I see a chronological list of cook events showing date, user, batch size, and notes.
- [ ] Events are ordered newest-first.

---

## Journey 7: Household Management

### US-27: View Household Members

**As** a household member, **I want to** see who is in my household **so that** I know who has access.

**Priority**: P1  
**Refs**: FR-07.3  
**Persona**: Sam, Alex

**Acceptance Criteria**:

- [ ] Given I open household settings, then I see a list of all members with their names/emails and role (owner/member).

---

### US-28: Remove a Household Member

**As** the household owner, **I want to** remove a member from my household **so that** I can manage who has access.

**Priority**: P2  
**Refs**: Q7=B  
**Persona**: Sam

**Acceptance Criteria**:

- [ ] Given I am the owner, when I remove a member and confirm, then they lose access to household data.
- [ ] Only the owner can remove members.
- [ ] The owner cannot remove themselves.

---

## Story Traceability Matrix

| Requirement | Stories                      |
| ----------- | ---------------------------- |
| FR-01.1     | US-11                        |
| FR-01.2     | US-12                        |
| FR-01.3     | US-13                        |
| FR-01.4     | US-14                        |
| FR-01.5     | US-15                        |
| FR-01.6     | US-11 (household visibility) |
| FR-02.1     | US-07                        |
| FR-02.2     | US-07                        |
| FR-02.3     | US-07                        |
| FR-02.4     | US-08                        |
| FR-02.5     | US-09                        |
| FR-02.6     | US-10                        |
| FR-03.1     | US-11, US-16                 |
| FR-03.2     | US-11, US-16                 |
| FR-03.3     | US-16                        |
| FR-04.1     | US-17                        |
| FR-04.2     | US-17, US-18                 |
| FR-04.3     | US-20                        |
| FR-04.4     | US-19                        |
| FR-04.5     | US-21                        |
| FR-04.6     | US-21                        |
| FR-05.1     | US-23                        |
| FR-05.2     | US-24                        |
| FR-05.3     | US-23                        |
| FR-06.1     | US-25                        |
| FR-06.2     | US-26                        |
| FR-06.3     | US-25                        |
| FR-07.1     | US-01, US-02                 |
| FR-07.2     | US-03, US-04, US-05          |
| FR-07.3     | US-27                        |
| FR-07.4     | US-04, US-05, US-06          |
| FR-08.1     | US-07, US-11                 |
| FR-08.2     | US-07, US-11                 |

---

## PBT Property Summary (feeding PBT-01)

| Story | Property Category    | Property Description                                                                |
| ----- | -------------------- | ----------------------------------------------------------------------------------- |
| US-09 | Invariant (PBT-03)   | After ingredient edit, recipe nutrition = sum of (ingredient nutrition \* quantity) |
| US-11 | Invariant (PBT-03)   | perPortionNutrition = totalNutrition / batchSize                                    |
| US-13 | Round-trip (PBT-02)  | Duplicate recipe has structurally equal ingredients and instructions                |
| US-15 | Invariant (PBT-03)   | Scaling preserves ingredient count                                                  |
| US-15 | Invariant (PBT-03)   | Per-portion nutrition approximately equal before/after scaling                      |
| US-15 | Idempotency (PBT-04) | scale(scale(recipe, N), N) == scale(recipe, N)                                      |
| US-17 | Idempotency (PBT-04) | consolidate(consolidate(list)) == consolidate(list)                                 |
| US-18 | Idempotency (PBT-04) | consolidate(consolidate(list)) == consolidate(list)                                 |
| US-18 | Invariant (PBT-03)   | Total quantity per ingredient preserved after consolidation                         |

---

## INVEST Validation

| Criterion       | Status | Notes                                                                                              |
| --------------- | ------ | -------------------------------------------------------------------------------------------------- |
| **Independent** | Pass   | Stories can be implemented and tested independently; cross-references noted but no hard sequencing |
| **Negotiable**  | Pass   | Acceptance criteria are concrete but implementation details are open                               |
| **Valuable**    | Pass   | Each story delivers visible user value                                                             |
| **Estimable**   | Pass   | Medium granularity — each story is scoped to a single user action                                  |
| **Small**       | Pass   | No story requires more than a few days of implementation                                           |
| **Testable**    | Pass   | Every story has explicit acceptance criteria; complex flows use GWT format                         |
