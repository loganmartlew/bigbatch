# Tech Stack Decision Module — BigBatch

This document expands on Question 13 from the requirements clarification. Your other answers constrain the field significantly:

**Constraints from prior answers:**

- **Q1=D**: Web app + separate native mobile app → cross-platform mobile is in scope
- **Q2=C**: Multi-user (household), shared data → backend with auth required
- **Q3=C**: Cloud-hosted → server + managed database
- **Q4=B**: OpenFoodFacts integration → outbound HTTP calls, caching
- **Q14=A**: Full security enforcement (auth, MFA-capable, secrets mgmt, hardening)
- **Q15=A**: Property-based testing enforced (need framework with strong PBT support)

**Decisions to make**, in dependency order:

1. Mobile strategy (drives backend API style and code-sharing)
2. Backend language & framework
3. Database
4. Authentication
5. API style
6. Web frontend framework
7. Repository structure
8. Hosting / deployment target

Please answer each by choosing a letter after the `[Answer]:` tag.

---

## Decision 1: Mobile Strategy

How should the native mobile app be built?

A) **React Native (Expo)** — JavaScript/TypeScript; share business logic with web; large ecosystem; Expo handles native build & OTA updates

- Pros: Massive code reuse with a React web frontend; one language across stack; mature OpenFoodFacts/HTTP libs; fastest path for a personal project
- Cons: Performance ceiling lower than fully native; some native modules require ejecting from Expo; iOS builds need a Mac or Expo's cloud builder

B) **Flutter** — Dart; single codebase iOS+Android; excellent UI fidelity; great for cook-mode polish

- Pros: Best-in-class UI consistency; very smooth animations; mature tooling; single mobile codebase
- Cons: Dart is a separate language from web; zero code sharing with a web frontend; smaller PBT ecosystem (no first-class framework — would have to roll your own or use limited libraries) — **flags as a PBT-09 risk**

C) **Native (Swift + Kotlin)** — two separate native apps

- Pros: Best performance, full platform fidelity, latest OS features
- Cons: Two codebases to maintain; highest effort; overkill for a personal app; no code sharing with web

D) **PWA only (no native app)** — overrides Q1; just polish the web app for mobile

- Pros: Single codebase; simplest deployment; works offline with service worker
- Cons: No app store presence; some iOS PWA limitations (push, file system); contradicts your Q1 answer

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Decision 2: Backend Language & Framework

What language/framework should power the backend API?

A) **TypeScript + NestJS** (Node.js) — opinionated, modular, decorator-based; Express-compatible

- Pros: Same language as frontend (if React); strong typing; great DI/testing story; `fast-check` PBT framework is excellent
- Cons: Heavier than minimal Node frameworks; Node ecosystem churn

B) **TypeScript + Fastify** (Node.js) — lean, performant, schema-first via JSON Schema/TypeBox

- Pros: Built-in input validation (huge SECURITY-05 win); fast; less ceremony than Nest; same lang as frontend; `fast-check` for PBT
- Cons: Less prescriptive than Nest (you make more architectural choices)

C) **Python + FastAPI** — async, Pydantic-based validation, great DX

- Pros: Pydantic validation (SECURITY-05); async I/O; excellent OpenFoodFacts/data libs; `Hypothesis` is the gold standard PBT framework
- Cons: Different language from frontend; async Python still has some sharp edges

D) **Go + Chi/Echo** — fast, single-binary deploys, simple concurrency

- Pros: Excellent performance; tiny memory footprint (cheap hosting); strong stdlib; `rapid` PBT framework
- Cons: More verbose; smaller ORM ecosystem; different language from frontend

E) **Rust + Axum** — fastest, safest, but steepest learning curve

- Pros: Memory safety; excellent performance; `proptest` PBT framework
- Cons: Slow iteration speed; overkill for a personal cooking app

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Decision 3: Database

What should store recipes, ingredients, users, shopping lists, cook events?

A) **PostgreSQL (managed)** — relational, mature, perfect for this domain

- Pros: Strong relational model fits recipes↔ingredients↔users naturally; JSONB for flexible bits; great managed offerings (Supabase, Neon, Fly Postgres, RDS); SECURITY-01 encryption at rest standard
- Cons: None significant for this app

B) **SQLite (via Litestream or Turso)** — embedded, replicated to cloud

- Pros: Cheapest; very simple; Turso provides multi-region replication
- Cons: Multi-user concurrent writes more limited; less flexible at scale

C) **MongoDB** — document store

- Pros: Recipe-as-document fits naturally
- Cons: Less natural for the ingredient-reuse-across-recipes pattern; weaker referential integrity

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Decision 4: Authentication

How should household users sign in?

A) **Managed auth service** (Auth0, Clerk, Supabase Auth, Firebase Auth)

- Pros: Handles password hashing, MFA, session management, breached-password checks (covers SECURITY-12 out of the box); fast to set up
- Cons: Vendor dependency; cost at scale (free tiers usually fine for household); some require specific frontend libs

B) **Self-managed** (e.g., Lucia Auth, Auth.js / NextAuth, Passport.js, or backend-framework's auth module)

- Pros: Full control; no vendor lock-in; data stays in your DB
- Cons: You own SECURITY-12 compliance (hashing algorithm choice, MFA, brute-force protection, session invalidation)

C) **Email magic links only** (passwordless, e.g., via Resend/Postmark)

- Pros: No passwords to manage at all; simpler SECURITY-12; great UX for personal use
- Cons: Requires reliable email; no MFA story (link-to-inbox is the factor)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Decision 5: API Style

How should the mobile app and web app talk to the backend?

A) **REST + OpenAPI** — standard, language-agnostic, easy to test

- Pros: Universal tooling; simple caching; well-understood; easy to generate typed clients from OpenAPI spec
- Cons: Some boilerplate; over/under-fetching possible

B) **tRPC** — end-to-end TypeScript types, no schema files

- Pros: Full type safety from backend → frontend without codegen; zero API drift
- Cons: TypeScript-only on both ends (rules out FastAPI/Go/Rust backend); harder to call from non-TS clients (e.g., if you ever swap mobile for native)

C) **GraphQL** — flexible client-driven queries

- Pros: Mobile and web can request exactly what they need; one endpoint
- Cons: Overkill for this app's complexity; more setup; harder to cache

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Decision 6: Web Frontend Framework

What should drive the web app?

A) **Next.js (React)** — SSR, app router, broad ecosystem; pairs naturally with React Native

- Pros: Code-share opportunity with React Native (Decision 1A); excellent DX; mature; deploys easily to Vercel/Fly/Netlify
- Cons: Some complexity in app router; React's churn

B) **SvelteKit** — lighter, less ceremony, excellent DX

- Pros: Smaller bundles; very pleasant developer experience; built-in form actions
- Cons: No code-share with React Native mobile; smaller ecosystem

C) **Remix** — React-based, web-fundamentals-first

- Pros: Great form/data story; progressive enhancement
- Cons: Less code-share with React Native than Next.js gives

D) **Plain Vite + React (SPA)** — no framework, just React + a router

- Pros: Simple; full control; smallest learning curve if you know React
- Cons: You build SSR/routing/data conventions yourself

X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Decision 7: Repository Structure

How should the code be organised?

A) **Monorepo** (e.g., pnpm workspaces, Turborepo, or Nx) — single repo with `apps/web`, `apps/mobile`, `apps/api`, `packages/shared`

- Pros: Easy code sharing (types, validation schemas, business logic); atomic cross-cutting changes; single CI pipeline
- Cons: More tooling setup upfront; larger repo

B) **Polyrepo** — separate repos for web, mobile, backend

- Pros: Each repo is simpler; independent deploy cycles
- Cons: Type/schema duplication; harder to do cross-cutting changes

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Decision 8: Hosting / Deployment Target

Where should it run in production?

A) **Single PaaS** (Fly.io, Railway, Render) — one platform for backend + Postgres

- Pros: Simple ops; cheap for small scale; built-in TLS, secrets, logging; SECURITY-02/01 mostly covered by defaults
- Cons: Some vendor specifics; egress costs at scale

B) **Vercel (web) + separate backend host** (e.g., Fly.io for API + DB)

- Pros: Best web hosting for Next.js; clean separation
- Cons: Two platforms to manage

C) **Supabase** (Postgres + auth + storage as a service) + frontend on Vercel/Netlify

- Pros: Auth + DB + storage in one; great DX; covers Decision 3 + 4 + part of backend
- Cons: Some logic ends up in Postgres functions or edge functions; less conventional backend separation

D) **AWS** (e.g., ECS Fargate + RDS + ALB) — full cloud

- Pros: Maximum flexibility; production-grade
- Cons: Heavy ops; expensive for a personal app; longer setup

X) Other (please describe after [Answer]: tag below)

[Answer]: X: since db is managed just somewhere to host the react app and backend. React can be cloudflare pages. A PaaS service for the API.

## My Recommendation (for reference, not a commitment)

For a polished personal household app where a single developer will maintain it, with full security and PBT enforcement:

> **TypeScript everywhere, monorepo**: Next.js (web) + React Native via Expo (mobile) + Fastify (API) + PostgreSQL + Auth.js or Lucia for auth + REST with OpenAPI + pnpm workspaces + Fly.io (or Railway) for hosting.

**Why**: Maximises code reuse (one language, shared validation schemas, shared domain types); `fast-check` gives strong PBT support across all packages; Fastify's schema-first validation directly satisfies SECURITY-05; Postgres on Fly is encrypted-at-rest by default (SECURITY-01); Fly handles TLS, access logs, and secrets management cleanly.

**Alternative if you want maximum PBT power and don't mind two languages**: Python + FastAPI backend (Hypothesis is unmatched) with Next.js web + Expo mobile.

You're free to follow, reject, or mix the recommendation across decisions.
