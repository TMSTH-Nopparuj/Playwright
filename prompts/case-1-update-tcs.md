# Case 1 — Update Test Cases (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

---

## What the user paste looks like

```markdown
### Case 1 — Update test cases

Read: #file:doc/prompts/case-1-update-tcs.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>
```

AI extracts `<project>`, `<access-flow>`, `<module>`, `<feature>` from Location and uses them throughout.

---

## When to use

Feature exists. One or both changed:
- `_locators/<feature>.ts` — dev added/updated/removed snippets
- `_scenarios/<feature>.csv` — QA appended/updated rows

All CSV Actions must already have cases in helper's switch. If not → Case 2 first.

---

## Rules

Execute in this order.

### Precondition verification

1. Verify feature folder exists at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If missing → **STOP** and report "Case 3 required".

2. Verify precondition files exist:
   - `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts`
   - `Test-Local/<project>/<access-flow>/<module>/_scenarios/<feature>.csv`
   
   If any missing → **STOP**.

3. Read `_locators/<feature>.ts` and count snippets (each starts with `// TC<ID>`).

4. Read `_scenarios/<feature>.csv` and count data rows (excluding header).

5. Verify snippet count == CSV data row count. If mismatch → **STOP** and report:
   - "Count mismatch: N snippets, M rows"
   - List TC-IDs on each side

### Action validation

6. Read `<feature>.types.ts` — get valid Action union values.

7. For each CSV row, verify `Action` column value is in the union. If any missing → **STOP**:
   - "Case 2 required — action '<value>' not in types union"
   - List TC-IDs using unknown actions

### Regeneration

8. Read `<feature>.helper.ts`:
   - Locate the `locators` array (const declaration)
   - Preserve everything else (imports, switch cases, exports)

9. Replace the `locators` array with new entries from `_locators/<feature>.ts`:
   ```typescript
   const locators: Array<(page: Page) => Promise<void>> = [
     // TC001 - <name>
     async (page) => {
       <snippet from _locators/ verbatim>
     },
     // TC002 - <name>
     async (page) => {
       <snippet from _locators/ verbatim>
     },
     // ...
   ];
   ```
   - Preserve TC-ID comments
   - Wrap snippet as `async (page) => { <snippet> }` — no rewrites
   - Order = file order in `_locators/`

10. Regenerate `<feature>.data.ts`:
    ```typescript
    import type { <Feature>TestCase } from './<feature>.types';
    
    export const <feature>TestCases: <Feature>TestCase[] = [
      {
        testCaseId: '<from CSV>',
        scenario: '<from CSV>',
        action: '<from CSV Action column>',
        locatorIndex: 0,
      },
      // ... one per CSV row
    ];
    ```
    - `locatorIndex` = 0-based CSV row position
    - Order = CSV row order

11. Do NOT touch: `spec.ts`, `types.ts`, `_locators/*`, `_flows/*`, CSV, other features.

---

## Output

- Modified `<feature>.helper.ts` (locators array section only)
- Modified `<feature>.data.ts` (full replacement)
- Report:
  - "<N> TCs regenerated"
  - "Actions used: <list>"
  - "Snippet ↔ CSV order verified: yes"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Feature folder missing | `"Case 3 required — feature does not exist"` |
| Precondition file missing | `"Precondition missing — <file>"` |
| Snippet count ≠ CSV rows | `"Count mismatch: N snippets, M rows"` + TC-ID lists |
| CSV Action not in types union | `"Case 2 required — action '<value>' not handled"` |
| `_locators/` missing TC-ID | `"Cannot verify order — add // TC<ID> markers"` |

---

## Why this doesn't touch spec.ts or types.ts

Case 1 = Phase 2 alone (test data only). Pattern doesn't change.

- `spec.ts` = flow structure (unchanged when data changes)
- `types.ts` = action union (unchanged unless new action → Case 2)

If flow itself changed → regenerate via Case 3.