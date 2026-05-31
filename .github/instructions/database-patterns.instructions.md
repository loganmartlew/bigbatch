---
description: 'Use when changing Drizzle schema files, relations, or migration-oriented database code in apps/api. Covers naming, soft deletes, household ownership, and index patterns.'
applyTo: 'apps/api/src/db/**/*.ts'
---

# Database Pattern Guidance

- Follow the existing Drizzle naming style: singular table exports, snake_case column names, and explicit relation declarations.
- Keep household ownership explicit in the schema and mirror that ownership in query patterns.
- Preserve soft-delete behavior for recipes, ingredients, and cook events via `deletedAt`; do not convert those domains to hard deletes casually.
- Add indexes that match the way the application queries data, especially household-scoped lookups and active-record filters.
- Keep join tables and relation tables consistent with the existing schema structure before introducing alternate patterns.
- Validate schema changes with the repo’s Drizzle workflow: `pnpm db:generate` and `pnpm db:migrate` from the filtered API workspace.
- When adding new schema for user-facing units, confirm the corresponding shared contracts and service-layer filters at the same time.
