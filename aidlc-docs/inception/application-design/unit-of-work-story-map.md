# BigBatch — Unit of Work Story Map

## Story-to-Unit Mapping

| Story | Title                                | Priority | Unit                     |
| ----- | ------------------------------------ | -------- | ------------------------ |
| US-01 | Register an Account                  | P0       | Unit 1: Auth & Household |
| US-02 | Sign In                              | P0       | Unit 1: Auth & Household |
| US-03 | Create a Household                   | P0       | Unit 1: Auth & Household |
| US-04 | Join Household via Invite Link       | P0       | Unit 1: Auth & Household |
| US-05 | Join Household via Invite Code       | P0       | Unit 1: Auth & Household |
| US-06 | Generate Household Invite            | P0       | Unit 1: Auth & Household |
| US-07 | Create an Ingredient Manually        | P0       | Unit 2: Ingredients      |
| US-08 | Search and Import from OpenFoodFacts | P1       | Unit 2: Ingredients      |
| US-09 | Edit an Ingredient                   | P0       | Unit 2: Ingredients      |
| US-10 | Assign Shopping Category             | P1       | Unit 2: Ingredients      |
| US-11 | Create a Recipe                      | P0       | Unit 3: Recipes          |
| US-12 | Edit a Recipe                        | P0       | Unit 3: Recipes          |
| US-13 | Duplicate a Recipe                   | P1       | Unit 3: Recipes          |
| US-14 | Delete a Recipe                      | P1       | Unit 3: Recipes          |
| US-15 | Scale a Recipe                       | P0       | Unit 3: Recipes          |
| US-16 | View Recipe with Nutrition           | P0       | Unit 3: Recipes          |
| US-17 | Add Recipe to Shopping List          | P0       | Unit 4: Shopping         |
| US-18 | Consolidate Shopping List            | P0       | Unit 4: Shopping         |
| US-19 | Mark "I Have This"                   | P1       | Unit 4: Shopping         |
| US-20 | Group Shopping List by Category      | P1       | Unit 4: Shopping         |
| US-21 | Tick Off Shopping List Items         | P0       | Unit 4: Shopping         |
| US-22 | Clear Shopping List                  | P0       | Unit 4: Shopping         |
| US-23 | Enter Cook Mode                      | P0       | Unit 3: Recipes          |
| US-24 | Follow Steps in Cook Mode            | P0       | Unit 3: Recipes          |
| US-25 | Log a Cook Event                     | P1       | Unit 5: Cook Events      |
| US-26 | View Cook History                    | P1       | Unit 5: Cook Events      |
| US-27 | View Household Members               | P1       | Unit 1: Auth & Household |
| US-28 | Remove a Household Member            | P2       | Unit 1: Auth & Household |

## Coverage Summary

| Unit                     | Stories            | P0     | P1    | P2    | Total  |
| ------------------------ | ------------------ | ------ | ----- | ----- | ------ |
| Unit 0: Foundation       | —                  | —      | —     | —     | 0      |
| Unit 1: Auth & Household | US-01–06, US-27–28 | 6      | 1     | 1     | 8      |
| Unit 2: Ingredients      | US-07–10           | 2      | 2     | 0     | 4      |
| Unit 3: Recipes          | US-11–16, US-23–24 | 6      | 2     | 0     | 8      |
| Unit 4: Shopping         | US-17–22           | 4      | 2     | 0     | 6      |
| Unit 5: Cook Events      | US-25–26           | 0      | 2     | 0     | 2      |
| **Totals**               | **28**             | **18** | **9** | **1** | **28** |

**All 28 stories are assigned. No stories are unassigned.**

## PBT Property Distribution

| Unit   | PBT Properties                                             |
| ------ | ---------------------------------------------------------- |
| Unit 2 | Invariant: ingredient edit → recipe nutrition recalculated |
| Unit 3 | Invariant: perPortion = total / batchSize                  |
| Unit 3 | Round-trip: duplicate preserves ingredients/instructions   |
| Unit 3 | Invariant: scaling preserves ingredient count              |
| Unit 3 | Invariant: per-portion nutrition stable across scaling     |
| Unit 3 | Idempotency: scale(scale(r,N),N) = scale(r,N)              |
| Unit 4 | Idempotency: consolidate(consolidate(x)) = consolidate(x)  |
| Unit 4 | Invariant: total quantity preserved after consolidation    |

## Requirement Coverage

All functional requirements (FR-01 through FR-08) are covered:

| Requirement | Unit(s)        |
| ----------- | -------------- |
| FR-01       | Unit 3         |
| FR-02       | Unit 2         |
| FR-03       | Unit 3         |
| FR-04       | Unit 4         |
| FR-05       | Unit 3         |
| FR-06       | Unit 5         |
| FR-07       | Unit 1         |
| FR-08       | Unit 2, Unit 3 |
