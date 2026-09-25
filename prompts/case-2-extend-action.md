# Case 2 — Extend Helper Capability (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

---

## What the user paste looks like

```markdown
### Case 2 — Extend helper capability

Read: #file:doc/prompts/case-2-extend-helper.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**Extension**
- Type: locator | action
- Name: <descriptive name>
- Description: <one line>
- Playwright API: <API call>
```

AI extracts Location + Extension from user prompt.

---

## When to use

Feature exists. Helper can't dispatch something:

**Type = `locator`:** New locator syntax that helper doesn't recognize.
- Example: datepicker widget with custom `page.locator('.date-picker-input')` — helper doesn't match textbox or combobox
- Case 1 would fail with `"Cannot dispatch text value at index N — unknown locator type"`

**Type = `action`:** New `|<action>` marker beyond `|click`.
- Example: `|check` for checkboxes, `|toggle` for switches
- Case 1 would fail with `"Unknown action: |<action>"`

---

## Scope

- Modify `helper.ts` + `types.ts` + `AGENTS.md` (Section 9) only.
- `_flows/`, `_locators/`, `_scenarios/`, `spec.ts`, `data.ts` are READ-ONLY — DO NOT modify (`_locators/` and `_scenarios/` are only bootstrapped by Case 4)
- DO NOT add, remove, or rewrite comments in `_locators/`
- DO NOT run tests (`npx playwright test`, `pnpm test`, etc.)
- DO NOT execute terminal commands beyond file modification
- DO NOT launch browser, dev server, or Playwright inspector
- User will review and test manually after extension

---

## Rules

Execute in this order.

### Precondition verification

1. Verify feature folder exists at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If missing → **STOP** and report "Case 3 required".

2. Verify `<feature>.helper.ts` exists.

3. Read the Extension block from user prompt:
   - `Type` must be `locator` or `action`
   - `Name` — short descriptive identifier
   - `Description` — one line explaining the case
   - `Playwright API` — code to execute for this case

### Read files

4. Read `AGENTS.md` Section 9 (Value + Locator Vocabulary).

5. Read `<feature>.helper.ts` and identify:
   - `applyItem` function
   - Text dispatch section (locator syntax checks)
   - Action dispatch section (`switch` on action name)

### Extend helper

**If Type = action:**

6a. Verify the action name (from user's Name) is NOT already in helper's action switch. If already there → **STOP** and report.

7a. Add a new case to the action switch, ABOVE the `default` case:
    
    ```typescript
    case '<name>':
      // Transcribe user's Playwright API
      // Use `target` (already fetched via locatorFn(page))
      return;
    ```
    
    Example for `|check`:
    ```typescript
    case 'check':
      await target.check();
      return;
    ```

**If Type = locator:**

6b. Verify the locator pattern (from user's Description) is NOT already handled. Look at the text dispatch section's `if/else if` chain. If already there → **STOP** and report.

7b. Add a new `else if` branch to text dispatch, BEFORE the final `else` (error case):
    
    ```typescript
    } else if (locatorCode.includes("<pattern>")) {
      // Transcribe user's Playwright API using `target` and `item`
    }
    ```
    
    Example for datepicker:
    ```typescript
    } else if (locatorCode.includes("date-picker-input")) {
      await target.click();
      await page.getByRole('gridcell', { name: item }).click();
    }
    ```

### Update AGENTS.md

8. Add row to `AGENTS.md` Section 9 table:
   - For action: "Value item types" table + "How helper dispatches actions" table
   - For locator: "How helper dispatches text items" table

   If AGENTS.md not writable → skip and note in output.

9. Do NOT touch: `spec.ts`, `data.ts`, `types.ts`, `_locators/*`, `_flows/*`, other features.

---

## Output

- Modified `<feature>.helper.ts`
- Modified `AGENTS.md` Section 9 (if writable)
- Report:
  - "Extension added: <Type> '<Name>'"
  - "Next: use Case 1 to regenerate data.ts with new capability"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Feature folder missing | `"Case 3 required — feature does not exist"` |
| Extension type invalid | `"Type must be 'locator' or 'action'"` |
| Action already handled | `"Action '\|<name>' already in helper switch"` |
| Locator pattern already handled | `"Pattern '<pattern>' already in helper text dispatch"` |
| Playwright API unclear | `"Cannot infer implementation — clarify Playwright API"` |

---

## Example — Add `|check` action

**User prompt:**
```markdown
### Case 2 — Extend helper capability

Read: #file:doc/prompts/case-2-extend-helper.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search

**Extension**
- Type: action
- Name: check
- Description: Check a checkbox
- Playwright API: target.check()
```

**AI adds to helper:**
```typescript
if (item.startsWith('|')) {
  const action = item.slice(1);
  switch (action) {
    case 'click':
      await target.click();
      return;
    case 'check':                    // ← NEW
      await target.check();
      return;
    default:
      throw new Error(`Unknown action: |${action}`);
  }
}
```

**Now CSV can use:** `"|check"` for checkbox locators.

---

## Example — Add datepicker locator type

**User prompt:**
```markdown
### Case 2 — Extend helper capability

Read: #file:doc/prompts/case-2-extend-helper.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search

**Extension**
- Type: locator
- Name: datepicker
- Description: Click datepicker input, click day gridcell
- Playwright API: target.click() then page.getByRole('gridcell', { name: item }).click()
```

**AI adds to helper text dispatch:**
```typescript
if (locatorCode.includes("getByRole('textbox'")) {
  await target.fill(item);
} else if (locatorCode.includes("getByRole('combobox'") || 
           locatorCode.includes('ng-select')) {
  await target.click();
  await page.getByRole('option', { name: item }).click();
} else if (locatorCode.includes("date-picker-input")) {    // ← NEW
  await target.click();
  await page.getByRole('gridcell', { name: item }).click();
} else {
  throw new Error(/* ... */);
}
```

**Now `_locators/` can include:**
```typescript
(page) => page.locator('.date-picker-input').first(),
```

And CSV Value like `"15"` at that position → helper clicks datepicker + clicks day 15.

---

## Why Case 2 doesn't add test cases

Case 2 extends helper capability. Adding TCs comes via Case 1 (which now can parse the new `|<action>` or leverage the new locator type).

Split ensures:
- Helper extension reviewed independently
- Test case additions batched with QA's CSV updates
- No mixing of framework change + data change