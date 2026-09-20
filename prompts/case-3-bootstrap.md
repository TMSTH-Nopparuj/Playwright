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

- `Test-Local/<project>/<access-flow>/<module>/_flows/<feature>.ts` — with `// === SETUP ===` and `// === TEST ACTIONS ===` markers
- `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts` — with `// TC<ID>` markers before each snippet
- `Test-Local/<project>/<access-flow>/<module>/_scenarios/<feature>.csv` — rows match `_locators/` count and order

---

## Rules

Execute in this order.

### Precondition verification

1. Verify all 3 precondition files exist. If any missing → **STOP** and report which file(s).

2. Verify `_flows/<feature>.ts` has BOTH `// === SETUP ===` and `// === TEST ACTIONS ===` markers. If either missing → **STOP**.

3. Verify `_locators/<feature>.ts` has `// TC<ID>` comment before each snippet. If missing → **STOP**.

4. Verify snippet count in `_locators/` equals data row count in CSV (excluding header). If mismatch → **STOP** and report:
   - "Count mismatch: N snippets, M CSV rows"
   - List TC-IDs on each side

5. Verify feature folder does NOT exist at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If exists → **STOP** ("use Case 1 to update TCs instead").

### Phase 1 — Generate spec.ts, helper.ts (structure), types.ts

6. Read `AGENTS.md` Section 8 (4-File Pattern) and Section 9 (Action Vocabulary).

7. Read `_flows/<feature>.ts`:
   - Above `// === TEST ACTIONS ===` = SETUP section
   - Below `// === TEST ACTIONS ===` = TEST ACTIONS section

8. For each pattern in TEST ACTIONS section, identify the pattern name from Section 9 canonical patterns:
   - `.click()` single line → `click`
   - `waitForEvent('download')` + click + await → `download`
   - Click + immediate Close button click → `clickWithClose`
   - Fill + submit → `fillAndSubmit`
   - Open dropdown + click option → `selectFromDropdown`
   - Other → **STOP** and report "Case 2 required — new pattern: <describe>"

9. Generate `<feature>.types.ts`:
   ```typescript
   export type <Feature>Action = '<action1>' | '<action2>' | ...;
   
   export interface <Feature>TestCase {
     testCaseId: string;
     scenario: string;
     action: <Feature>Action;
     locatorIndex: number;
   }
   ```
   - `<Feature>` = PascalCase of feature name
   - Action union = string literals from step 8

10. Generate `<feature>.helper.ts`:
    ```typescript
    import { Page } from '@playwright/test';
    import type { <Feature>Action, <Feature>TestCase } from './<feature>.types';
    
    const locators: Array<(page: Page) => Promise<void>> = [
      // Populated in Phase 2
    ];
    
    async function applyAction(
      page: Page,
      action: <Feature>Action,
      locatorIndex: number
    ): Promise<void> {
      const locator = locators[locatorIndex];
      if (!locator) {
        throw new Error(`No locator at index ${locatorIndex}`);
      }
      
      switch (action) {
        // One case per pattern from step 8
        // Each case: fetch locator via `await locator(page)`, transcribe pattern from _flows/
        default: {
          const _: never = action;
          throw new Error(`Unknown action: ${_}`);
        }
      }
    }
    
    export async function apply<Feature>Action(
      page: Page,
      testData: <Feature>TestCase
    ): Promise<void> {
      await applyAction(page, testData.action, testData.locatorIndex);
    }
    ```

11. Generate `<feature>.spec.ts`:
    - Transcribe `_flows/` SETUP section LITERALLY into `enter<Feature>Page` helper
    - Preserve every line, order, Thai text character-for-character
    - Insert `waitForLoading(page)` after any interaction that triggers loading state
    - `defaultVerify` per Overrides (or default from top of this file)
    - Standard test structure:
      ```typescript
      test.describe('<Feature Name>', () => {
        test.beforeEach(async ({ page }) => {
          await enter<Feature>Page(page);
        });
        
        for (const testData of <feature>TestCases) {
          test(`${testData.testCaseId} - ${testData.scenario}`, async ({ page }) => {
            await apply<Feature>Action(page, testData);
            await defaultVerify(page);
          });
        }
      });
      ```

### Phase 2 — Populate locators array + generate data.ts

12. Read `_locators/<feature>.ts` — collect snippets in file order, each with `// TC<ID>` comment.

13. Read `_scenarios/<feature>.csv` — collect data rows in file order (skip header).

14. Cross-check: every CSV `Action` column value has a matching case in helper's switch (step 10). If mismatch → **STOP** and report unknown Action values.

15. Populate `<feature>.helper.ts` `locators` array:
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
    - Wrap each snippet as `async (page) => { <snippet> }` — no other rewrites
    - Order = file order in `_locators/`

16. Generate `<feature>.data.ts`:
    ```typescript
    import type { <Feature>TestCase } from './<feature>.types';
    
    export const <feature>TestCases: <Feature>TestCase[] = [
      {
        testCaseId: '<from CSV>',
        scenario: '<from CSV>',
        action: '<from CSV Action column>',
        locatorIndex: 0,
      },
      // ...
    ];
    ```
    - `locatorIndex` = 0-based row position
    - Length = CSV data row count

---

## Output

- 4 new files in `Test-Local/<project>/<access-flow>/<module>/<feature>/`
- Report per file:
  - `types.ts`: "Action union: <list>"
  - `helper.ts`: "<N> switch cases + <M> locators"
  - `spec.ts`: "SETUP transcribed: <N> lines"
  - `data.ts`: "<M> TCs generated"
- Sanity check: "All CSV Actions match switch cases: yes"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Precondition file missing | `"Precondition missing — <file>"` |
| `_flows/` markers missing | `"Add // === SETUP === and // === TEST ACTIONS === markers"` |
| `_locators/` TC-IDs missing | `"Add // TC<ID> comments before each snippet"` |
| Snippet count ≠ CSV rows | `"Count mismatch: N snippets, M rows"` + TC-ID lists |
| Pattern in TEST ACTIONS not in Section 9 | `"Case 2 required — new pattern: <description>"` |
| Feature folder exists | `"Feature exists — use Case 1 instead"` |
| CSV Action not in identified patterns | `"CSV Action '<value>' doesn't match any TEST ACTIONS pattern"` |

---

## Why AI does not match by name

Order is deterministic. Name matching = translation guessing (EN CSV vs TH codegen) = hallucination.

`_locators/` position N ↔ CSV row N ↔ `locatorIndex: N`. TC-ID comments = audit trail for humans + safety cross-check.