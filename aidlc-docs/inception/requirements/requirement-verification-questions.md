# Requirements Clarification Questions — BigBatch

Please answer each question by filling in the letter choice after the `[Answer]:` tag. If none of the options match, choose **X) Other** and describe your preference.

---

## Question 1: Platform
What platform(s) should BigBatch target? (Cook-mode UX matters here.)

A) Web app only (responsive, works on phone browser in the kitchen)
B) Native mobile app only (iOS, Android, or both)
C) Web app + installable PWA (offline-capable, add-to-home-screen on mobile)
D) Web app + separate native mobile app
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 2: Users & Sync
Who uses the app and across how many devices?

A) Single user, single device (local storage only — simplest)
B) Single user, multiple devices with sync (e.g., laptop + phone)
C) Multiple users (e.g., household members), shared data
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 3: Hosting / Deployment
Where should the app run?

A) Fully local — no server, data stored in browser/device
B) Self-hosted on your own machine/home server
C) Cloud-hosted (e.g., a small VPS, Vercel, Fly.io, etc.)
D) Don't care — pick what's simplest given other answers
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 4: Ingredient Nutrition Data Source
How should ingredient nutrition data be populated?

A) Manual entry only — you type in calories/macros per ingredient once, reuse forever
B) Manual entry + optional lookup from a public database (e.g., OpenFoodFacts) to pre-fill
C) Primarily database-driven (search & import) with manual override
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 5: Units of Measurement
Which units should the app support?

A) Metric only (g, kg, ml, l, items) — NZ-appropriate
B) Metric + imperial (oz, lb, cups, tbsp, tsp) with conversion
C) Metric primary, with a small set of common kitchen units (tbsp, tsp, cup) regardless of system
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 6: Macros Tracked
Which nutritional values should each ingredient/portion show?

A) Calories + protein + carbs + fat
B) Calories + protein + carbs + fat + fibre
C) Calories + protein + carbs + fat + fibre + sugar + saturated fat
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 7: Recipe Scaling Behaviour
When scaling a recipe (e.g., 8 portions → 12), how should ingredient quantities behave?

A) Pure linear scaling — multiply every ingredient by the ratio
B) Linear scaling with sensible rounding (e.g., round to 5g, 0.25 tsp)
C) Linear scaling, but allow per-ingredient override after scaling
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 8: Shopping List — "What I Already Have"
Should the shopping list account for ingredients you already have in the pantry?

A) No — always assume you're buying everything in the recipe
B) Yes — maintain a simple pantry/staples list that's subtracted from shopping lists
C) Yes — let me tick "I have this" per ingredient when generating the list, no persistent pantry
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 9: Shopping List — Categorisation
Should shopping list items be grouped?

A) Flat list — single consolidated list, no grouping
B) Grouped by category (produce, dairy, pantry, meat, etc.) — auto-assigned per ingredient
C) Grouped by aisle/section, user-configurable per ingredient
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 10: Cook Mode Features
Beyond a clean instruction view, what should cook mode include?

A) Just clean, large-text instructions — nothing else
B) Instructions + checkable step list (tick off as you go)
C) Instructions + checkable steps + screen-wake-lock (stays on while cooking)
D) All of the above + per-step timers
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 11: Cooking History / "Re-cook"
Should the app remember past cooks?

A) No history — recipes are templates only
B) Track when each recipe was last cooked (just a timestamp)
C) Track each cook as an event (date, batch size, optional notes)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 12: Data Import / Export
Do you need import/export?

A) No — data lives in the app
B) Export only (JSON or similar backup)
C) Import + export (so you can move/backup between devices)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 13: Tech Stack Preference
Any preference for the technology stack?

A) No preference — recommend what's best given the platform and hosting answers
B) TypeScript + React (web) / React Native (mobile)
C) TypeScript + SvelteKit
D) Python backend (e.g., FastAPI) + any frontend
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 14: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

---

## Question 15: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: 
