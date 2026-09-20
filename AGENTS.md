# AGENTS.md — ttest-playwright

Instructions for AI agents (GitHub Copilot, Cursor, Claude, ChatGPT) working with this framework.

---

## Section 1: Project Overview

**ttest-playwright** = universal Playwright test runner supporting multiple projects with different auth mechanisms.

### Folder structure

```
ttest-playwright/
├── AGENTS.md                            # This file (agent instructions)
├── AGENT_PROMPTS.md                     # Prompt templates for humans
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
            │   ├── _locators/           # Module-level, gitignored — per-TC snippets
            │   │   ├── .gitkeep
            │   │   └── <feature>.ts     # 1 snippet per TC, ordered by CSV
            │   │
            │   ├── _flows/              # Module-level, gitignored — full-flow codegen
            │   │   ├── .gitkeep
            │   │   └── <feature>.ts     # setup + test actions, marked
            │   │
            │   ├── _scenarios/          # Module-level, COMMITTED — QA scenarios
            │   │   └── <feature>.csv    # 1 row per TC, order matches _locators/
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
| **Nested** | Multiple features per module, OR 3+ action types | `dashboard/print/print.spec.ts` + 3 files |

### Three module-level folders

| Folder | Owner | Committed? | Purpose |
|---|---|---|---|
| `_locators/` | Dev | ❌ | Per-TC action snippets — 1 per row |
| `_flows/` | Dev | ❌ | Full-flow codegen — setup + test-action patterns |
| `_scenarios/` | **QA** | ✅ | Test scenarios (CSV) — 1 row per TC |

### What counts as a feature?

One user-facing action with its own success criteria. Multiple actions on the same page = different features:
- `dashboard/search` — filter records, verify results
- `dashboard/print` — print work order, verify dialog/download
- `dashboard/export` — export data, verify file

---

## Section 2: Universal Principles

### Locator rules (for HUMAN-written codegen in `_flows/` and `_locators/`)

- Prefer role-based selectors: `page.getByRole('button', { name: 'ค้นหา' })`
- Never use auto-generated IDs (`#radix-*`, `#mat-*`, UUIDs)
- Avoid `exact: true` with Thai labels containing `/`, spaces, or special chars
- Preserve Thai UI text exactly as it appears in the app

**AI does not generate selectors** in this framework. Selectors come from dev's codegen in `_flows/` and `_locators/`. AI only transcribes.

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

## Section 4: Pattern Design Workflow

Three cases cover all changes to a feature:

### Case 1 — Update test cases

**Signal:** Feature exists. Dev updated `_locators/` snippets or QA appended CSV rows. Need to regenerate test data.

**Action:** AI re-reads `_locators/` + CSV → regenerates helper's locator array + `data.ts`. Does NOT touch spec.ts, types.ts.

**Files touched:** 2 (`helper.ts` locator array section + `data.ts`)

**Prompt template:** See `AGENT_PROMPTS.md` → Case 1

### Case 2 — Extend pattern (new action type)

**Signal:** Dev added a new pattern in `_flows/` that helper's switch doesn't handle (e.g., `dragAndDrop`, `uploadFile`).

**Action:** Add case to helper switch + variant to types.ts union + update this file's Section 9.

**Files touched:** 2-3 (`helper.ts` + `types.ts` + optionally AGENTS.md)

**Prompt template:** See `AGENT_PROMPTS.md` → Case 2

### Case 3 — New feature (bootstrap all 4 files)

**Signal:** Feature doesn't exist yet.

**Action:** Two phases in one prompt:
- **Phase 1** — Generate `spec.ts`, `helper.ts`, `types.ts` from `_flows/`
- **Phase 2** — Populate helper's locator array + `data.ts` from `_locators/` + CSV

**Files touched:** 4 new files, requires 3 precondition files (`_flows/`, `_locators/`, `_scenarios/`)

**Prompt template:** See `AGENT_PROMPTS.md` → Case 3

### Decision tree

```
Change needed
    │
    ├─► Feature exists?
    │     │
    │     ├─► No  ─► Case 3 (bootstrap)
    │     │
    │     └─► Yes ─► New action type in _flows/?
    │               │
    │               ├─► Yes ─► Case 2 (extend helper)
    │               └─► No  ─► Case 1 (update TCs)
```

---

## Section 5: Codegen + Scenarios Workflow

### `_flows/<feature>.ts` — full flow (dev-owned, gitignored)

**Purpose:** Full sequence from login through all test-action patterns, used to generate spec.ts + helper.ts + types.ts.

**Structure — 2 sections separated by marker:**

```typescript
// === SETUP ===
// everything that happens BEFORE test actions:
// login, navigation, clear filters, click search to populate table, etc.

await page.goto('...');
await page.getByText('TMSTH Staff...').click();
// ...
await page.getByRole('button', { name: 'ล้างค่า' }).click();
await page.getByRole('button', { name: 'ค้นหา' }).click();

// === TEST ACTIONS ===
// every pattern used by any TC:
// simple click, download event, click-with-close, etc.

// pattern: download
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export Excel' }).click();
const download = await downloadPromise;

// pattern: click-with-close
await page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first().click();
await page.getByRole('button', { name: 'Close' }).click();
```

**Rules:**
- MUST have `// === SETUP ===` and `// === TEST ACTIONS ===` markers
- Everything above SETUP marker (or before it) → goes into `enter<Feature>Page` in spec.ts
- Everything below TEST ACTIONS marker → analyzed for action patterns → becomes helper switch cases
- Dev responsibility: `_flows/` must be **clean and comprehensive** — every pattern any TC uses must appear here

### `_locators/<feature>.ts` — per-TC snippets (dev-owned, gitignored)

**Purpose:** One snippet per TC, ordered to match CSV rows.

**Structure — 1 comment marker + 1 snippet per TC:**

```typescript
// TC001 - Export Excel
await page.getByRole('button', { name: 'Export Excel' }).click();

// TC002 - Print Compulsory
await page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first().click();

// TC003 - Print Job Sheet
await page.getByRole('button', { name: 'ใบแจ้งงาน' }).first().click();
```

**Rules:**
- 1 snippet per TC, separated by `// TC<ID> - <name>` comments
- Snippet = the ATOMIC interaction only (a single click / fill / select) — NOT the full pattern
  - Pattern wrappers (download event, close dialog) come from `_flows/` and live in helper
- Order MUST match CSV row order
- Snippet count MUST match CSV row count
- TC-ID comments are audit trail for humans (AI parses them as a safety check)

**Preparation shortcut:** Dev copies test-action lines from `_flows/`, strips pattern wrappers, adds TC-ID comments. Reuse 1 codegen session.

### `_scenarios/<feature>.csv` — test scenarios (QA-owned, committed)

**Format — 5 columns:**

```csv
TC-ID,Module,Feature,Scenario,Action
TC001,Dashboard,Print,Export Excel,download
TC002,Dashboard,Print,Print Compulsory,clickWithClose
TC003,Dashboard,Print,Print Job Sheet,clickWithClose
```

**Columns:**
- `TC-ID` — test case identifier
- `Module` / `Feature` — context (redundant with folder path but useful for QA)
- `Scenario` — human-readable name
- `Action` — single action type name matching a case in helper's switch (see Section 9)

**Rules:**
- 1 row per TC — no multi-line scenarios
- Row order MUST match `_locators/` snippet order
- Row count MUST match `_locators/` snippet count
- `Action` value MUST be a case name in helper's switch (Section 9)

### Workflow

1. Dev codegen `_flows/<feature>.ts` — add SETUP / TEST ACTIONS markers
2. Dev prepare `_locators/<feature>.ts` — copy atomic interactions with TC-ID markers
3. QA prepare `_scenarios/<feature>.csv` — matching row count + order
4. Run Case 3 → AI generates 4 files

---

## Section 6: Adding a New Feature Workflow

1. **Codegen** `_flows/<feature>.ts` with SETUP / TEST ACTIONS markers
2. **Prepare** `_locators/<feature>.ts` (1 snippet per TC, matches CSV order)
3. **QA writes** `_scenarios/<feature>.csv`
4. **Choose structure** (flat vs nested)
5. **Run Case 3 prompt**
6. AI generates 4 files
7. Review + run tests
8. Regenerate JSON cache — `analyze-project.bat`
9. Add more TCs later via Case 1 (append CSV rows + `_locators/` snippets)

---

## Section 7: Decision Trees

### When to add new verify helper

- Pattern used across 3+ specs → extract to `_shared/verify-helpers.ts`
- Pattern used in 1-2 specs → inline in spec

### When to create new AGENTS.md (nested)

- **Never** — framework is universal by design

### When to extract to `_shared/`

- Function used across 3+ specs → extract
- Login/navigation used across 3+ specs → extract to `<project>/_shared/`

### When to split a feature into two

- `_flows/` has two paths with different success criteria → split
- CSV rows have scenarios that can't share the same `defaultVerify` → split

---

## Section 8: 4-File Pattern (Reference)

### Design principle

**Phase 1 (spec + helper + types) is generated from `_flows/`.**  
**Phase 2 (data.ts + helper locator array) is generated from `_locators/` + `_scenarios/`.**

AI does not match scenario names against codegen labels — order is the single source of truth. This eliminates hallucination surface.

### `<feature>.types.ts` — data shape

**Structure:**

```typescript
// Action type: one string literal per case in helper's switch
export type <Feature>Action = 'click' | 'download' | 'clickWithClose' | ...;

// Test case: references locator by index, action by name
export interface <Feature>TestCase {
  testCaseId: string;
  scenario: string;
  action: <Feature>Action;
  locatorIndex: number;
}
```

Action names come from patterns AI identifies in `_flows/` TEST ACTIONS section (see Section 9).

### `<feature>.helper.ts` — action application + locator array

**Structure:**

```typescript
import { Page } from '@playwright/test';
import type { <Feature>Action, <Feature>TestCase } from './<feature>.types';

// Phase 2: populated from _locators/<feature>.ts
const locators: Array<(page: Page) => Promise<void>> = [
  async (page) => {
    // TC001 snippet
  },
  async (page) => {
    // TC002 snippet
  },
  // ...
];

// Phase 1: patterns from _flows/ TEST ACTIONS
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
    case 'click': {
      await locator(page);
      break;
    }
    case 'download': {
      const downloadPromise = page.waitForEvent('download');
      await locator(page);
      await downloadPromise;
      break;
    }
    case 'clickWithClose': {
      await locator(page);
      await page.getByRole('button', { name: 'Close' }).click();
      break;
    }
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

**Rules:**
- `locators` array populated Phase 2 (order matches CSV)
- `applyAction` switch cases come from Phase 1 (`_flows/` TEST ACTIONS)
- Every case must:
  1. Fetch locator by index
  2. Execute pattern (wrap locator call with any needed setup/teardown)
- `never`-type default case mandatory

### `<feature>.spec.ts` — orchestration

**Structure:**

```typescript
import { test, Page } from '@playwright/test';
import { <feature>TestCases } from './<feature>.data';
import { apply<Feature>Action } from './<feature>.helper';

const APPLICATION_URL = '...';

async function waitForLoading(page: Page): Promise<void> {
  // if flows uses it
}

// Setup helper derived from _flows/ SETUP section (top-to-bottom transcription)
async function enter<Feature>Page(page: Page): Promise<void> {
  await page.goto(APPLICATION_URL);
  // ... every step from _flows/ SETUP section
}

// Feature-level default verify (from user in Case 3 prompt)
async function defaultVerify(page: Page): Promise<void> {
  // e.g. no error dialog + URL matches
}

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

**Rules:**
- `enter<Feature>Page` = LITERAL transcription of `_flows/` SETUP section (with `waitForLoading` inserted where flow shows loading states)
- `defaultVerify` = feature-level check, user specifies content in Case 3 prompt
- Test loop is universal boilerplate

### `<feature>.data.ts` — test cases

**Structure:**

```typescript
import type { <Feature>TestCase } from './<feature>.types';

export const <feature>TestCases: <Feature>TestCase[] = [
  {
    testCaseId: 'TC001',
    scenario: 'Export Excel',
    action: 'download',
    locatorIndex: 0,
  },
  {
    testCaseId: 'TC002',
    scenario: 'Print Compulsory',
    action: 'clickWithClose',
    locatorIndex: 1,
  },
  // ...
];
```

**Rules:**
- Populated from CSV rows
- `locatorIndex` = CSV row position (0-based)
- Length = CSV row count = `_locators/` snippet count

### How the 4 files connect

```
_flows/<feature>.ts (SETUP)       ──►   spec.ts (enter<Feature>Page)
_flows/<feature>.ts (TEST ACTIONS)──►   helper.ts (switch cases) + types.ts (action union)
_locators/<feature>.ts             ──►   helper.ts (locators array)
_scenarios/<feature>.csv           ──►   data.ts (TC array)
```

`_flows/`, `_locators/`, `_scenarios/` are NOT imported at runtime — AI reads them at generation time.

---

## Section 9: Action Vocabulary

Actions are patterns AI identifies in `_flows/` TEST ACTIONS section. Each pattern → one case in helper switch → one string literal in types union.

### Canonical patterns

| Pattern | `_flows/` signature | Helper case |
|---|---|---|
| **click** | Single `.click()` line | Call locator(page) |
| **download** | `waitForEvent('download')` + click + await | Wrap locator with download promise |
| **clickWithClose** | Click + immediate close button click | Locator then click Close button |
| **fillAndSubmit** | Fill + click submit | Locator + submit button |
| **selectFromDropdown** | Open dropdown + click option | Locator opens dropdown, args select option |
| **dragAndDrop** | Two locators + drag | Not yet supported — Case 2 to add |

### Naming rules

- Action name = camelCase, describes what the pattern DOES
- No target names in the action (targets come from locator index)
- Frozen list — new pattern requires Case 2

### Extending the vocabulary

If `_flows/` has a pattern not in the list:
1. Case 3 STOPS and reports "New pattern in _flows/: <description>"
2. User runs Case 2 to add pattern → helper switch case + types union + this section
3. Case 3 re-runs

**AI never invents pattern names.** New pattern = Case 2 explicitly.

### Feature-level default verify

Each feature has `defaultVerify(page)` in spec.ts, running at end of every test. Content is provided by user in Case 3 prompt.

Examples:
- **Print:** no error dialog + still on `/dashboard`
- **Search:** no error + result count > 0
- **Export:** download completed

---

## Contribution notes

- Update this file when new pattern emerges (Case 2 flow)
- Keep sections concise
- Preserve Thai UI labels exactly
- After adding/removing feature, run `analyze-project.bat`

---

## Changelog

- 2026-09-20 (v6) — Snippet-based model. `_locators/` = 1 snippet per TC (order-matched to CSV). Phase 1 (spec/helper/types) from `_flows/`. Phase 2 (data + locator array) from `_locators/` + CSV. Zero hallucination surface (AI never generates selectors). Section 9 rewritten: Action patterns replace verb-based steps.
- 2026-09-20 (v5.1) — Added "test-ready state" definition, no-translate + no-OR-regex rules.
- 2026-09-20 (v5) — Pattern archetypes, step-based union, `_scenarios/` CSV convention.
- 2026-09-19 (v4) — `_flows/`, Section 8 (4-file pattern abstract).
- 2026-09-XX (v3) — Universal framework baseline.