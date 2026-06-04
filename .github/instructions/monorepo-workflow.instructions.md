---
description: 'Use when changing workspace configuration, package manifests, or cross-package wiring. Covers active packages, pnpm-first workflow, and package-boundary expectations in the BigBatch monorepo.'
applyTo: 'package.json,pnpm-workspace.yaml,turbo.json,apps/**/package.json,packages/**/package.json'
---

# Monorepo Workflow Guidance

- The active workspace packages are `apps/api`, `apps/web`, and `packages/shared`.
- Use `pnpm` for workspace commands and prefer filtered commands when only one package is affected.
- Do not introduce npm-specific workflows, docs, or lockfile assumptions into this repository.
- Update `packages/shared` first when a change affects contracts consumed by the API or web app.
- Keep browser-specific code in `apps/web`, server-specific code in `apps/api`, and cross-package contracts in `packages/shared`.
- When adjusting workspace configuration, confirm the change still reflects the current package set and does not reintroduce removed packages or stale package references.
