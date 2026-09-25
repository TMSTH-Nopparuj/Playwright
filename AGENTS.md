# AGENTS.md — ttest-playwright

Instructions for AI agents (GitHub Copilot, Cursor, Claude, ChatGPT) working with this framework.

---

## Section 1: Project Overview

**ttest-playwright** = universal Playwright test runner supporting multiple projects with different auth mechanisms.

### Folder structure

```
ttest-playwright/
├── AGENTS.md                            # This file (agent instructions)
├── AGENT_PROMPTS.md                     # Prompt templates index
├── doc/prompts/                         # Case rules for AI
│   ├── case-1-update-tcs.md
│   ├── case-2-extend-helper.md
│   └── case-3-bootstrap.md
├── analyze-project.bat / .ps1           # JSON structure generator
├── .agent-cache/                        # JSON cache (gitignored)
│
├── Authen/                              # Shared auth infrastructure
├── Test-Prod/                           # Public URL tests
│
└── Test-Local/                          # Auth-required tests
    └── <Project>/
        └── <AccessFlow>/
            ├── project.config.json
            │
            ├── <Module>/                # e.g. dashboard, car-model
            │   ├── _locators/           # Module-level, gitignored — locator array
            │   │   ├── .gitkeep
            │   │   └── <feature>.ts     # Array of locator functions, order = index
            │   │
            │   ├── _flows/              # Module-level, gitignored — flow templates
            │   │   ├── .gitkeep
            │   │   └── <feature>.ts     # setup + per-test flow with // === DATA === marker
            │   │
            │   ├── _scenarios/          # Module-level, COMMITTED — QA scenarios
            │   │   └── <feature>.csv    # 5 columns, Value with | action markers
            │   │
            │   └── <Feature>/           # 4-file feature pattern
            │       ├── <feature>.spec.ts
            │       ├── <feature>.helper.ts
            │       ├── <feature>.types.ts
            │       └── <feature>.data.ts
            │
            └── _shared/
                └── verify-helpers.ts
```

### Auth types

| authType | Mechanism |
|---|---|
| `none` | Public pages, no login |
| `microsoft` | Azure AD SSO — persistent Chromium profile |
| `form` | Email/password login — session storage |

### Structure decision

| Structure | Use when | Example |
|---|---|---|
| **Flat** | Simple CRUD, single feature, <10 test cases | `car-model/car-model-add.spec.ts` |
| **Nested** | Multiple features per module | `dashboard/search/search.spec.ts` + 3 files |

### Three module-level folders

| Folder | Owner | Committed? | Purpose |
|---|---|---|---|
| `_locators/` | Dev | ❌ | Array of locator functions (order-indexed) |
| `_flows/` | Dev | ❌ | Flow template with SETUP / PER TEST / `// === DATA ===` markers |
| `_scenarios/` | **QA** | ✅ | Test scenarios (CSV) — 1 row per TC |

### What counts as a feature?

One user-facing action with its own success criteria. Multiple actions on the same page = different features:
- `dashboard/search` — filter records
- `dashboard/print` — print work order
- `dashboard/export` — export data

---

## Section 2: Universal Principles

### Design principles

1. **AI does not generate selectors** — transcribes from dev's codegen in `_flows/` and `_locators/`
2. **Order is source of truth** — `_locators/` index N ↔ CSV Value item N
3. **Universal helper** — no per-feature action taxonomy; helper detects fill vs select from locator syntax, click from `|` prefix
4. **CSV drives everything** — Value column determines what runs per TC

### Locator rules (for HUMAN-written codegen)

- Prefer role-based selectors: `page.getByRole('button', { name: 'ค้นหา' })`
- Never use auto-generated IDs (`#radix-*`, `#mat-*`, UUIDs)
- Avoid `page.locator('span').first()` or similar brittle generic selectors — they flake on slow networks and cold starts. Replace with specific class/role selectors (`.ng-input`, `getByRole('combobox')`)
- Avoid `exact: true` with Thai labels containing `/`, spaces, or special chars
- Preserve Thai UI text exactly as it appears in the app

### Verification

- Import shared helpers from `Test-Local/<project>/_shared/verify-helpers.ts`
- Use `verifySearchResult`, `verifyEmptyState`, `verifyRecordCount`, `verifyFieldError`, `verifySuccessToast`, `verifyNavigatedTo`
- Feature-level `defaultVerify` in spec.ts runs at end of every test

### Security (never commit)

- `session-storage.json`, `state.json`, `profile/`, `.env`
- `_locators/**` and `_flows/**` contents (`.gitkeep` is committed)
- `.agent-cache/*.json`

`_scenarios/**` contents are always committed — QA-owned truth.

---

## Section 3: Discovery Mechanism

### Option A: Read JSON cache

**File:** `.agent-cache/project-structure.json`  
**Generate:** Run `analyze-project.bat` (or `.ps1`)  
**When:** Chat AI or when workspace scanning is expensive

### Option B: Scan workspace directly

For Copilot/Cursor with native workspace access.

---

## Section 4: Cases

Three cases cover all changes:

### Case 1 — Update test cases

**Signal:** Feature exists. Dev updated `_locators/` array or QA updated CSV.

**Action:** Regenerate `data.ts` from CSV. Regenerate helper's locator import if `_locators/` changed. Does NOT touch spec.ts, types.ts.

**Prompt template:** `doc/prompts/case-1-update-tcs.md`

### Case 2 — Extend helper capability

**Signal:** New locator type appears (e.g., datepicker widget helper can't dispatch), OR new action type needed (e.g., `|check` for checkbox).

**Action:** Add detection branch (for locator type) OR action case (for `|action`) to helper. Update this file's Section 9.

**Prompt template:** `doc/prompts/case-2-extend-helper.md`

### Case 3 — New feature (bootstrap)

**Signal:** Feature doesn't exist.

**Action:** Generate 4 files from `_flows/` + `_locators/` + `_scenarios/`.

**Prompt template:** `doc/prompts/case-3-bootstrap.md`

### Decision tree

```
Change needed
    │
    ├─► Feature exists?
    │     │
    │     ├─► No  ─► Case 3 (bootstrap)
    │     │
    │     └─► Yes ─► New locator type or |action needed?
    │               │
    │               ├─► Yes ─► Case 2 (extend helper)
    │               └─► No  ─► Case 1 (update data)
```

---

## Section 5: Codegen + Scenarios Workflow

### `_flows/<feature>.ts` — flow template (dev-owned, gitignored)

**Purpose:** Full skeleton of ONE typical TC. AI transcribes into spec.ts.

**Structure — 3 markers:**

```typescript
// === SETUP ===
// runs in beforeEach — login, navigation, one-time preparation
await page.goto('https://apps-uat.tokiomarinesafety.co.th/wfe/');
await page.getByText('TMSTH Staff...').click();
await page.locator('.ng-input').click();
await page.getByRole('option', { name: 'Hongqi' }).click();
await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

// === PER TEST ===
// runs inside each test body
await page.getByRole('button', { name: 'ล้างค่า' }).click();
await page.getByRole('button', { name: 'ค้นหา' }).click();
// === DATA ===
await page.getByRole('button', { name: 'ค้นหา' }).click();
```

**Rules:**
- MUST have `// === SETUP ===` and `// === PER TEST ===` markers
- PER TEST section MUST contain `// === DATA ===` (data insertion point)
- Everything above `// === DATA ===` in PER TEST = pre-data steps
- Everything below `// === DATA ===` in PER TEST = post-data steps
- Dev responsibility: `_flows/` must be **clean and complete** — represents what every TC does

**Print case (pure action, no pre/post steps):**
```typescript
// === SETUP ===
// login sequence

// === PER TEST ===
// === DATA ===
```
Only marker + data — snippet in `_locators/` handles everything.

### `_locators/<feature>.ts` — locator array (dev-owned, gitignored)

**Purpose:** Ordered array of Playwright locator functions. Index = position in CSV Value.

**Structure:**

```typescript
import type { Page, Locator } from '@playwright/test';

export const searchLocators: Array<(page: Page) => Locator> = [
  (page) => page.getByRole('textbox').first(),
  (page) => page.getByRole('textbox').nth(1),
  (page) => page.getByRole('textbox', { name: 'DD/MM/YYYY' }).first(),
  (page) => page.getByRole('button', { name: 'Next' }),
  (page) => page.getByRole('combobox').nth(1),
  // ...
];
```

**Rules:**
- Export as `<feature>Locators` (camelCase feature name + `Locators`)
- Type: `Array<(page: Page) => Locator>`
- Order matters — index N in this array maps to item N in CSV Value
- **NO comments describing what each locator is** — semantics live in `_scenarios/<feature>.csv` Scenario column, NOT here
- Cover ALL fields/buttons that any TC in the CSV references
- Use role-based selectors (see Section 2)

**Why no comments:**
- Comments invite AI to reason about field semantics → hallucination surface
- Framework principle: order = source of truth, no name matching
- If human needs to audit, cross-reference with CSV Scenario name and locator position

**Preparation:** Dev copies locator lines from `_flows/` codegen, arranges in the order that CSV Value expects.

### `_scenarios/<feature>.csv` — test scenarios (QA-owned, committed)

**Format — 5 columns:**

```csv
TC-ID,Module,Feature,Scenario,Value
TC001,Dashboard,Search,Search by Receipt,"HQ0000020"
TC005,Dashboard,Search,Search by Status,",,,,,,งานใหม่"
TC010,Dashboard,Search,Multi filter,"HQ0000020,Harry"
TC020,Dashboard,Wizard,Multi step,"A,B,C,|click,D,E,F"
TC030,Dashboard,Print,Print Job Sheet,"|click"
```

**Columns:**
- `TC-ID` — test case identifier
- `Module` / `Feature` — context (redundant with folder path but useful for QA)
- `Scenario` — human-readable name
- `Value` — comma-separated items, `|` prefix = action

**Value format rules — see Section 9 for full vocabulary:**
- Comma `,` separates items
- Empty item (`,,`) = skip that locator
- Plain text = text to fill/select at that locator
- `|<action>` prefix = action (e.g., `|click`) at that locator
- Wrap whole cell in double quotes to preserve commas
- Do NOT use commas inside a single value — reserved as delimiter

### Workflow

1. Dev codegen once → get raw script
2. Dev edit `_flows/<feature>.ts`:
   - Split into SETUP + PER TEST sections
   - Add `// === DATA ===` marker where TC-specific input goes
3. Dev extract locators → `_locators/<feature>.ts`:
   - Every field/button the CSV will reference, in order
4. QA prepare `_scenarios/<feature>.csv`:
   - 1 row per TC, Value uses `|` for actions
5. Run Case 3 → AI generates 4 files

---

## Section 6: Adding a New Feature Workflow

1. **Codegen** raw script from Playwright codegen
2. **Prepare `_flows/<feature>.ts`** with SETUP / PER TEST / `// === DATA ===` markers
3. **Prepare `_locators/<feature>.ts`** — export array of locator functions, ordered
4. **QA writes `_scenarios/<feature>.csv`** — 1 row per TC
5. **Choose structure** (flat vs nested)
6. **Run Case 3 prompt**
7. AI generates 4 files
8. Review + run tests
9. Regenerate JSON cache — `analyze-project.bat`
10. Add more TCs later via Case 1 (append CSV rows only — `_locators/` already covers fields)

---

## Section 7: Decision Trees

### When to add new verify helper

- Pattern used across 3+ specs → extract to `_shared/verify-helpers.ts`
- Pattern used in 1-2 specs → inline in spec

### When to extract to `_shared/`

- Function used across 3+ specs → extract
- Login/navigation used across 3+ specs → extract to `<project>/_shared/`

### When to split a feature into two

- `_flows/` PER TEST section has two disjoint patterns (different pre/post steps) → split
- CSV rows can't share the same locator array meaningfully → split

### When to add new locator type or action

- Codegen produced locator helper can't dispatch (e.g., datepicker widget) → Case 2 (add detection branch)
- New action needed beyond `|click` (e.g., `|check` for checkbox) → Case 2 (add action case)

---

## Section 8: 4-File Pattern (Reference)

### Design principle

**Helper is universal.** No per-feature action taxonomy. Helper dispatches based on:
1. Item content — starts with `|` → action, else → text
2. Locator syntax (for text items) — textbox → fill, combobox → click + select

Types file is minimal. Data.ts is flat.

### `<feature>.types.ts` — data shape

```typescript
export interface <Feature>TestCase {
  testCaseId: string;
  scenario: string;
  values: string[];
}
```

**That's it.** No Action union, no discriminated types. `values` is a flat string array (parsed from CSV).

### `<feature>.data.ts` — test cases

```typescript
import type { <Feature>TestCase } from './<feature>.types';

export const <feature>TestCases: <Feature>TestCase[] = [
  {
    testCaseId: 'TC001',
    scenario: 'Search by Receipt Number',
    values: ['HQ0000020'],
  },
  {
    testCaseId: 'TC010',
    scenario: 'Multi filter',
    values: ['HQ0000020', 'Harry'],
  },
  {
    testCaseId: 'TC020',
    scenario: 'Multi step wizard',
    values: ['A', 'B', 'C', '|click', 'D', 'E', 'F'],
  },
];
```

**Rules:**
- One object per CSV row
- `values` = CSV Value column split by `,` (preserving `|` prefix on action items)
- Empty items become `''` in the array (spec skips them)

### `<feature>.helper.ts` — universal dispatcher

```typescript
import { Page } from '@playwright/test';
import type { <Feature>TestCase } from './<feature>.types';
import { <feature>Locators } from '../../_locators/<feature>';

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
  
  // Action marker: |click, |check, ...
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
  
  // Text value: dispatch by locator type
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

**Rules:**
- Import `<feature>Locators` from `_locators/<feature>` (relative path)
- `applyItem` handles single index → dispatches by content type + locator type
- `apply<Feature>Inputs` loops with `Math.min(values, locators)` bound
- Skip empty items
- Throw explicit errors for unknown actions or locator types

### `<feature>.spec.ts` — orchestration

```typescript
import { test, Page, expect } from '@playwright/test';
import { <feature>TestCases } from './<feature>.data';
import { apply<Feature>Inputs } from './<feature>.helper';

const APPLICATION_URL = '...';

async function enter<Feature>Page(page: Page): Promise<void> {
  // LITERAL transcription of _flows/ SETUP section
  await page.goto(APPLICATION_URL);
  // ...
}

async function defaultVerify(page: Page): Promise<void> {
  // From Case 3 prompt — feature-level success check
}

test.describe('<Feature Name>', () => {
  test.beforeEach(async ({ page }) => {
    await enter<Feature>Page(page);
  });
  
  for (const testData of <feature>TestCases) {
    test(`${testData.testCaseId} - ${testData.scenario}`, async ({ page }) => {
      // PER TEST — before DATA (transcribed from _flows/)
      // e.g. clear filters, initial search
      
      // === DATA ===
      await apply<Feature>Inputs(page, testData);
      
      // PER TEST — after DATA (transcribed from _flows/)
      // e.g. click Search button
      
      await defaultVerify(page);
    });
  }
});
```

**Rules:**
- `enter<Feature>Page` = literal transcription of `_flows/` SETUP section
- Pre-data steps (above `// === DATA ===`) go directly in test body
- `// === DATA ===` → replaced with `await apply<Feature>Inputs(page, testData)`
- Post-data steps (below `// === DATA ===`) go directly in test body
- `defaultVerify` at end of every test

### How the 4 files connect

```
_flows/<feature>.ts      ──►  spec.ts (enterPage + test body transcription)
_locators/<feature>.ts   ──►  helper.ts (import as array)
_scenarios/<feature>.csv ──►  data.ts (parse Value → values array)
```

`_flows/`, `_locators/`, `_scenarios/` are read at **generation time** by AI.  
`_locators/` is also **imported at runtime** by helper.ts (only file that's runtime-linked).

---

## Section 9: Value + Locator Vocabulary

### Value item types (in CSV Value column)

CSV Value = comma-separated items. Each item at position N maps to `<feature>Locators[N]`.

| Item | Type | Meaning |
|---|---|---|
| `""` (empty) | Skip | Do nothing at this locator |
| `HQ0000020` | Text | Text to fill/select at this locator |
| `งานใหม่` | Text | Text to fill/select (unicode ok) |
| `\|click` | Action | Click at this locator (button/link) |
| `\|check` | Action | Check checkbox (Case 2 to enable) |
| `\|toggle` | Action | Toggle switch (Case 2 to enable) |

**Rule:** Item starting with `|` is always an action. Everything else is text.

### How helper dispatches text items

Helper reads locator function's source code and matches patterns:

| Locator pattern | Action taken |
|---|---|
| `getByRole('textbox', ...)` | `.fill(text)` |
| `getByRole('combobox', ...)` | `.click()` + click option with `name: text` |
| `locator('ng-select')...getByRole('combobox')` | `.click()` + click option with `name: text` |

**Unknown pattern** → helper throws error → Case 2 needed to extend detection

### How helper dispatches actions

Helper strips `|` prefix and matches action name:

| Action | Implementation |
|---|---|
| `click` | `target.click()` |
| Others | Not yet supported — Case 2 to add |

### Extending vocabulary (Case 2)

**New locator type** (e.g., datepicker with special widget):
1. Add detection branch in helper's text dispatch
2. Update this section's "How helper dispatches text items" table

**New action** (e.g., `|check` for checkbox):
1. Add case in helper's action switch
2. Update this section's "Value item types" table
3. Update "How helper dispatches actions" table

### CSV Value examples

**Single field fill:**
```csv
TC001,...,"HQ0000020"
```
→ `values: ['HQ0000020']` → fill locator[0] with "HQ0000020"

**Multi field fill (consecutive):**
```csv
TC010,...,"HQ0000020,Harry"
```
→ `values: ['HQ0000020', 'Harry']` → fill [0] with "HQ0000020", fill [1] with "Harry"

**Non-consecutive fields (skip middle):**
```csv
TC011,...,",,,,,,,,,DEALER001,CHASSIS001"
```
→ `values: ['','','','','','','','','','DEALER001','CHASSIS001']` → skip [0-8], fill [9] with "DEALER001", fill [10] with "CHASSIS001"

**Wizard (fill → click → fill):**
```csv
TC020,...,"A,B,C,|click,D,E,F"
```
→ `values: ['A','B','C','|click','D','E','F']` → fill [0-2], click [3] (button), fill [4-6]

**Pure action (Print button):**
```csv
TC001,...,"|click"
```
→ `values: ['|click']` → click locator[0] (button)

**Text value that happens to be "click":**
```csv
TC050,...,"click"
```
→ `values: ['click']` → helper checks: no `|` prefix → text → fill locator[0] with "click" (safe because textbox locator)

---

## Contribution notes

- Update this file when new locator type or action is added (Case 2 flow)
- Keep sections concise
- Preserve Thai UI labels exactly
- After adding/removing feature, run `analyze-project.bat`

---

## Changelog

- 2026-09-20 (v7.1) — `_locators/` MUST have NO comments (was: comments encouraged). Prevents AI from re-interpreting field semantics. Framework doubles down on "order = source of truth". Prompt scope guardrails added: `_locators/` and `_flows/` are read-only in all cases.
- 2026-09-20 (v7) — Value-based universal model. Helper dispatches by content (`|` prefix = action) + locator type (textbox/combobox). No per-feature action taxonomy. Types minimal (just values array). CSV Value with `|<action>` markers. `_locators/` = flat array (index-based). `_flows/` markers: SETUP + PER TEST + `// === DATA ===`. Print unified with Search under same model.
- 2026-09-20 (v6) — Snippet-based model. `_locators/` = 1 snippet per TC (order-matched to CSV). Phase 1 (spec/helper/types) from `_flows/`. Phase 2 (data + locator array) from `_locators/` + CSV. Action taxonomy in Section 9.
- 2026-09-20 (v5) — Pattern archetypes, step-based union, `_scenarios/` CSV convention.
- 2026-09-19 (v4) — `_flows/`, Section 8 (4-file pattern abstract).
- 2026-09-XX (v3) — Universal framework baseline.