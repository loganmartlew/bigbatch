---
description: 'Use when adding or changing shared TypeBox schemas, API envelopes, or reusable domain types in packages/shared. Covers schema structure, Static exports, and contract-first updates.'
applyTo: 'packages/shared/src/schemas/**/*.ts,packages/shared/src/types/**/*.ts,packages/shared/src/index.ts'
---

# Shared Contracts Guidance

- Keep reusable request and response contracts in `packages/shared` so API and web changes stay aligned.
- Define runtime schemas with TypeBox and export the derived TypeScript types with `Static<typeof Schema>`.
- Group schemas and types by domain instead of mixing unrelated concerns in one file.
- Update shared contracts before wiring new API routes or web calls that depend on them.
- Keep response envelope types compatible with the API convention of `{ data: ... }` and `{ error: { code, message } }`.
- Export new public schemas and types through the shared package entrypoints when other packages need them.
- Keep browser-only and server-only implementation details out of `packages/shared`; this package should stay contract-focused.
