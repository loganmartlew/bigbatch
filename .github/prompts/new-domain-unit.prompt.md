---
name: New BigBatch Domain Unit
description: "Implement or extend a BigBatch domain unit such as ingredients, recipes, shopping list, or cook events using the repo's shared-first workflow."
agent: agent
argument-hint: 'Describe the domain unit, slice, or implementation goal'
---

Implement this BigBatch domain unit using the repository's established sequencing and validation rules.

- Start from the current source tree, not from stale planning assumptions.
- Update shared contracts first when the change affects API or web boundaries.
- Follow with API module wiring, service logic, and focused tests.
- Add or update web integration only for the requested scope.
- Keep household-scoping, AppError usage, and `{ data: ... }` response envelopes consistent with the existing codebase.
- Use filtered `pnpm` validation commands for the touched package set.
- If the request is primarily planning or AI-DLC documentation work, switch to the `aidlc-workflow` agent instead of treating it as normal implementation.
