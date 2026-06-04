---
name: AIDLC Kickoff
description: 'Use when starting or re-entering the BigBatch AI-DLC workflow for planning, reverse engineering, requirements, application design, or artifact generation under aidlc-docs.'
agent: aidlc-workflow
argument-hint: 'Describe the scope, current state, and desired AI-DLC depth'
---

Start an AI-DLC workflow for this request.

Use [`../instructions/aidlc.instructions.md`](../instructions/aidlc.instructions.md) as the shared AI-DLC companion for entry-point guidance, rule loading, stage expectations, and workflow guardrails.

- Determine whether the request belongs in AI-DLC instead of the normal coding workflow.
- Use the code in `apps/api`, `apps/web`, and `packages/shared` as the source of truth.
- Reconcile any drift between source code and `aidlc-docs/` before producing artifacts.
- Follow the required AI-DLC stage sequencing and approval gates.
- Keep outputs scoped to the smallest useful set of documents under `aidlc-docs/`.
- Prefer this prompt when the main task is to start or resume a staged AI-DLC workflow from a normal chat.
