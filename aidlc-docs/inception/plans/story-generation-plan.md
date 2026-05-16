# Story Generation Plan — BigBatch

## Approach Questions

Please answer each question by filling in the letter choice after the `[Answer]:` tag.

---

## Question 1: Story Breakdown Approach

How should user stories be organised?

A) **User Journey-Based** — stories follow real cooking workflows end-to-end (e.g., "Plan a cook → shop → cook → log")
B) **Feature-Based** — stories grouped around system features (recipes, ingredients, shopping list, cook mode, etc.)
C) **Persona-Based** — stories grouped by persona (primary cook stories, household member stories)
D) **Hybrid: Feature-based with journey context** — group by feature area, but include end-to-end journey stories as epics that cross-cut features
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2: Story Granularity

How fine-grained should individual stories be?

A) **Coarse** — one story per major feature (e.g., "Recipe Management" as a single story with many acceptance criteria)
B) **Medium** — one story per user action (e.g., "Create Recipe", "Scale Recipe", "Duplicate Recipe" as separate stories)
C) **Fine** — one story per atomic interaction (e.g., "Add ingredient to recipe", "Set ingredient quantity", "Choose ingredient unit" as separate stories)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3: Acceptance Criteria Format

How should acceptance criteria be written?

A) **Given/When/Then** (BDD-style) — structured scenarios
B) **Checklist** — simple bullet points of conditions that must be true
C) **Mixed** — Given/When/Then for complex flows, checklist for simple validations
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4: Persona Depth

How detailed should persona descriptions be?

A) **Minimal** — name, role, one-line motivation (e.g., "Sam — primary cook — wants to batch-cook efficiently")
B) **Standard** — name, role, goals, frustrations, tech comfort, typical usage patterns
C) **Detailed** — full persona cards with demographics, scenarios, quotes, device preferences, cooking habits
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 5: Priority Labels

Should stories include priority labels?

A) **No priority** — all stories treated equally; prioritisation happens later
B) **MoSCoW** — Must / Should / Could / Won't labels on each story
C) **Numbered tiers** — P0 (launch-critical), P1 (important), P2 (nice-to-have)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6: Household Invite Mechanism

FR-07.4 says "mechanism for users to join a household (e.g., invite link or code)." Which approach?

A) **Invite link** — existing member generates a unique URL; new user clicks it to join
B) **Invite code** — existing member generates a short code; new user enters it during signup/login
C) **Both** — link for convenience, code as fallback (e.g., sharing verbally)
D) **Email invite** — existing member enters new user's email; they receive a join link
X) Other (please describe after [Answer]: tag below)

[Answer]: X - you should be able to sign up without joining someones household. You should be given a choice to either create your own household or join an existing one. Implement C (A and B) for joining households.

## Question 7: Household Roles

Should household members have different permission levels?

A) **Equal** — all household members can do everything (create, edit, delete recipes, ingredients, lists)
B) **Owner + Members** — one owner can manage household membership; all else equal
C) **Admin + Members** — admins manage membership and can delete others' recipes; members manage their own
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 8: Shopping List Lifecycle

How long does a shopping list live?

A) **Ephemeral** — user generates a list, shops, done. No persistent list; generate a new one each time
B) **Persistent until cleared** — list stays until user explicitly clears/deletes it; can add recipes to it over time
C) **Named lists** — user creates named lists (e.g., "Weekend cook", "Thursday batch") that persist independently
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Execution Plan

Once answers are received, stories will be generated following this plan:

- [x] **Step 1**: Define personas based on Q4 depth and household model (Q7)
- [x] **Step 2**: Create epic-level story map based on breakdown approach (Q1)
- [x] **Step 3**: Write individual stories at chosen granularity (Q2) with acceptance criteria (Q3)
- [x] **Step 4**: Apply priority labels if chosen (Q5)
- [x] **Step 5**: Cross-reference stories to requirements (FR-01 through FR-08) for traceability
- [x] **Step 6**: Validate INVEST criteria across all stories
- [x] **Step 7**: Identify PBT-relevant properties per story (feeding PBT-01)
- [x] **Step 8**: Save `personas.md` and `stories.md` to `aidlc-docs/inception/user-stories/`
