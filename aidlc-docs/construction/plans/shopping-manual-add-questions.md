# Unit 4: Shopping — Manual Ingredient Add Questions

These questions clarify the scope and behaviour of manually adding individual ingredients to the shopping list, before the functional design artifacts are updated.

---

### Q1: Entry Points

Which surfaces should allow adding an ingredient manually to the shopping list?

A) Shopping List page only — an "Add Ingredient" button opens a search/pick modal
B) Shopping List page + Ingredient Library page (an "Add to List" button per ingredient row)
C) Shopping List page + Ingredient Detail page (an "Add to List" button on the detail view)
D) All three surfaces: Shopping List page, Ingredient Library, and Ingredient Detail page
E) Other (specify)

[Answer]: D

### Q2: Quantity and Unit Input

When manually adding an ingredient, what does the user specify?

A) Quantity only — the unit is always the ingredient's `defaultUnit` (no choice offered)
B) Quantity + unit — the user can pick any unit from the `Unit` enum regardless of `defaultUnit`
C) Quantity + unit, but only the ingredient's `defaultUnit` is offered as a pre-filled default; the user can override it
D) Other (specify)

[Answer]: C

### Q3: Consolidation Behaviour on Manual Add

If the ingredient+unit pair already exists on the list, what happens?

A) The entered quantity is summed into the existing item (same UPSERT behaviour as recipe add)
B) A second separate row is created (allow duplicates)
C) The user is warned that the item is already on the list, with the option to add-on or cancel
D) Other (specify)

[Answer]: A

### Q4: Quantity Constraints

What are the valid quantity inputs for a manual add?

A) Any positive number (decimals allowed, e.g. 0.5 kg)
B) Positive integers only (whole numbers)
C) Any positive number ≥ a minimum of 0.01
D) Other (specify)

[Answer]: A

### Q5: Remove / Decrease from List

Once an ingredient is manually on the list, can the user remove it or decrease its quantity individually (without clearing the whole list)?

A) Yes — add a remove (trash) button to each `ShoppingItemRow` that deletes just that item
B) Yes — allow both remove and quantity edit directly on the row (inline edit)
C) No — individual removal is out of scope for this unit; only full-list clear exists
D) Other (specify)

[Answer]: B
