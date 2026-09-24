# Case 4 — Bootstrap Locators (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

**Purpose:** Convert `_locators/<feature>.ts` from raw Playwright codegen to framework array format.

**Does one thing only:** Reads → detects format → rewrites if needed.
No CSV, no scenarios. Standalone.

---

## What the user paste looks like

```markdown
### Case 4 — Bootstrap locators

Read: #file:doc/prompts/case-4-locators.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>
```

AI extracts Location from user prompt. AI reads codegen from disk (see Preconditions).

---

## Preconditions

**`_locators/<feature>.ts` MUST exist before Case 4 runs.**

It can be in either format:

### Format A — Raw codegen (from Playwright codegen)

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('...');
  await page.getByRole('button', { name: 'ใบแจ้งงาน' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: ' Export Excel' }).click();
  const download = await downloadPromise;
  await page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first().click();
});
```

Case 4 will parse this, extract locator lines, and rewrite as Format B.

### Format B — Array format (framework standard)

```typescript
import type { Locator, Page } from '@playwright/test';

export const printLocators: Array<(page: Page) => Locator> = [
  (page) => page.getByRole('button', { name: 'ใบแจ้งงาน' }).first(),
  (page) => page.getByRole('button', { name: ' Export Excel' }),
  (page) => page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first(),
];
```

Case 4 will detect this format and skip conversion (no-op).

---

## Scope

- **DO NOT open interactive input dialogs asking the user to paste content.** All required content is on disk. READ files directly.
- Read/overwrite 1 file: `_locators/<feature>.ts`
- `_flows/`, `_scenarios/`, feature folder, spec/helper/types/data are READ-ONLY — DO NOT modify
- DO NOT run tests, terminal commands, or scripts.
- DO NOT generate `_scenarios/` CSV (that's Case 5's job).

---

## Rules

Execute in this order.

### Precondition verification

1. **READ** the file `_locators/<feature>.ts` at:
   `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts`
   
   **CRITICAL DIRECTIVES:**
   - You MUST read the file DIRECTLY using file tools.
   - DO NOT ask the user to paste the file content.
   - DO NOT ask the user to provide the Playwright Codegen block.
   - DO NOT open an interactive input dialog requesting information.
   - The file exists on disk — READ IT.
   
   If the file truly cannot be read (missing on disk, permission denied) → **STOP** and report:
   ```
   Cannot read _locators/<feature>.ts. File missing or inaccessible. Codegen the feature and save to that path first.
   ```

### Detect file format

2. Parse the content read in step 1. **You already have the content — do NOT ask user for it.**

3. Detect format:
   - If content has `export const <feature>Locators` → **Format B (already array)** → go to step 8
   - If content has `test(` function or `page.goto(` → **Format A (raw codegen)** → go to step 4
   - Otherwise → **STOP** and report:
     ```
     Cannot detect _locators/<feature>.ts format.
     Expected: raw Playwright codegen OR array of locator functions.
     ```

### Parse raw codegen (Format A only)

4. Extract lines from inside the `test(` function body.

5. For each line, classify:
   - **KEEP** if line ends with `.click()`, `.fill(...)`, `.check(...)`, `.uncheck(...)`, `.selectOption(...)`, `.press(...)` — line contains a Playwright locator followed by an action
   - **SKIP** if line contains any of:
     - `page.goto(`
     - `page.waitForEvent(`
     - `page.waitForLoadState(`
     - `page.waitForTimeout(`
     - `page.waitForURL(`
     - `page.waitForResponse(`
     - `const ` (variable declaration like `const downloadPromise = ...`)
     - `await downloadPromise`, `await responsePromise` (dangling promise awaits)
     - `import ` or `test(` or `});` (framework boilerplate)
   - **AMBIGUOUS** if none of the above → **STOP** and report:
     ```
     Cannot classify line: <line>
     Fix _locators/<feature>.ts and rerun.
     ```

6. For each KEEP line, strip the trailing action to isolate the locator:
   - `await X.click()` → `X`
   - `await X.fill('value')` → `X`
   - `await X.check()` → `X`
   - `await X.selectOption('opt')` → `X`
   
   Result: locator expression as a string (e.g., `page.getByRole('button', { name: ' Export Excel' }).first()`)

### Rewrite locators file

7. Overwrite `_locators/<feature>.ts` with array format:
   
   ```typescript
   import type { Locator, Page } from '@playwright/test';
   
   export const <feature>Locators: Array<(page: Page) => Locator> = [
     (page) => <locator expression 1>,
     (page) => <locator expression 2>,
     (page) => <locator expression 3>,
     // ... one per KEEP line, in original order
   ];
   ```
   
   - `<feature>` = camelCase of feature name
   - NO comments
   - Preserve locator expressions character-for-character (do NOT rewrite)

### Format B detected (no-op)

8. If Format B was detected in step 3, do nothing (file already correct).
   Report "Already array format, no changes made" and count N.

### Verify output

9. **Verify (in-conversation only — NO tools):**
   - Count entries in the array you just wrote (or existing array if Format B)
   - **DO NOT run terminal, PowerShell, bash, regex tools, scripts, or any tool for this check**
   - **DO NOT read the file back with a tool — trust what you just wrote**
   - Report: "Locators: N entries ✓"

---

## Output

- Updated `_locators/<feature>.ts` (rewritten as array if was raw, unchanged if was array)
- Report:
  - Format detected: "Format A (converted)" or "Format B (no-op)"
  - "<N> locators"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| `_locators/` missing | `"Cannot read _locators/<feature>.ts. File missing or inaccessible."` |
| Cannot detect format | `"Cannot detect _locators/ format. Expected raw codegen or array."` |
| Codegen line ambiguous | `"Cannot classify line: <line>. Fix _locators/ and rerun."` |

---

## Example — Print feature (Format A → converts)

**Precondition file** `_locators/print.ts` (raw codegen):

```typescript
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://apps-uat.tokiomarinesafety.co.th/wfe/dashboard'); 
  await page.getByRole('button', { name: 'ใบแจ้งงาน' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: ' Export Excel' }).click();
  const download = await downloadPromise;
  await page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first().click();
});
```

**User paste:**

```markdown
### Case 4 — Bootstrap locators

Read: #file:doc/prompts/case-4-locators.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print
```

**AI process:**
- Read `_locators/print.ts` → detect Format A (has `test(` function)
- Extract 7 lines from inside test body:
  - `page.goto(...)` → SKIP
  - `ใบแจ้งงาน...click()` → KEEP → strip `.click()`
  - `const downloadPromise = ...waitForEvent` → SKIP
  - `Export Excel...click()` → KEEP → strip `.click()`
  - `const download = await downloadPromise` → SKIP
  - `ปริ้นท์ พ.ร.บ...click()` → KEEP → strip `.click()`
- 3 locators extracted → N = 3

**Overwrites `_locators/print.ts`:**

```typescript
import type { Locator, Page } from '@playwright/test';

export const printLocators: Array<(page: Page) => Locator> = [
  (page) => page.getByRole('button', { name: 'ใบแจ้งงาน' }).first(),
  (page) => page.getByRole('button', { name: ' Export Excel' }),
  (page) => page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first(),
];
```

**Report:**
```
Format A (converted)
3 locators
```

---

## Example — Search feature (Format B → no-op)

**Precondition file** `_locators/search.ts` (already array):

```typescript
import type { Locator, Page } from '@playwright/test';

export const searchLocators: Array<(page: Page) => Locator> = [
  (page) => page.getByRole('textbox').first(),
  (page) => page.getByRole('textbox').nth(1),
  // ... 10 more ...
];
```

**AI process:**
- Read `_locators/search.ts` → detect Format B (has `export const searchLocators`)
- No conversion needed
- Count N = 12 from array

**Report:**
```
Format B (no-op)
12 locators
```

---

## Notes

### Purpose

Case 4 does one thing: takes `_locators/<feature>.ts` (raw codegen or array) → produces array format.

Benefits:
- Fast (single file conversion)
- Idempotent (re-running on array = no-op)
- Easy to debug (one concern)

### After Case 4

`_locators/<feature>.ts` is now in array format. Framework code can consume it.

### Re-running Case 4

Safe. Format B detection makes it idempotent — running twice on array format is no-op.