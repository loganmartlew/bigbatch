# Unit 4: Shopping - Web Remediation Plan

## Status

- **Status**: IMPLEMENTED
- **Implementation Date**: 2026-06-04
- **Validation**: `pnpm --filter @bigbatch/web typecheck`, `pnpm --filter @bigbatch/web test`

This document preserves the pre-implementation diagnosis and the approved plan that was executed.

## Purpose

Address the implementation issues discovered after the first Shopping web pass without changing the backend contract unless a later implementation pass proves it necessary.

This plan is grounded in the current source tree, especially:

- `apps/web/src/routes/shopping/index.tsx`
- `apps/web/src/features/shopping/api.ts`
- `apps/web/src/features/shopping/AddIngredientModal.tsx`
- `apps/web/src/routes/ingredients/index.tsx`
- `apps/web/src/features/recipes/components/*`
- `apps/web/src/features/ingredients/components/*`

## Pre-Implementation Code Reality

### Structural mismatches

- `apps/web/src/routes/shopping/index.tsx` currently contains the route component plus `ShoppingItemRow` and `ShoppingCategoryGroup` in the same file.
- `apps/web/src/features/shopping/` currently contains only `api.ts` and `AddIngredientModal.tsx`.
- Other mature feature folders (`recipes`, `ingredients`) already use `components/` directories with kebab-case component filenames.
- `AddIngredientModal.tsx` is named in PascalCase and sits at the feature root, which does not match the local feature conventions.

### Interaction mismatches

- `useToggleTickedOff` and `useToggleHaveThis` currently only invalidate the list query after success; they do not perform optimistic cache updates.
- Active rows currently expose `Have it` as a checkbox and keep the delete icon always visible in the row.
- Done-state behavior is not modeled in the UI. Items remain in the same grouped list even after `tickedOff` or `haveThis` is set.
- There is no restore interaction that moves a done item back into the active list.
- There is no mobile swipe affordance for active shopping rows.

### Scope gap relative to earlier summary

- The Ingredient Library route is wired to the Shopping modal.
- The Ingredient Detail route is not currently wired to the Shopping modal, so the earlier summary overstated current coverage.

## Target Outcome

After remediation:

1. Shopping routes are thin orchestration layers.
2. Shopping reusable UI lives under `apps/web/src/features/shopping/components/`.
3. Tick-off and Have it actions update the UI optimistically.
4. Active rows use a three-dot action menu for `Have it` and `Delete`.
5. Any item with `tickedOff === true` or `haveThis === true` moves into a separate Done area.
6. Done items expose a clear Restore action that returns them to the main list.
7. Mobile users can swipe active rows left/right to reach destructive or completion actions without cluttering the default row UI.

## Proposed Implementation Plan

### Phase 1 - Align the Shopping feature structure

Goal: make the Shopping slice match existing web feature conventions before changing behavior.

Planned changes:

- Create `apps/web/src/features/shopping/components/`.
- Move `AddIngredientModal.tsx` to `apps/web/src/features/shopping/components/add-ingredient-modal.tsx`.
- Extract row and section UI from the route into feature components, for example:
  - `shopping-item-row.tsx`
  - `shopping-category-group.tsx`
  - `shopping-done-section.tsx`
  - `shopping-item-actions-menu.tsx`
  - `clear-shopping-list-modal.tsx`
- Keep `apps/web/src/routes/shopping/index.tsx` as a thin page shell that composes hooks, modals, and extracted components.
- Update imports in Shopping routes and ingredient routes to use the new feature component locations.

Notes:

- Follow the existing pattern used by `apps/web/src/features/recipes/components/` and `apps/web/src/features/ingredients/components/`.
- Use kebab-case filenames for new feature components.

### Phase 2 - Introduce a UI view-model for active vs done items

Goal: separate presentation rules from transport shape without changing the API contract.

Planned changes:

- Add a Shopping feature selector/helper that derives:
  - active groups: items where `!tickedOff && !haveThis`
  - done items: items where `tickedOff || haveThis`
- Keep the current backend response shape (`ShoppingListResponse`) unchanged for this remediation pass.
- Decide and document restore semantics:
  - Restore clears all done flags that would otherwise keep the item in the Done area.
  - In practice, if both `tickedOff` and `haveThis` are true, Restore should clear both so the item deterministically returns to the active list.
- Render Done as a dedicated section below the active grouped list.

Notes:

- This keeps the backend stable and localizes the new behavior to the web feature layer.
- If implementation friction shows the toggle-only API is too awkward for restore, revisit API shape in a separate slice instead of mixing it into this UI refactor by default.

### Phase 3 - Add optimistic query-cache updates

Goal: make the list feel immediate for the two most frequent completion actions.

Planned changes:

- Add feature-local cache helpers in the Shopping slice for patching `ShoppingListResponse` in TanStack Query.
- Update `useToggleTickedOff` and `useToggleHaveThis` to use `onMutate`, `onError`, and `onSettled`.
- Optimistically move items between Active and Done areas in the cached response.
- Keep server invalidation on settle as a correctness backstop.
- Include optimistic handling for Restore because it is the inverse of the same state transition.

Recommended scope boundary:

- `tickedOff`, `haveThis`, and Restore must be optimistic in this pass.
- Delete can remain invalidate-on-success initially unless swipe UX requires local removal to feel acceptable.
- Quantity editing can remain non-optimistic unless it becomes part of the same cache helper with low extra complexity.

### Phase 4 - Replace the Have it checkbox with an actions menu

Goal: declutter the row and match the requested interaction model.

Planned changes:

- Remove the `Have it` checkbox from active rows.
- Add a three-dot trigger on each active row using a Mantine menu/popover-style pattern.
- Move these actions into that menu:
  - `Mark as have it`
  - `Delete item`
- Keep the left-side checkbox for tick-off as the primary quick action.
- For done rows, replace the menu-first interaction with an explicit Restore action so recovery is obvious.

Notes:

- Mantine `Menu` is the preferred implementation surface for the three-dot interaction because it naturally fits the requested popover menu behavior.

### Phase 5 - Add the Done area and restore flow

Goal: make completed items visible but clearly separated from active work.

Planned changes:

- Add a dedicated Done section beneath the active grouped list.
- Move any item marked as ticked off or have it into that section immediately.
- Use a visually subdued row treatment for done items.
- Add a Restore button on done rows that returns the item to the active list.
- Optionally make the Done section collapsible if the section becomes visually heavy during implementation.

Suggested default behavior:

- Active area remains grouped by category.
- Done area can be a flat list first; only add done-grouping if the flat list proves too noisy.

### Phase 6 - Add mobile swipe affordances for active rows

Goal: support efficient one-handed mobile shopping interactions without degrading desktop UX.

Planned changes:

- Introduce a mobile-only swipe wrapper for active rows, for example `shopping-swipe-row.tsx`.
- Swipe right should expose or trigger `Have it`.
- Swipe left should expose or trigger `Delete`.
- Keep the three-dot menu as the desktop and fallback interaction.
- Limit swipe behavior to active rows only; done rows should stay simple with Restore.

Implementation guidance:

- Prefer a reveal-actions interaction over immediate destructive commit unless implementation testing shows a committed threshold is safe and predictable.
- Gate swipe behavior to touch/coarse pointer contexts so desktop pointer interactions stay stable.
- If a dependency is needed, keep it lightweight and isolated to the Shopping feature. Evaluate whether the behavior can be implemented cleanly with pointer events before adding a new package.

### Phase 7 - Finish the entry-point wiring and regression coverage

Goal: make the feature complete across all promised entry points and reduce regression risk.

Planned changes:

- Wire the Shopping modal or equivalent Add-to-List trigger into the Ingredient Detail route, not just the Ingredient Library route.
- Add web tests around:
  - active vs done derivation
  - optimistic tick-off transition
  - optimistic Have it transition
  - restore behavior
  - action menu rendering and actions
  - ingredient-detail Add-to-List entry point
- Run focused manual mobile QA for swipe behavior in responsive emulation before considering the slice done.

## Recommended Delivery Order

1. Feature-structure refactor
2. Active/done selector extraction
3. Done section + restore behavior
4. Action menu replacement for Have it/Delete
5. Optimistic cache updates for tick-off and Have it
6. Ingredient Detail wiring
7. Mobile swipe interactions
8. Tests and responsive QA pass

## Risks And Mitigations

### Risk: optimistic updates become brittle because the cached response is grouped

Mitigation:

- Centralize all cache edits in a small set of helper functions.
- Keep invalidate-on-settle even after optimistic updates are introduced.

### Risk: restore behavior is ambiguous when both flags are true

Mitigation:

- Treat Restore as "make active again" and clear both flags.
- Document this behavior in the component tests and user-facing implementation notes.

### Risk: swipe-to-delete is too easy to trigger accidentally

Mitigation:

- Prefer swipe-to-reveal over swipe-to-instant-delete.
- Reserve actual deletion for an explicit tap on the revealed action unless testing proves a threshold-based commit is safe.

### Risk: route files remain too heavy after the first extraction pass

Mitigation:

- Treat route thinness as a completion criterion, not a best-effort outcome.
- Keep feature presentation, cache helpers, and modal logic out of `src/routes/shopping/index.tsx`.

## Approval Gate

This plan is ready for approval before implementation.

Key decisions embedded in this plan:

1. No backend contract change by default for the remediation slice.
2. Restore clears all done flags and returns the item to the active list.
3. The three-dot menu replaces inline Have it/Delete on active rows.
4. Swipe behavior is mobile-only and limited to active rows.
