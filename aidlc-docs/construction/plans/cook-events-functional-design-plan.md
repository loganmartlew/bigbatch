# Unit 5: Cook Events — Functional Design Plan (Revised Scope)

## Unit Context

**Unit**: Cook Events (Unit 5)
**Scope**: queued-cook orchestration, shopping-backed readiness, revised cook mode completion flow, and household cooks dashboard/history
**Stories**: existing scope affects US-23, US-24, US-25, and US-26; story and requirement updates will be reconciled after clarification answers
**Dependencies**: Unit 1 (Auth & Household — authenticated user + household access), Unit 2 (Ingredients), Unit 3 (Recipes — recipe detail + cook mode surfaces), Unit 4 (Shopping — shared shopping list state)

## Scope Change Note

This revised Unit 5 no longer fits the earlier narrow "log event + recipe history" model.

Based on the new requested flow, Unit 5 now needs to cover:

- selecting a recipe from recipe detail and preparing it for cooking
- adding the selected recipe to a persistent "to cook" flow (a user-facing queue concept, not necessarily a literal queue data structure)
- adding required ingredients to the household shopping list as part of that flow
- deriving queued-recipe readiness from shopping-list completion state
- revising cook mode from the current slideshow-like stepper into an ingredients-first, checklist-based cooking surface
- finishing a queued cook from cook mode, which removes it from the active queue and logs the cook event
- exposing queue and history together in a household-facing Cooks dashboard

## Current Code Reality

- `cook_events` table and relations already exist in `apps/api/src/db/schema.ts` with `recipeId`, `userId`, `date`, `batchSize`, `notes`, timestamps, and `deletedAt`.
- `CookEvent` already exists in `packages/shared/src/types/index.ts`, but there are no cook-event request/response schemas yet.
- `apps/web/src/routes/recipes/$recipeId.index.tsx` already has a recipe detail action area and a temporary servings scaler, which is the nearest current entry point for "prepare to cook".
- `apps/web/src/routes/recipes/$recipeId.cook.tsx` already provides cook mode, but it is currently a single-step slideshow flow with previous/next navigation, a collapsed ingredient panel, and no completion-driven cook-event flow.
- Unit 4 Shopping is implemented as a shared household shopping list with add-recipe support plus `tickedOff` and `haveThis` completion markers, but there is no current linkage between shopping-list items and a specific planned cook.
- No queue entity, no cooks dashboard, no cook-events API module, no cook-events TanStack Query hooks, and no household history UI currently exist.

---

## Design Steps

- [x] Define the queued-cook domain model, identity rules, lifecycle, and derived states (`gathering ingredients`, `ready to cook`, completed)
- [x] Define the linkage between queued cooks and the shopping list, including readiness derivation and completion/cleanup rules
- [x] Define revised cook-mode behavior: ingredients-first layout, checklist-style instructions, finish semantics, and post-finish logging flow
- [x] Define the Cooks dashboard scope, including active queue presentation, history presentation, edit surfaces, and household/user visibility rules
- [x] Define API contracts for queue creation/listing/completion, cook-event editing, and history retrieval with authorization checks
- [x] Define frontend components and routes touching recipe detail, cooks dashboard, and cook mode
- [x] Identify example-based tests and any applicable PBT/model-based tests, or record explicit N/A rationale where strong properties do not exist

## Resolution Notes

- Follow-up clarification answers in `aidlc-docs/construction/plans/cook-events-functional-design-clarification-questions.md` resolved the remaining open design choices.
- The resulting functional design treats queued cooks as persistent active planning records, cook-event metadata as post-completion editable, and shopping cleanup as safe-by-default for shared consolidated rows.

---

## Questions

### Q1: Active Queue Identity

When a recipe is added to the new "to cook" flow, how many active queued entries should be allowed?

A) At most one active queued entry per recipe per household
B) Multiple active queued entries are allowed for the same recipe; each queued cook is a separate planned cook instance
C) Only one active queued cook should exist in the whole household at a time
D) Other (specify)

[Answer]: B

### Q2: Cook Date Editing Rules

You said cook-event dates should be editable to any date. When should that editable date be chosen?

A) At finish time in cook mode, with later editing also allowed from history
B) Only after the event is created, from the dashboard/history view
C) Both at finish time and later from history
D) Other (specify)

[Answer]: B

### Q3: Queue-to-Shopping Linkage

How should a queued cook determine whether it is "ready to cook" from shopping-list state?

A) The queued cook should snapshot its required ingredient/unit/quantity set at queue time, and readiness should be derived only from those required items
B) The queued cook should store recipe + selected batch size only, and readiness should be derived from the live recipe ingredients against the current shopping list each time
C) Readiness should be derived from the whole shared shopping list globally, without explicit queued-cook ingredient linkage
D) Other (specify)

[Answer]: D: A database table linking ingredients to cooks, discriminated on unit/amount

### Q4: Recipe Changes After Queueing

If a recipe is edited after it has been added to the queue but before cooking starts, what should happen?

A) The queued cook is a snapshot; later recipe edits do not change queued ingredients, steps, or selected batch size
B) The queued cook should follow live recipe edits until cook mode starts
C) Ingredients should be snapshotted, but instruction text can follow live recipe edits
D) Other (specify)

[Answer]: C

### Q5: Finish and Cleanup Behavior

When the user presses `Finish` in cook mode, what should happen to shopping-list items associated with that queued cook?

A) Clear/remove the associated shopping-list items for that queued cook automatically
B) Leave the shopping list unchanged; finishing only clears the queued cook and creates the cook event
C) Prompt the user to choose whether to clear the associated shopping-list items
D) Other (specify)

[Answer]: A

### Q6: Cooks Dashboard Scope

How should the new Cooks dashboard relate to recipe detail pages?

A) The Cooks dashboard is the primary place for both queue and history; recipe detail can link to it but does not need its own history section
B) The dashboard is primary, but recipe detail should still show recipe-specific history inline or as a nested section
C) The dashboard should exist only for the active queue; history should remain recipe-scoped on recipe detail pages
D) Other (specify)

[Answer]: B

### Q7: Event Edit Permissions

Who should be allowed to edit an existing cook event's date (and any editable notes) after it has been logged?

A) Only the user who created the cook event
B) Any household member
C) The creator and household owner only
D) Other (specify)

[Answer]: B

### Q8: Finish Interaction Shape

The new flow ends with a `Finish` button at the bottom of cook mode. How should any final data entry happen?

A) `Finish` opens a confirmation modal/form with date and notes, then completes the queued cook
B) Date and notes fields are shown inline in cook mode above the finish button
C) `Finish` completes immediately with defaults; edits happen later from the dashboard/history view
D) Other (specify)

[Answer]: C
