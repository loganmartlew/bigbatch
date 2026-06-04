---
name: Review BigBatch Slice
description: 'Review a BigBatch feature slice or change set for bugs, regressions, contract drift, household scoping issues, and missing tests.'
agent: repo-review
argument-hint: 'Describe the feature slice, changed files, or comparison to review'
---

Review this BigBatch change or feature slice.

- Prioritize correctness, regressions, and missing tests over style feedback.
- Check shared contracts, household-scoping rules, error-envelope consistency, and soft-delete behavior where relevant.
- Use focused validation commands when they sharpen or confirm a finding.
- Return findings first, then open questions, then residual risk.
