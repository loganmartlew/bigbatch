# Unit 5: Cook Events — Frontend Components

## Routes

- `/cooks` — household cooks dashboard (active queue + history)
- `/cooks/$queuedCookId/cook` — queue-backed cook mode for one ready queued cook
- `/recipes/$recipeId` — recipe detail integration surface (prepare-to-cook controls + inline history)

---

## Component Hierarchy

```text
RecipeDetailPage
├── RecipeHeaderActions
│   └── PrepareToCookCard
│       ├── BatchSizeInput
│       ├── QueueRecipeButton
│       └── ExistingQueuedCookLinks[]
└── RecipeCookHistorySection
    ├── HistoryList
    └── ViewAllInCooksDashboardLink

CooksDashboardPage
├── CooksDashboardHeader
│   └── Title: "Cooks"
├── ActiveQueueSection
│   └── QueuedCookCard[]
│       ├── RecipeName + BatchSize
│       ├── DerivedStateBadge
│       ├── IngredientsProgressSummary
│       ├── EditBatchSizeControl (gathering only)
│       ├── StartCookingButton (ready only)
│       └── CancelQueuedCookButton
└── CookHistorySection
    └── CookEventRow[]
        ├── DateDisplay
        ├── RecipeLink
        ├── UserDisplayName
        ├── BatchSizeDisplay
        ├── NotesDisplay
        └── EditCookEventAction

QueuedCookCookModePage
├── CookModeHeader
│   ├── RecipeName
│   ├── BatchSizeBadge
│   └── ExitButton
├── IngredientsChecklistCard
│   └── QueuedIngredientRow[]
├── InstructionChecklistCard
│   └── StepCheckboxRow[]
└── FinishCookBar
    └── FinishButton
```

---

## Component Details

### `PrepareToCookCard`

**Location**: Recipe detail page  
**Purpose**: Convert recipe detail from a direct-cook entry point into a queued-cook creation surface.

**State**:

- `targetBatchSize: number`
- `isSubmitting: boolean`
- existing queued cook summaries for this recipe (optional helper list)

**Behavior**:

- user chooses batch size
- user creates a queued cook
- success creates queue entry and adds ingredients to shopping list in the background
- recipe detail can optionally show links to already-queued instances for the same recipe

---

### `RecipeCookHistorySection`

**Location**: Recipe detail page  
**Purpose**: Inline recipe-specific history section even though the Cooks dashboard is the primary history surface.

**Behavior**:

- shows newest-first cook events for the current recipe
- supports editing date and notes inline or via small modal/drawer
- includes a link to the broader Cooks dashboard for queue + history context

---

### `CooksDashboardPage`

**Purpose**: Primary queue-and-history hub for the household.

**Sections**:

- Active queue
- Historical cook events

**Empty states**:

- no active queue entries
- no history yet
- queue exists but nothing is ready yet

---

### `QueuedCookCard`

**Purpose**: One active planned cook instance.

**Props / data**:

- recipe name and link
- selected batch size
- derived state
- `requiredIngredientsCount`
- `satisfiedIngredientsCount`
- queued cook id

**Actions**:

- edit batch size while `gatheringIngredients`
- start cooking while `readyToCook`
- cancel queued cook

**Cancel flow**:

- destructive confirmation
- asks whether to remove associated shopping items
- if shared rows are retained, shows a post-action notice

---

### `QueuedCookCookModePage`

**Purpose**: Queue-backed cook mode replacing the current slideshow-style recipe cook surface.

**Behavior**:

- ingredients shown at top by default
- instructions shown as one checklist list with checkboxes
- no previous/next slideshow navigation
- wake-lock requested on entry and released on exit
- finish button pinned at the bottom of the page flow
- exiting without finishing abandons local checkbox progress only

---

### `EditCookEventAction`

**Purpose**: Edit date and notes after event creation.

**Allowed users**:

- any household member

**Fields**:

- editable `date`
- editable optional `notes`

No finish-time modal is required in this unit because event metadata is edited later.

---

## State Management

All server state should continue to use TanStack Query.

| Hook                           | Endpoint                         | Purpose                               |
| ------------------------------ | -------------------------------- | ------------------------------------- |
| `useCooksDashboard`            | `GET /cooks`                     | Queue + history view                  |
| `useCreateQueuedCook`          | `POST /recipes/:id/queued-cooks` | Create queue entry from recipe detail |
| `useUpdateQueuedCookBatchSize` | `PATCH /cooks/:id/batch-size`    | Edit queue batch size while gathering |
| `useCancelQueuedCook`          | `DELETE /cooks/:id`              | Cancel a queued cook                  |
| `useQueuedCookCookMode`        | `GET /cooks/:id/cook-mode`       | Ready-to-cook payload                 |
| `useFinishQueuedCook`          | `POST /cooks/:id/finish`         | Complete queued cook                  |
| `useRecipeCookHistory`         | `GET /recipes/:id/cook-events`   | Inline recipe history                 |
| `useUpdateCookEvent`           | `PATCH /cook-events/:id`         | Edit event date and notes             |

---

## User Interaction Flows

### Flow 1: Queue A Recipe To Cook

```text
User opens recipe detail
  -> adjusts batch size in PrepareToCookCard
  -> clicks Queue Recipe
  -> queued cook is created
  -> required ingredients are added to shopping list
  -> user sees queue entry in gatheringIngredients state
```

### Flow 2: Become Ready To Cook

```text
User shops against consolidated household list
  -> required linked rows become tickedOff or haveThis
  -> queued cook derived state changes to readyToCook
  -> Start Cooking action becomes enabled on dashboard / recipe detail link
```

### Flow 3: Cook And Finish

```text
User opens /cooks/:queuedCookId/cook
  -> sees ingredients at top and all steps in one checklist
  -> marks local steps complete while cooking
  -> clicks Finish at bottom
  -> queued cook is removed
  -> cook event is created with default date and no notes
  -> dedicated shopping rows are removed; shared rows are retained
  -> user can edit event metadata later from dashboard/history
```

### Flow 4: Cancel A Queued Cook

```text
User clicks Cancel on queued cook card
  -> confirmation asks whether to remove associated shopping items
  -> if yes: dedicated shopping rows removed, shared rows retained
  -> queued cook leaves the active queue
```
