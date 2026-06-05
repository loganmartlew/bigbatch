# Unit 5: Cook Events — Clarification Questions

Your first round answers clearly changed Unit 5 into a broader cooks workflow, but four remaining design decisions still need explicit answers before the functional-design artifacts can be generated safely.

## Clarification 1: Shared Shopping Item Attribution

Unit 4 currently consolidates shopping-list rows by `(ingredientId, unit)` across the household. That means multiple queued cooks and manual additions can contribute to the same visible shopping row.

How should readiness and automatic cleanup work when a queued cook shares a shopping row with other sources?

A) Keep the shopping list visually consolidated, but store per-queued-cook ingredient requirements in a link table. Readiness compares completed quantities against that cook's linked requirements, and finish/cancel subtracts only that cook's contributed quantity from the shared shopping row.
B) Stop consolidating queued-cook ingredients with unrelated shopping additions; each queued cook should own separate shopping rows.
C) Keep consolidation and linked requirements, but skip automatic cleanup whenever the shopping row is shared by multiple sources.
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Clarification 2: Canceling a Queued Cook

Before a queued cook is finished, should the user be able to remove it from the active queue?

A) Yes — allow cancel/remove from the queue, and automatically subtract its linked shopping quantities
B) Yes — allow cancel/remove from the queue, but leave shopping-list quantities unchanged
C) No — once queued, it can only leave the queue by being finished
D) Other (please describe after [Answer]: tag below)

[Answer]: D. Yes allow, ask user if it should remove items from list

## Clarification 3: Editing Queued Batch Size

After a recipe is added to the cooks queue, should the selected batch size remain editable?

A) Yes — editable while still in `gathering ingredients`, and changing it updates linked ingredient requirements and shopping quantities immediately
B) Yes — editable anytime before entering cook mode
C) No — batch size is locked once the queued cook is created
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Clarification 4: Recipe Detail History Surface

You chose a dashboard-first model, but you also want recipe-specific history accessible from recipe detail. What shape should that recipe-detail history surface take?

A) An inline history section on the recipe detail page
B) A nested route or tab from recipe detail
C) A drawer or modal opened from recipe detail
D) Other (please describe after [Answer]: tag below)

[Answer]: A
