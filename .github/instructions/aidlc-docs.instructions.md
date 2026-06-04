---
description: 'Use when updating AI-DLC planning docs, state tracking, audit logs, generated summaries, or other artifacts under aidlc-docs. Keep documentation grounded in current source code.'
applyTo: 'aidlc-docs/**/*.md'
---

# AI-DLC Docs Guidance

- Treat `apps/api`, `apps/web`, and `packages/shared` as the source of truth for current implementation status.
- Use AI-DLC documents to describe intent, planning, sequencing, and approved target states. Do not let them silently override the codebase.
- Call out the difference between current state and target state explicitly when both appear in the same document.
- Keep AI-DLC artifacts inside `aidlc-docs/`; do not place application code there.
- When a plan or summary references implementation status, verify it against the source tree before updating the document.
- Do not refer to `apps/mobile` as an active workspace package; BigBatch currently ships `apps/api`, `apps/web`, and `packages/shared`.
- If a stage transition changes the project snapshot materially, update `aidlc-docs/aidlc-state.md` and `aidlc-docs/audit.md` as part of the same documentation pass.
