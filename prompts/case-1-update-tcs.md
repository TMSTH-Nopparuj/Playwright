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

AI extracts `<project>`, `<access-flow>`, `<module>`, `<feature>` from Location.

---

## When to use

Feature exists. QA updated `_scenarios/<feature>.csv` (added rows, changed Value, etc.).

Test data (`data.ts`) needs regenerating from CSV.

**When NOT to use:**
- New feature (folder doesn't exist) → Case 3
- New locator type or `|action` that helper doesn't handle → Case 2 first
- `_locators/` array structure changed → verify helper still handles all types, then Case 1

---

## Scope

- Modify `data.ts` only (unless step 8 warrants no change).
- `_flows/`, `_locators/`, `_scenarios/`, `spec.ts`, `helper.ts`, `types.ts` are READ-ONLY — DO NOT modify (`_locators/` and `_scenarios/` are only bootstrapped by Case 4)
- DO NOT add, remove, or rewrite comments in `_locators/`
- DO NOT run tests (`npx playwright test`, `pnpm test`, etc.)
- DO NOT execute terminal commands beyond file modification
- DO NOT launch browser, dev server, or Playwright inspector
- User will review and test manually after regeneration

---

## Rules

Execute in this order.

### Precondition verification

1. Verify feature folder exists at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If missing → **STOP** and report "Case 3 required".

2. Verify precondition files exist:
   - `Test-Local/<project>/<access-flow>/<module>/_scenarios/<feature>.csv`
   - `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts`
   - `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.data.ts`
   - `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.helper.ts`
   
   If any missing → **STOP**.

### Read source files

3. Read `AGENTS.md` Section 8 (4-File Pattern) and Section 9 (Value + Locator Vocabulary).

4. Read `_scenarios/<feature>.csv`:
   - Skip header row
   - For each data row, extract `TC-ID`, `Scenario`, and `Value`
   - Parse `Value` by splitting on `,` (CSV-standard — commas inside `""` preserved) → items array

5. Read `_locators/<feature>.ts` — get array length N.

### Sanity checks

6. For each row's Value:
   - If length > N (more items than locators) → **WARN** in report (extra items discarded at runtime)
   - If length < N → OK (unused locators skipped, backward-compatible)

7. Scan Value items for `|<action>` markers:
   - Read `<feature>.helper.ts` to find action cases in the switch
   - If any Value has `|<action>` where `<action>` is not in helper switch → **STOP** and report "Case 2 required — action '|<action>' not handled"

### Regenerate data.ts

8. Regenerate `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.data.ts`:
   
   ```typescript
   import type { <Feature>TestCase } from './<feature>.types';
   
   export const <feature>TestCases: <Feature>TestCase[] = [
     {
       testCaseId: 'TC001',
       scenario: 'Search by Receipt Number',
       values: [
         'HQ0000020', '', '', '', '', '',
         '', '', '', '', '', '',
       ],
     },
     // ... one entry per CSV data row
   ];
   ```
   
   **Critical rules — MUST follow:**
   
   - Write `values` as **literal string array** with every item visible
   - Do NOT create helper functions like `parseValues()` — they hide comma-counting errors
   - Every row's `values.length` MUST equal N (locator count from step 5)
   - Empty items MUST be written as `''` (empty string), not omitted
   - Preserve `|<action>` items exactly (helper strips `|` at runtime)
   - Recommended layout: 6 items per line for readability with 12 locators

9. **Verify data.ts before finishing (in-conversation only — NO tools):**
   
   - Read the values array of each row you just wrote
   - Count items by inspection (mentally / by looking at the code)
   - **DO NOT run terminal, PowerShell, bash, regex tools, scripts, or any tool for this check**
   - **DO NOT read the file back with a tool — trust what you just wrote**
   - Report each row inline: "TC001: 12 items ✓"
   - Assert `values.length === N` (locator count from step 5) for every row
   - If ANY row fails → **STOP** and report:
     ```
     Row TC<ID> has values.length = <M>, expected <N>.
     Fix: ensure each row has exactly <N> items (empty as '').
     ```

10. Do NOT touch: `spec.ts`, `types.ts`, `helper.ts`, `_locators/*`, `_flows/*`, CSV, other features.

---

## Output

- Modified `<feature>.data.ts` (full replacement)
- Report:
  - "<X> TCs regenerated"
  - "Locator count: <N>"
  - "Max Value item count per row: <Y>"
  - Warnings (if any Value rows exceed locator count)

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Feature folder missing | `"Case 3 required — feature does not exist"` |
| Precondition file missing | `"Precondition missing — <file>"` |
| CSV Value has unknown `\|action` | `"Case 2 required — action '\|<action>' not handled in helper"` |
| `data.ts` row's values.length ≠ locator count | `"Row TC<ID> has values.length = <M>, expected <N>. Fix each row to have exactly <N> items."` |

---

## Why this doesn't touch spec.ts, types.ts, helper.ts

**types.ts** — TestCase interface is minimal (`testCaseId`, `scenario`, `values`). Changes when interface itself changes, not when data changes.

**helper.ts** — Universal dispatcher. Imports `<feature>Locators` from `_locators/` dynamically. Only changes if new locator type or action needed (Case 2).

**spec.ts** — Flow structure. Only changes when `_flows/` itself changes (regenerate via Case 3, or edit manually).

**Case 1 is data-only** — just refresh test cases from CSV.

---

## Why _locators/ changes don't require regeneration

Helper uses runtime imports:
```typescript
import { <feature>Locators } from '../_locators/<feature>';
```

If dev adds/removes/reorders locators in `_locators/<feature>.ts`, helper picks up changes automatically. Just make sure CSV Value items still match the new order.

**When _locators/ changes:**
- Same locator types (all textbox/combobox) → No Case run needed, just update CSV
- New locator type (e.g., first datepicker widget) → Case 2 to add detection branch, then Case 1 to refresh data