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
│   └── project-structure.json
│
├── Authen/                              # Shared auth infrastructure
│   ├── Microsoft/                       # Azure AD SSO
│   └── Form-Login/                      # Form-based auth
│
├── Test-Prod/                           # Public URL tests (flat: project/spec)
│
└── Test-Local/                          # Auth-required tests
    └── <Project>/                       # e.g. WEF, Nebula-Spa
        └── <AccessFlow>/                # e.g. Microsoft-Login, Admin-Login
            ├── project.config.json      # { "authType": "microsoft|form|none" }
            │
            ├── <Module>/                # e.g. dashboard, car-model
            │   ├── _locators/           # Module-level, gitignored — field codegen
            │   │   ├── .gitkeep
            │   │   ├── search.ts
            │   │   └── print.ts
            │   │
            │   ├── _flows/              # Module-level, gitignored — full-flow codegen
            │   │   ├── .gitkeep
            │   │   ├── search.ts
            │   │   └── print.ts
            │   │
            │   ├── _scenarios/          # Module-level, COMMITTED — QA test scenarios (CSV)
            │   │   ├── search.csv
            │   │   └── print.csv
            │   │
            │   └── <Feature>/           # 4-file feature pattern
            │       ├── <feature>.spec.ts
            │       ├── <feature>.helper.ts
            │       ├── <feature>.types.ts
            │       └── <feature>.data.ts
            │
            └── _shared/                 # Shared utilities across features
                └── verify-helpers.ts
```

### Auth types

| authType | Mechanism |
|---|---|
| `none` | Public pages, no login |
| `microsoft` | Azure AD SSO — persistent Chromium profile |
| `form` | Email/password login — session storage (cookies or sessionStorage) |

### Structure decision

| Structure | Use when | Example |
|---|---|---|
| **Flat** (spec directly in module) | Simple CRUD, single feature, <10 test cases | `car-model/car-model-add.spec.ts` |
| **Nested** (feature folder + 4 files) | Multiple features per module, OR 3+ actions, OR 10+ data-driven cases | `dashboard/print/print.spec.ts` + `.helper.ts` + `.types.ts` + `.data.ts` |

### Three module-level folders

| Folder | Contents | Owner | Committed? | Purpose |
|---|---|---|---|---|
| `_locators/` | Field codegen (single-page interactions) | Dev | ❌ gitignored | Field inventory: what's on the page |
| `_flows/` | Full-flow codegen (navigate → interact → submit) | Dev | ❌ gitignored | Sequence: how the feature is used end-to-end |
| `_scenarios/` | QA test scenarios (CSV) | **QA** | ✅ committed | Intent: what to test + how (step-by-step) |

Only `.gitkeep` is committed inside `_locators/` and `_flows/`. Everything in `_scenarios/` is committed.

### What counts as a feature?

A feature = **one user-facing action** with its own success criteria.

Multiple actions on the same page can be different features:
- `dashboard/search` → filter records, verify results
- `dashboard/print` → print work order, verify download/dialog
- `dashboard/export` → export data, verify file

Rule: if two actions have **different success criteria**, they are different features — even on the same page.

---

## Section 2: Universal Principles

### Locator rules

- **Prefer role-based** selectors: `page.getByRole('button', { name: 'ค้นหา' })`
- **Never use** auto-generated IDs (`#radix-*`, `#mat-*`, UUIDs) — they change per render
- **Avoid `exact: true`** with Thai labels containing `/`, spaces, or special chars — use partial match or RegExp
- **Preserve Thai UI text** exactly as it appears in the app (`'ค้นหา'`, `'บันทึก'`, `'ไม่พบข้อมูล'`)

### Verification

- Import shared helpers from `Test-Local/<project>/_shared/verify-helpers.ts`
- Use `verifySearchResult`, `verifyEmptyState`, `verifyRecordCount`, `verifyFieldError`, `verifySuccessToast`, `verifyNavigatedTo`
- Never use bare `expect(...).toBeVisible()` for common patterns — use typed helper

### Security (never commit)

- `session-storage.json`, `state.json`, `profile/`
- `.env` files
- `_locators/**` and `_flows/**` — contents only (`.gitkeep` is committed)
- `.agent-cache/*.json`

Contents of `_scenarios/**` are **always committed** — they are QA-owned truth.

---

## Section 3: Discovery Mechanism

AI agents can discover project structure via two paths — user chooses per session.

### Option A: Read JSON cache (token-efficient)

**File:** `.agent-cache/project-structure.json`

**Generate:** Run `analyze-project.bat` (or `.ps1`) — scans `Test-Local/` and writes JSON

**Contents:** All projects → access flows → modules → features → files, patterns, test case count

**When to use:**
- Chat AI (Claude, ChatGPT web) — paste JSON as context
- Any AI when workspace scanning is expensive

**When to regenerate:** After adding/renaming feature, module, or access flow

### Option B: Scan workspace directly

**When to use:** Copilot/Cursor with native workspace access

**How:** Follow folder convention in Section 1 to locate files

---

## Section 4: Pattern Design Workflow

Three cases cover all changes to a feature:

### Case 1 — Add test case(s) under existing pattern

**Signal:** Feature exists, all steps in new scenarios use verbs the helper already handles

**Action:** Append rows to `_scenarios/<feature>.csv` → run Case 1 → AI appends to `data.ts`

**Files touched:** 1 (`data.ts`) + `_scenarios/<feature>.csv` (dev/QA appends)

**Prompt template:** See `AGENT_PROMPTS.md` → Case 1

### Case 2 — Extend pattern (new step verb)

**Signal:** New scenario has a step verb (e.g., `Upload`, `Drag`) not covered by helper's switch

**Action:**
1. Add verb to `helper.ts` switch
2. Extend `types.ts` `Step` union
3. Update AGENTS.md Section 9 verb list

**Files touched:** 2-3 (`types.ts` + `helper.ts` + optionally AGENTS.md)

**Prompt template:** See `AGENT_PROMPTS.md` → Case 2

### Case 3 — New feature (bootstrap 4 files + seed TCs)

**Signal:** Feature doesn't exist

**Action:**
1. Codegen field inventory → `<module>/_locators/<feature>.ts`
2. Codegen full flow → `<module>/_flows/<feature>.ts`
3. QA prepares `<module>/_scenarios/<feature>.csv` with all initial scenarios
4. Choose pattern archetype (Section 8)
5. Run Case 3 → AI generates 4 files with **populated** data.ts

**Files touched:** 4 new files + 3 codegen/scenario files in module

**Prompt template:** See `AGENT_PROMPTS.md` → Case 3

### Decision tree

```
New scenario request
    │
    ├─► Feature exists?
    │     │
    │     ├─► No  ─► Case 3 (bootstrap + seed)
    │     │
    │     └─► Yes ─► Do all step verbs exist in helper?
    │               │
    │               ├─► Yes ─► Case 1 (append to data.ts)
    │               └─► No  ─► Case 2 (extend helper) → then Case 1
```

---

## Section 5: Codegen + Scenarios Workflow

Three artifacts feed into feature generation. Each has different lifecycle and ownership.

### Codegen (`_flows/` + `_locators/`)

**Rule:** AI does not generate raw codegen. Both come from manual Playwright codegen.

**Location:**
- `<module>/_locators/<feature>.ts` — one file per feature, field inventory
- `<module>/_flows/<feature>.ts` — one file per feature, full flow (login → interact → submit)

**Codegen scope:** ONE feature per file. If codegen captures multiple distinct actions with different success criteria, split into multiple `_flows/` files → these become multiple features (Section 1).

**Regenerate when:** UI changes, new fields added, flow steps change

### Scenarios (`_scenarios/*.csv`)

**Rule:** QA writes CSV. Dev may edit but QA owns the source of truth.

**Location:** `<module>/_scenarios/<feature>.csv` — one file per feature

**Format:** 5 columns
```csv
TC-ID,Module,Feature,Scenario,Steps
TC012,Dashboard,Print,Print Job Sheet,"1. Click Print button on a record
2. Select Print option"
TC013,Dashboard,Print,Export Job Sheet to PDF,"1. Click Print button on a record
2. Select PDF option"
```

**Steps column:**
- Multi-line inside quotes
- Numbered prefixes (`1.`, `2.`) for QA readability — AI strips when parsing
- Free-form English, but MUST start with a verb from Section 9 vocabulary

**Regenerate CSV when:** QA adds new scenarios, priorities change. Never overwritten by AI.

### Workflow

1. Dev runs codegen twice — one session for `_locators/`, one for `_flows/`
2. QA writes CSV in `_scenarios/`
3. User invokes Case 3 (or Case 1/2 as appropriate)
4. AI reads:
   - AGENTS.md — pattern rules (Sections 8, 9)
   - `<module>/_flows/<feature>.ts` — sequence
   - `<module>/_locators/<feature>.ts` — fields
   - `<module>/_scenarios/<feature>.csv` — scenarios
5. AI generates/updates the 4 pattern files
6. Human reviews + applies

---

## Section 6: Adding a New Feature Workflow

1. **Codegen** — two sessions
   - Session A: click every field/button once → save `_locators/<feature>.ts`
   - Session B: complete one end-to-end task → save `_flows/<feature>.ts`

2. **Prepare CSV** — QA writes `_scenarios/<feature>.csv` with initial scenarios

3. **Choose pattern archetype** (Section 8)

4. **Choose structure** (flat vs nested — Section 1)

5. **Run Case 3 prompt** (see AGENT_PROMPTS.md)

6. **AI generates:**
   - 4-file skeleton in `<module>/<feature>/`
   - `data.ts` **populated** from CSV rows

7. **Human reviews:**
   - Verify spec.ts flow matches `_flows/`
   - Verify helper.ts step handlers work against the actual page
   - Verify data.ts TCs match CSV

8. **Regenerate JSON cache** — `analyze-project.bat`

9. **Add more TCs later** via Case 1 (append CSV → Case 1 prompt)

---

## Section 7: Decision Trees

### When to add new verify helper

- Pattern used across 3+ specs → extract to `_shared/verify-helpers.ts` (rule of three)
- Pattern used in 1-2 specs → inline in spec

### When to create new AGENTS.md (nested)

- **Never** — this framework is universal by design

### When to extract to `_shared/`

- Helper function used across 3+ specs → extract
- Login/navigation flow used across 3+ specs → extract to `<project>/_shared/`

### When to split a feature into two

- Codegen has two paths with different success criteria → split
- `_scenarios/` CSV has scenarios that can't share the same verify → split

---

## Section 8: 4-File Pattern (Reference)

Every nested feature has 4 files. The **structure** below is fixed. The **content** is derived from that feature's `_flows/`, `_locators/`, and `_scenarios/`.

### Pattern archetypes

| Archetype | Signal | Data shape | Example feature |
|---|---|---|---|
| **A: Search Pattern** (Fill-and-Submit) | User fills fields, submits, verifies result | `controlType`-based union (legacy) OR step-based union | `dashboard/search` (legacy — controlType-based) |
| **B: Action Pattern** (Click-and-Verify) | User clicks action buttons, verifies dialog/download/navigation | Step-based union | `dashboard/print` |

**New features MUST use step-based union.** The `controlType`-based shape (in existing `search` feature) is grandfathered and not required to migrate.

### `<feature>.types.ts` — data shape

**Step-based union (canonical for new features):**

```typescript
export type Step =
  | { action: 'click'; target: string }
  | { action: 'fill'; target: string; value: string }
  | { action: 'select'; target: string; option: string }
  | { action: 'verify'; assertion: string };

export interface <Feature>TestCase {
  testCaseId: string;
  scenario: string;
  steps: Step[];
}
```

**controlType-based union (legacy — do not use for new features):**

```typescript
// See dashboard/search/search.types.ts for reference
export type <Feature>Control =
  | { controlType: 'textbox'; controlIndex: number; value: string }
  | { controlType: 'namedTextbox'; accessibleName: string; value: string }
  | ...;
```

### `<feature>.helper.ts` — step application

**Structure:**
- **Exported function** `apply<Feature>Steps(page, testData)` — entry point called by spec.ts. Loops over `testData.steps` and delegates to `applyStep`.
- **Internal function** `applyStep(page, step)` — switch on `step.action`. Each case:
  1. Locate the target (from `_locators/` reference)
  2. `expect(...).toBeVisible({ timeout })`
  3. Perform the action
  4. Assert state (when applicable)
- **Verify case** — hybrid parser. `step.assertion` is free-form text; helper recognizes patterns (Section 9) and executes matching assertion.
- **Guards** (mandatory):
  - Empty-value guard for `fill` and `select` actions
  - Not-found hint for `click` targets (better error than raw timeout)
  - `never`-type default case in the switch

Feature-specific setup (login, navigation, wait for loading) lives in **spec.ts**, not here.

### `<feature>.spec.ts` — orchestration

**Structure:**
- **Constants** (URL, timeouts specific to feature)
- **Setup helpers derived from `_flows/`**:
  - `waitForLoading(page)` if the feature has loading states
  - `enter<Feature>Page(page)` — navigate + login + reach the feature's page
- **`defaultVerify(page, testData)`** — feature-level default verify. Runs at the end of every test unless the CSV Steps explicitly include a `Verify` step.
- **`test.describe('<Feature Name>', ...)`** wrapping all tests
- **`test.beforeEach`** — calls `enter<Feature>Page`
- **`for (const testData of <feature>TestCases)`** loop — one test per data row
- Each test:
  ```typescript
  await apply<Feature>Steps(page, testData);
  await defaultVerify(page, testData);
  ```

### `<feature>.data.ts` — test cases

**Structure:**
- Import types
- Export const array `<feature>TestCases: <Feature>TestCase[]` with type annotation

**For Case 3 bootstrap:** array is **populated from CSV** — each CSV row → one TestCase.

**For Case 1 expansion:** array grows as CSV grows.

### How the 4 files connect

```
_scenarios/<feature>.csv
        │
        ▼ (Case 3 / Case 1 reads)
data.ts   ──imports types──►   types.ts
   │
   └──consumed by──►   spec.ts   ──imports──►   helper.ts   ──imports types──►   types.ts
                          │
                          └──imports──►   _shared/verify-helpers.ts
```

`_flows/<feature>.ts` and `_locators/<feature>.ts` are **NOT imported** at runtime — they are references AI reads at generation time. `_scenarios/<feature>.csv` is imported ONLY conceptually (AI reads it to populate `data.ts`).

---

## Section 9: Step Vocabulary

QA writes CSV steps in free-form English but MUST start each step with a verb from the frozen list below. Helper parses verbs, everything after the verb is target/value.

### Action verbs (helper handles these)

| Verb | Syntax | Example | Helper action |
|---|---|---|---|
| **Click** | `Click <target>` | `Click Print button on a record` | `page.getByRole('button', { name }).click()` |
| **Fill** | `Fill <target> with <value>` | `Fill Receipt textbox with HQ0000020` | `page.getByRole('textbox', { name }).fill(value)` |
| **Select** | `Select <option> from <target>` OR `Select <option> option` | `Select PDF option` | Open dropdown → click matching option |
| **Verify** | `Verify <assertion>` | `Verify dialog opens` | Hybrid parse — see below |

### Verify sub-verbs (hybrid parser inside `Verify`)

| Sub-verb | Example | Assertion |
|---|---|---|
| `visible` / `opens` / `shows` | `Verify dialog opens` | `expect(el).toBeVisible()` |
| `hidden` / `closes` | `Verify loading closes` | `expect(el).toBeHidden()` |
| `contains` | `Verify page contains HQ0000020` | `expect(page.getByText(text)).toBeVisible()` |
| `downloaded` | `Verify PDF downloaded` | Wait for `download` event |
| `navigated` / `URL matches` | `Verify URL matches /dashboard/` | `expect(page).toHaveURL(pattern)` |

### Extending the vocabulary

If QA writes a step verb not in the list:
1. Case 1 STOPS and reports which verb is unknown
2. User runs Case 2 to add the verb to helper + types + this section
3. Case 1 re-runs successfully

**Never let AI infer new verbs.** New verbs = Case 2 explicitly.

### Feature-level default verify

Each feature has a `defaultVerify` function in spec.ts that runs at the end of every test. It answers "did this feature complete without breaking?" — a safety net.

Examples:
- **Print:** `defaultVerify` = no error dialog + still on dashboard
- **Search:** `defaultVerify` = no error + result count > 0 (or matches expected)
- **Export:** `defaultVerify` = download completed (or file exists in downloads folder)

If a CSV Steps column includes explicit `Verify` steps, those run AS PART OF the steps loop. `defaultVerify` still runs at the end regardless.

---

## Contribution notes

- Update this file when new pattern archetype emerges or new verb is added
- Keep sections concise — AI ignores overly long docs
- Prefer **pointing to reference implementations** over inlining long examples
- Preserve Thai UI labels exactly (don't romanize or translate)
- After adding/removing feature, run `analyze-project.bat` to refresh JSON cache