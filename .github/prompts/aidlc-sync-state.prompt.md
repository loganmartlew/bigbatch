---
name: AIDLC Sync State
description: 'Use when BigBatch AI-DLC state tracking, audit records, or planning artifacts have drifted from the current source tree.'
agent: aidlc-workflow
argument-hint: 'Describe which AI-DLC docs or stages seem out of sync'
---

Audit the current AI-DLC state against the source tree and bring the tracking artifacts back into sync.

Use [`../instructions/aidlc.instructions.md`](../instructions/aidlc.instructions.md) as the shared AI-DLC companion for entry-point guidance, rule loading, stage expectations, and workflow guardrails.

- Compare `aidlc-docs/aidlc-state.md`, `aidlc-docs/audit.md`, and any referenced plan or summary documents with the actual codebase.
- Prefer current source code over stale planning assumptions.
- Update only the AI-DLC artifacts that are necessary to restore an accurate project snapshot.
- Call out any remaining ambiguities or approval-gated decisions explicitly.
- Prefer this prompt when code has already changed and the main job is documentation or state reconciliation rather than a fresh planning workflow.
