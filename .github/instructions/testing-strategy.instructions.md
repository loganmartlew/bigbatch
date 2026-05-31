---
description: 'Use when writing or reviewing Vitest coverage, fast-check invariants, or package-level validation work. Covers test boundaries, focused validation, and property-based testing.'
applyTo: 'apps/**/__tests__/**/*.ts,apps/**/*.test.ts,packages/**/__tests__/**/*.ts,packages/**/*.test.ts,apps/**/vitest.config.ts,packages/**/vitest.config.ts'
---

# Testing Strategy Guidance

- Use Vitest for package-level tests and prefer the narrowest test command that exercises the touched slice.
- Use example-based tests for concrete workflows and business-critical paths.
- Use `fast-check` for invariants, normalization rules, and edge-heavy pure business logic where many input combinations matter.
- Keep tests close to the behavior they verify and follow the existing auth and household test structure when adding API business-rule coverage.
- For web tests, prefer behavior-focused tests over snapshots and keep the scope close to providers, hooks, or route behavior.
- After substantive edits, run the cheapest focused validation first before broad builds or unrelated checks.
- Use filtered `pnpm` commands whenever a package-scoped validation path exists.
