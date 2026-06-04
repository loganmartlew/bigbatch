# Fast-Check Patterns In BigBatch

## Normalization invariants

- `apps/api/src/modules/auth/__tests__/auth.service.test.ts` checks that email normalization is trimmed, lowercased, and idempotent.
- `apps/api/src/modules/auth/__tests__/household.service.test.ts` checks that join-code normalization is idempotent.

## Generated value invariants

- `apps/api/src/modules/auth/__tests__/household.service.test.ts` verifies invite codes stay six characters long, use only the approved alphabet, and avoid ambiguous characters.

## Validation-edge invariants

- `apps/api/src/modules/auth/__tests__/household.service.test.ts` checks that trimmed household names with lengths from 1 to 100 stay in the valid range.
- `apps/api/src/modules/auth/__tests__/auth.service.test.ts` checks that very short passwords always fail the strength threshold.

## Practical guidance

- Prefer `fc.property(...)` when the rule is deterministic and broad input coverage adds real confidence.
- Keep mocks shallow and isolate the pure part of the logic when possible.
- Do not force property-based testing onto UI-heavy behavior or narrow orchestration code that is better covered by examples.
