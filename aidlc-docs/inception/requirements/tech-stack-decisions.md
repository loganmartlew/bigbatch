# Tech Stack Decisions — BigBatch

## Current Scope Update (2026-05-23)

- **Active delivery**: web app + API + shared package
- **Deferred delivery**: fully native iOS and Android apps in a later phase
- **Superseded assumption**: the earlier Expo/React Native foundation is no longer part of the active plan

This file now reflects the **current** stack choices that should guide implementation and future AI-DLC artifacts.

---

## Active Decisions

| Area | Choice | Rationale |
| --- | --- | --- |
| Current delivery scope | Web-first | Reduces active platforms during construction and keeps focus on shipping the core product loop |
| Future mobile strategy | Fully native iOS + Android (deferred) | Matches the revised product direction without forcing current construction to carry mobile implementation cost |
| Backend | TypeScript + Fastify | Schema-first validation, strong performance, direct fit with current TypeScript codebase and SECURITY-05 |
| Database | SQLite via Turso | Simple operational model, encrypted managed storage, good fit for household-scale concurrency |
| Authentication | Self-managed Lucia Auth | Aligns with the application design already in progress and keeps auth inside the existing API boundary |
| API style | REST + OpenAPI | Client-agnostic contract that works for the current web app and future native apps |
| Web frontend | Vite + React SPA | Matches the existing foundation and keeps deployment simple on Cloudflare Pages |
| Web routing | TanStack Router | Type-safe routing and strong fit with the current Vite/React foundation |
| Web server state | TanStack Query | Consistent caching/mutation patterns for the current web client |
| Web UI system | Mantine | Provides theming, layout primitives, polished component styling, and accessible defaults for the web experience |
| Repo structure | Monorepo | Keeps `apps/web`, `apps/api`, and `packages/shared` together for atomic changes and shared contracts |
| Hosting — Web | Cloudflare Pages | Static SPA hosting on CDN edge with response-header support |
| Hosting — API | PaaS (e.g., Fly.io or Railway) | Managed TLS, secrets, logs, and simple Node deployment |
| Hosting — DB | Turso | Managed libSQL deployment aligned with the database decision |
| Property-based testing | fast-check | Best fit for the active TypeScript codebase and existing PBT enforcement |

---

## Active Workspace Shape

```text
bigbatch/
├── apps/
│   ├── api/
│   └── web/
└── packages/
    └── shared/
```

The current workspace intentionally excludes any active mobile application package. Future native clients should be introduced as a separate follow-on effort once the web-first product flow is stable.

---

## Guidance for Future Native Work

- Do **not** resurrect the Expo foundation for the next mobile phase.
- Preserve the REST + OpenAPI API boundary so future Swift/Kotlin clients can consume it without web-framework coupling.
- Keep domain logic and schemas in `packages/shared` where that benefits the active TypeScript codebase, but do not assume those packages will be directly reused by native apps.
