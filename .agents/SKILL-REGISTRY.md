# BigBatch Skill Registry

This registry tracks the workspace-shared skills currently installed under `.agents/skills/`.
It is the team-facing index for skills that travel with this repository.

## BigBatch-specific skills

- `bigbatch-domain-slice`: Shared-first workflow for multi-package feature slices such as ingredients, recipes, shopping list, and cook events.
- `fast-check-invariants`: Property-based testing guidance grounded in the current auth and household test suites.

## Framework and library skills installed in this repo

- `fastify-best-practices`: General Fastify backend guidance for routes, plugins, validation, hooks, security, performance, and production patterns.
- `mantine-combobox`: Mantine Combobox primitives for custom select-like UI.
- `mantine-custom-components`: Mantine factory and Styles API guidance for custom components.
- `mantine-form`: Mantine form guidance. Use only when the touched code is actually using `@mantine/form`.

## Scope note

- This file intentionally lists workspace-shared skills only.
- User-profile skills that may exist on one machine are not treated as repo-standard workflow dependencies.
