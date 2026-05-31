---
name: fast-check-invariants
description: 'Write BigBatch Vitest plus fast-check property-based tests for business-rule invariants, normalization rules, generated values, and edge-heavy pure logic.'
argument-hint: 'Describe the invariant, module, or business rule to test'
---

# Fast-Check Invariants

Use this skill when example-based tests are not enough because a rule should hold across a wide range of inputs.

## When to Use

- Normalization rules such as trim and lowercase behavior
- Generated values such as invite codes
- Ownership and validation invariants with many input combinations
- Pure or mostly pure service logic where the core behavior can be isolated from external systems

## Procedure

1. Start with the concrete business rule and write one or two example-based tests for the key path first.
2. Identify the invariant that should hold for many inputs.
3. Choose the smallest `fast-check` generator that covers the rule clearly.
4. Keep the assertion focused on the invariant, not on unrelated implementation details.
5. Mix example-based and property-based tests in the same suite when both add value.

## References

- [Patterns](./references/patterns.md)
