# Unit 5: Cook Events — Business Rules

## BR-CE-01: Household Scope and Authorization

All queued-cook and cook-event operations are scoped to the requesting user's active household via `X-Household-Id`.

- Every queue read, queue mutation, cook-mode read, and cook-event read/edit validates household membership.
- Queue creation, queue updates, and queue completion use the resolved household only; the client never supplies household identity in the request body.
- Any household member may edit cook-event date and notes after creation.

---

## BR-CE-02: Multiple Active Queued Cooks Are Allowed

The same recipe may appear in the active cooks queue more than once.

- Each queued cook is an independent planned cook instance.
- A queued cook is identified by its own `queuedCookId`, not just by `recipeId`.
- Recipe detail may therefore show multiple queued instances for the same recipe.

---

## BR-CE-03: Queue Creation Snapshots Ingredients, Not Instructions

When a recipe is added to the cooks queue:

- ingredient quantities and units are snapshotted into queued-cook ingredient rows
- the selected batch size is persisted on the queued cook
- the recipe's batch size at queue time is persisted as the scaling baseline
- instruction text is not snapshotted; cook mode reads the current recipe instructions live

This means ingredient requirements remain stable even if the recipe ingredients change later, but instruction wording may reflect later edits until cooking begins.

---

## BR-CE-04: Queued Batch Size Is Editable Only While Gathering Ingredients

The selected batch size for a queued cook may be edited only while the queued cook is still in `gatheringIngredients`.

- Once the queued cook is `readyToCook`, the batch size is locked.
- Editing batch size immediately recalculates queued ingredient requirements and updates shopping-list quantities.
- The recalculation always uses the snapshotted base recipe quantities plus the snapshotted recipe batch size.

---

## BR-CE-05: Readiness Is Derived From Shopping Completion State

Queued-cook readiness is derived from current shopping-list state rather than stored as a persistent status field.

- `gatheringIngredients`: at least one linked queued ingredient is unresolved
- `readyToCook`: every linked queued ingredient has a matching shopping row with enough quantity and either `tickedOff = true` or `haveThis = true`

Matching is by `(householdId, ingredientId, unit)`.

---

## BR-CE-06: Cook Mode Entry Is Gated By Readiness

Users may only enter cook mode for a queued cook that is currently `readyToCook`.

- If shopping-list state changes and the queued cook is no longer ready, cook-mode entry is blocked.
- Recipe detail or dashboard actions should communicate why cooking cannot start yet.

---

## BR-CE-07: Cook Mode Is Ingredients-First And Checklist-Based

Cook mode in Unit 5 replaces the current slideshow-like stepper behavior with a single ingredients-first flow.

- Ingredients are displayed at the top by default.
- All instructions are displayed in one checklist-style list.
- Each step has a checkbox and can be visually marked complete.
- Progress remains ephemeral if the user exits cook mode before finishing.
- Screen wake-lock is requested while cooking and released on exit.

---

## BR-CE-08: Finish Uses Defaults And Creates History Immediately

Pressing `Finish` in cook mode completes the queued cook immediately with default cook-event values.

- `date` defaults to today
- `batchSize` defaults to the queued cook's selected batch size
- `notes` defaults to `null`
- the created cook event is associated with the current user
- post-creation edits to date and notes happen later from dashboard/history surfaces

There is no finish-time modal in this unit.

---

## BR-CE-09: Finish Cleanup Removes Dedicated Shopping Rows Only

When a queued cook finishes, linked shopping rows are cleaned up automatically only when they are dedicated to that queued cook.

- If `shoppingRow.quantity == queuedContribution.requiredQuantity`, the row is removed.
- If `shoppingRow.quantity > queuedContribution.requiredQuantity`, the row is considered shared and is retained unchanged.

This preserves consolidated household shopping rows when other sources still depend on them.

---

## BR-CE-10: Canceling A Queued Cook Requires A Cleanup Choice

Users may cancel/remove a queued cook before it is finished.

- Cancel flow must ask whether associated shopping items should be removed.
- If the user chooses to remove shopping items:
  - dedicated rows are removed
  - shared rows are retained unchanged
- If the user chooses not to remove shopping items, the queue entry is removed but shopping rows stay as-is.

The UI should communicate when shared shopping rows could not be auto-removed.

---

## BR-CE-11: Dashboard Is Primary; Recipe Detail Still Shows Inline History

The primary user-facing surface for Unit 5 is a household-scoped Cooks dashboard.

- Dashboard shows active queued cooks and household cook history.
- Recipe detail still shows an inline recipe-specific history section.
- Dashboard history is ordered newest-first.
- Recipe detail history is recipe-filtered, also newest-first.

---

## BR-CE-12: Cook Event Editing Is Household-Shared

Any household member may edit a cook event's date and notes.

- Date may be changed to any valid calendar date.
- Notes remain optional.
- Actor permissions are household-based rather than creator-only.

---

## BR-CE-13: Soft-Deleted Recipes Retain Cook History

Cook history is retained even if the recipe is later soft-deleted.

- Historical cook events remain queryable from the cooks dashboard.
- Recipe-scoped history queries may include soft-deleted recipes when resolving historical references.
- Active queued cooks for a recipe must not be creatable once the recipe is soft-deleted.

---

## BR-CE-14: Security And Validation Requirements

- All request bodies and params are validated with TypeBox schemas at the API boundary (SECURITY-05).
- All queue and history operations require household membership and object-level authorization (SECURITY-08).
- Completion and cancellation flows must use structured logging without exposing sensitive data (SECURITY-03).
- Public-facing entry points continue to rely on existing rate limiting in the core/auth stack where applicable (SECURITY-11).

---

## Validation Rules Summary

| Field / Operation          | Rule                                            | Error           |
| -------------------------- | ----------------------------------------------- | --------------- |
| `targetBatchSize`          | Required, integer >= 1                          | ValidationError |
| Queue creation recipe      | Must exist, active, and belong to household     | NotFoundError   |
| Queue creation ingredients | Recipe must have at least one ingredient        | ConflictError   |
| Batch-size update          | Allowed only while `gatheringIngredients`       | ConflictError   |
| Cook-mode entry            | Allowed only while `readyToCook`                | ConflictError   |
| Cook-event edit date       | Must be a valid date; any calendar date allowed | ValidationError |
| Cook-event edit notes      | Optional; bounded string                        | ValidationError |
| Queue / event ownership    | Must resolve to current household               | NotFoundError   |

---

## Testable Properties Summary

| ID        | Type      | Property                                                                                                                  |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| PBT-CE-01 | Invariant | readiness is equivalent to "all linked ingredient requirements satisfied by completed shopping rows"                      |
| PBT-CE-02 | Invariant | resizing a queued cook preserves ingredient count and rescales each queued requirement from the stored snapshot baseline  |
| PBT-CE-03 | Stateful  | create / resize / cancel / finish sequences preserve queue-history consistency and never auto-remove shared shopping rows |
