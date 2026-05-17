# Unit 0: Foundation — Functional Design Plan

## Plan Steps

- [x] Define complete database schema (all entities, relationships, constraints)
- [x] Define base shared types and enums
- [x] Define core middleware behavior (auth guard, error handling, validation)
- [x] Define API client contract (request/response patterns, header conventions)
- [x] Validate schema against all unit story requirements (Units 1–5)

---

## Questions

### Q1: Soft Deletes

Should any entities use soft deletes (a `deletedAt` column) or hard deletes?

A) **Hard deletes everywhere** — when something is deleted, it's gone from the database
B) **Soft deletes for user-created content** (recipes, ingredients, cook events) but hard deletes for transient data (shopping list items, invites, sessions)
C) **Soft deletes everywhere** — nothing is ever physically removed

[Answer]: B

---

### Q2: Timestamps

Which timestamp columns should entities have?

A) **createdAt only** — just track when things were created
B) **createdAt + updatedAt** — track creation and last modification
C) **createdAt + updatedAt + deletedAt** (if soft deletes chosen above)

[Answer]: C

---

### Q3: ID Strategy

What type of primary keys should entities use?

A) **Auto-increment integers** — simple, compact, sequential
B) **UUIDs (v4)** — universally unique, no sequential leaks, good for distributed systems
C) **CUID2 / nanoid** — shorter than UUID, URL-safe, non-sequential, collision-resistant

[Answer]: A

---

### Q4: Invite Expiry

How long should household invite links/codes remain valid?

A) **24 hours**
B) **7 days**
C) **30 days**
D) **Never expire** (valid until manually revoked)

[Answer]: A

---

### Q5: Shopping Category Set

The design mentions a predefined set of shopping categories. Should this be:

A) **Fixed enum in code** — e.g., produce, dairy, pantry, meat, frozen, bakery, other (not user-editable)
B) **User-editable per household** — households can add/rename/reorder categories
C) **Fixed defaults + user can add custom** — start with the predefined set but allow additions

[Answer]: C, but the defaults should be deletable from the household if user wants to

---

### Q6: Recipe Instructions Storage

How should recipe instructions be stored?

A) **Ordered text array** — each step is a plain text string, ordered by position
B) **Rich steps** — each step has text + optional duration (e.g., "bake for 30 min") + optional temperature
C) **Single text block** — one big markdown/text field for all instructions

[Answer]: A

---

### Q7: Unit Conversion Scope

The design says items with different units are kept as separate shopping list line items. Should the database schema account for future unit conversion, or keep it strictly simple?

A) **Simple** — no conversion tables or relationships; units are just an enum. If two entries use different units for the same ingredient, they stay separate.
B) **Conversion-ready** — include a unit_conversions table (or similar) for potential future use, even if not populated yet.

[Answer]: A

---
