# Case 3 — New Feature Bootstrap (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

---

## What the user paste looks like

```markdown
### Case 3 — New feature (bootstrap)

Read: #file:doc/prompts/case-3-bootstrap.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>
```

The user may add **Overrides** section — see "Defaults" below.

AI extracts `<project>`, `<access-flow>`, `<module>`, `<feature>` from the Location block and uses them throughout the rules.

---

## Defaults

If user does not include an Overrides section, use these:

| Setting | Default value |
|---|---|
| Structure | `nested` |
| Default verify | `no visible error dialog + URL still matches /<module>/` |

User overrides apply per-key. If user provides only `Structure: flat`, use flat + default verify.

---

## Preconditions

All 3 must exist before Case 3 runs:

- `Test-Local/<project>/<access-flow>/<module>/_flows/<feature>.ts` — with `// === SETUP ===`, `// === PER TEST ===`, and `// === DATA ===` markers
- `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts` — exports `<feature>Locators` array
- `Test-Local/<project>/<access-flow>/<module>/_scenarios/<feature>.csv` — 5 columns (TC-ID, Module, Feature, Scenario, Value)

---

## Scope

- Generate the 4 files specified in Rules. That's it.
- `_flows/`, `_locators/`, `_scenarios/` are READ-ONLY reference files — DO NOT modify them (`_locators/` and `_scenarios/` are only bootstrapped by Case 4)
- DO NOT add, remove, or rewrite comments in `_locators/` (even if they seem wrong)
- DO NOT run tests (`npx playwright test`, `pnpm test`, etc.)
- DO NOT execute terminal commands beyond file creation
- DO NOT launch browser, dev server, or Playwright inspector
- DO NOT install packages or modify `package.json`
- User will review and test manually after generation

---

## Rules

Execute in this order.

### Precondition verification

1. Verify all 3 precondition files exist. If any missing → **STOP** and report which file(s).

2. Verify `_flows/<feature>.ts` has all 3 markers:
   - `// === SETUP ===`
   - `// === PER TEST ===`
   - `// === DATA ===`
   
   If any missing → **STOP** and report.

3. Verify `_locators/<feature>.ts` exports array named `<feature>Locators` with type `Array<(page: Page) => Locator>`. If not → **STOP**.

4. Verify feature folder does NOT exist at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If exists → **STOP** ("use Case 1 to update TCs instead").

### Read source files

5. Read `AGENTS.md` Section 8 (4-File Pattern) and Section 9 (Value + Locator Vocabulary).

6. Read `_flows/<feature>.ts` and split into 3 sections:
   - **SETUP section**: everything between `// === SETUP ===` and `// === PER TEST ===`
   - **PER TEST — before DATA**: everything between `// === PER TEST ===` and `// === DATA ===`
   - **PER TEST — after DATA**: everything after `// === DATA ===`

7. Read `_locators/<feature>.ts` — get the exported array. Note its length N (number of locators).

8. Read `_scenarios/<feature>.csv`:
   - Skip header row
   - For each data row, extract `TC-ID`, `Scenario`, and `Value`
   - Parse `Value` by splitting on `,` (respecting double-quote wrap) → items array

### Parse Value column

9. For each CSV row's Value:
   - Split by `,` (CSV standard — commas inside `""` are preserved)
   - Result = items array, each item either:
     - Empty string `""` (skip at this locator)
     - Plain text (fill/select at this locator)
     - `|<action>` prefix (execute action at this locator)
   
   No further parsing needed at generation time — helper handles dispatch at runtime.

### Generate files

10. Generate `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.types.ts`:
    
    ```typescript
    export interface <Feature>TestCase {
      testCaseId: string;
      scenario: string;
      values: string[];
    }
    ```
    
    `<Feature>` = PascalCase of feature name.

11. Generate `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.helper.ts`:
    
    ```typescript
    import { Page } from '@playwright/test';
    import type { <Feature>TestCase } from './<feature>.types';
    import { <feature>Locators } from '../_locators/<feature>';
    
    async function applyItem(
      page: Page,
      index: number,
      item: string
    ): Promise<void> {
      const locatorFn = <feature>Locators[index];
      if (!locatorFn) {
        throw new Error(`No locator at index ${index}`);
      }
      
      const target = locatorFn(page);
      
      // Action marker: |click, |check, etc.
      if (item.startsWith('|')) {
        const action = item.slice(1);
        switch (action) {
          case 'click':
            await target.click();
            return;
          default:
            throw new Error(`Unknown action: |${action}`);
        }
      }
      
      // Text value: dispatch by locator syntax
      const locatorCode = locatorFn.toString();
      
      if (locatorCode.includes("getByRole('textbox'") || 
          locatorCode.includes('getByRole("textbox"')) {
        await target.fill(item);
      } else if (locatorCode.includes("getByRole('combobox'") ||
                 locatorCode.includes('ng-select')) {
        await target.click();
        await page.getByRole('option', { name: item }).click();
      } else {
        throw new Error(
          `Cannot dispatch text value at index ${index} — ` +
          `unknown locator type. Locator: ${locatorCode}`
        );
      }
    }
    
    export async function apply<Feature>Inputs(
      page: Page,
      testData: <Feature>TestCase
    ): Promise<void> {
      const bound = Math.min(testData.values.length, <feature>Locators.length);
      for (let i = 0; i < bound; i++) {
        const item = testData.values[i];
        if (item === '') continue;
        await applyItem(page, i, item);
      }
    }
    ```
    
    - `<Feature>` PascalCase, `<feature>` original case
    - Import path: `../_locators/<feature>` (feature folder → parent → _locators)

12. Generate `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.spec.ts`:
    
    - Transcribe SETUP section (from step 6) LITERALLY into `enter<Feature>Page` helper
    - Preserve every line, order, Thai text character-for-character
    - Insert `waitForLoading(page)` after any interaction that triggers loading state
    - Transcribe PER TEST — before DATA into test body (before `apply<Feature>Inputs` call)
    - Insert `await apply<Feature>Inputs(page, testData)` at `// === DATA ===` position
    - Transcribe PER TEST — after DATA into test body (after `apply<Feature>Inputs` call)
    - Generate `defaultVerify` from Overrides (or default from top of this file)
    
    Structure:
    ```typescript
    import { test, Page, expect } from '@playwright/test';
    import { <feature>TestCases } from './<feature>.data';
    import { apply<Feature>Inputs } from './<feature>.helper';
    
    const APPLICATION_URL = '...';
    
    async function waitForLoading(page: Page): Promise<void> {
      const loadingBackdrop = page.locator('.loading-backdrop');
      if (await loadingBackdrop.count()) {
        await expect(loadingBackdrop).toBeHidden({ timeout: 30_000 });
      }
    }
    
    async function enter<Feature>Page(page: Page): Promise<void> {
      // SETUP section transcribed here
    }
    
    async function defaultVerify(page: Page): Promise<void> {
      // From Overrides or default
    }
    
    test.describe('<Feature Title>', () => {
      test.beforeEach(async ({ page }) => {
        await enter<Feature>Page(page);
      });
      
      for (const testData of <feature>TestCases) {
        test(`${testData.testCaseId} - ${testData.scenario}`, async ({ page }) => {
          // PER TEST — before DATA (transcribed from _flows/)
          
          // === DATA ===
          await apply<Feature>Inputs(page, testData);
          
          // PER TEST — after DATA (transcribed from _flows/)
          
          await defaultVerify(page);
        });
      }
    });
    ```

13. Generate `Test-Local/<project>/<access-flow>/<module>/<feature>/<feature>.data.ts`:
    
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
      {
        testCaseId: 'TC010',
        scenario: 'Multi filter',
        values: [
          'HQ0000020', 'Harry', '', '', '', '',
          '', '', '', '', '', '',
        ],
      },
      {
        testCaseId: 'TC020',
        scenario: 'Multi step wizard',
        values: [
          'A', 'B', 'C', '|click', 'D', 'E', 'F',
        ],
      },
      // ... one entry per CSV row
    ];
    ```
    
    **Critical rules — MUST follow:**
    
    - Write `values` as **literal string array** with every item visible
    - Do NOT create helper functions like `parseValues()` — they hide comma-counting errors
    - Every row's `values.length` MUST equal N (the count from `_locators/` in step 7)
    - Empty items MUST be written as `''` (empty string), not omitted
    - Preserve `|<action>` items exactly (helper strips `|` at runtime)
    - Recommended layout: 6 items per line for readability with 12 locators
    
    **Wrong — do NOT do this:**
    
    ```typescript
    // ❌ Helper hides errors — Copilot may miscount commas when retyping
    function parseValues(raw: string): string[] {
      return raw.split(',');
    }
    
    values: parseValues('HQ0000020,,,,,,,,,,,'),  // 11 commas or 10? hard to eyeball
    ```
    
    **Why literal:** Each item is visible and countable. Position of non-empty items is obvious. No hidden parsing bug.

14. **Verify data.ts before finishing (in-conversation only — NO tools):**
    
    - Read the values array of each row you just wrote
    - Count items by inspection (mentally / by looking at the code you generated)
    - **DO NOT run terminal, PowerShell, bash, regex tools, scripts, or any tool for this check**
    - **DO NOT read the file back with a tool — trust what you just wrote**
    - Report each row inline: "TC001: 12 items ✓" or "TC005: 11 items ✗"
    - Assert `values.length === N` (locator count from step 7) for every row
    - If ANY row fails → **STOP** and report:
      ```
      Row TC<ID> has values.length = <M>, expected <N>.
      Fix: ensure each row has exactly <N> items (empty as '').
      ```
    - Cross-check: the non-empty item positions should match the CSV Value column's non-empty positions

---

## Output

- 4 new files in `Test-Local/<project>/<access-flow>/<module>/<feature>/`
- Report per file:
  - `types.ts`: "TestCase interface generated"
  - `helper.ts`: "Universal dispatcher (imports N locators)"
  - `spec.ts`: "SETUP transcribed: <N> lines, PER TEST pre: <M> lines, PER TEST post: <K> lines"
  - `data.ts`: "<X> TCs generated from CSV"
- Sanity check summary:
  - Locator count: <N>
  - CSV rows: <X>
  - Max Value item count per row: <Y>
  - If any row's Value item count > locator count → warning (values beyond locator length will be discarded)

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Precondition file missing | `"Precondition missing — <file>"` |
| `_flows/` markers missing | `"Add // === SETUP ===, // === PER TEST ===, and // === DATA === markers"` |
| `_locators/` not exporting expected array | `"Export <feature>Locators as Array<(page: Page) => Locator>"` |
| Feature folder exists | `"Feature exists — use Case 1 instead"` |
| `data.ts` row's values.length ≠ locator count | `"Row TC<ID> has values.length = <M>, expected <N>. Fix each row to have exactly <N> items."` |

---

## Notes

### Why no action taxonomy

Old model required identifying patterns (`click`, `download`, `clickWithClose`) per feature. Removed because:
- Helper dispatches by locator type (textbox → fill, combobox → select) — no per-feature switch cases
- Actions marked in CSV with `|` prefix — helper handles them uniformly
- Simpler bootstrap, no pattern matching, no Section 9 lookups

### Why order matters

`_locators/` array index N ↔ CSV Value item N. This mapping is deterministic:
- No name matching (source of hallucination in older models)
- Empty items in CSV skip the corresponding locator
- Non-consecutive fields work naturally (empty commas in the middle)

### Print vs Search — same model

Both use the same structure:
- Print: `Value = "|click"` → helper clicks locator[0] (button)
- Search: `Value = "HQ0000020"` → helper fills locator[0] (textbox)

No archetypes, no branches at the framework level.