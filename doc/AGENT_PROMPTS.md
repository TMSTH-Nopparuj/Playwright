# AGENT_PROMPTS.md — Prompt Templates

Ready-to-use prompt templates for AI agents (GitHub Copilot, Claude, Cursor, ChatGPT) working with **ttest-playwright**.

Each case = one template. Copy → fill placeholders → send to agent.

---

## Which case?

| Case | When to use | Files touched |
|---|---|---|
| **Case 1** | Add test case(s) — all step verbs already handled by helper | 1 (`data.ts`) + CSV append |
| **Case 2** | Extend pattern — new step verb encountered | 2-3 (`types.ts` + `helper.ts` + optionally AGENTS.md) |
| **Case 3** | New feature — bootstrap 4 files + seed TCs from CSV | 4 new files + 3 codegen/scenario files |

Full decision tree in `AGENTS.md` Section 4.

---

## Case 1 — Add test case(s) to existing feature

**Use when:** feature exists AND every step verb in new scenarios is already covered by the helper's switch.

**You provide:** Location + additional CSV rows (or path to updated CSV)

**AI does:** Parse each new row's Steps column → generate Step objects → append to `data.ts`

### Template

```markdown
### Case 1 — Add test case(s) to existing feature

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**New scenarios** — either A or B:

**A) Paste CSV rows:**
```
TC-ID,Module,Feature,Scenario,Steps
TC00X,<module>,<feature>,<scenario>,"1. <step>
2. <step>"
```

**B) OR point to CSV file:**
- CSV path: `<module>/_scenarios/<feature>.csv`
- New rows: TC00X onward (previously last was TC00Y)

**Rules**
1. Read `AGENTS.md` Section 9 — step vocabulary
2. Read `<feature>.helper.ts` — verify every step verb has a switch case
3. Read `<feature>.types.ts` — verify Step union covers all verbs
4. Read `<feature>.data.ts` — match existing object shape exactly
5. For each new CSV row:
   a. Parse Steps column into Step[] array
   b. Strip numbering prefix (`1.`, `2.`) — keep verb + rest
   c. Verify every step's verb is in helper's switch — if not, **STOP** and report "Case 2 required — unknown verb '<verb>'"
   d. Verify every `Click` target and `Fill` target exists in `_locators/<feature>.ts` — if not, **STOP** and report "Codegen coverage gap — target '<name>' not in _locators/"
6. Generate one TestCase object per row → append to `data.ts` array
7. Preserve Thai UI text character-for-character
8. Do not touch: `helper.ts`, `spec.ts`, `types.ts`, `_locators/*`, `_flows/*`, existing CSV rows

**Output**
- Full modified `<feature>.data.ts`
- Per TC note: "TC00X — <N> steps parsed, verbs: <verb list>"
```

### Example — filled in

```markdown
### Case 1 — Add test case(s) to existing feature

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

**New scenarios**

CSV rows to add:
```
TC-ID,Module,Feature,Scenario,Steps
TC015,Dashboard,Print,Print with Dealer Filter,"1. Fill Dealer textbox with DEALER001
2. Click Search button
3. Click Print button on a record
4. Select Print option"
TC016,Dashboard,Print,Export with Date Range,"1. Fill Coverage Start Date with 01/01/2024
2. Fill Coverage End Date with 31/12/2024
3. Click Search button
4. Click Print button on a record
5. Select PDF option
6. Verify PDF downloaded"
```
```

### Expected AI behavior

For TC015: 4 steps parsed → verbs `Fill`, `Click`, `Click`, `Select` → all in helper → OK → generate:

```typescript
{
  testCaseId: 'TC015',
  scenario: 'Print with Dealer Filter',
  steps: [
    { action: 'fill', target: 'Dealer textbox', value: 'DEALER001' },
    { action: 'click', target: 'Search button' },
    { action: 'click', target: 'Print button on a record' },
    { action: 'select', option: 'Print', target: 'Print options' },
  ],
}
```

For TC016: 6 steps → last step is `Verify PDF downloaded` → recognized (Section 9 verify sub-verbs) → generate `{ action: 'verify', assertion: 'PDF downloaded' }`.

### Stop conditions

| Signal | Report | Next case |
|---|---|---|
| Step verb not in Section 9 vocabulary | "Case 2 required — unknown verb '<verb>' in TC<N>" | Case 2 |
| `Click` / `Fill` target not in `_locators/` | "Codegen coverage gap — '<target>' not found. Re-codegen `_locators/<feature>.ts` first." | Manual fix |
| Feature folder does not exist | "Case 3 required — feature '<name>' does not exist" | Case 3 |
| `data.ts` uses legacy `controlType`-based shape | "Feature uses legacy shape. Either edit data.ts manually OR run Case 3 to regenerate with step-based shape." | Manual |

### Why AI is forbidden from inferring new verbs

AI inferring new verbs = pattern drift + hallucination risk. If QA writes "Upload file X" and helper has no `upload` case, the correct path is:
1. STOP
2. Case 2 adds `upload` action to helper + types + AGENTS.md Section 9
3. Return to Case 1

Never let AI silently add a new verb.

---

## Case 2 — Extend pattern (new step verb)

**Use when:** Case 1 STOPPED with "unknown verb '<verb>'". Requires adding a new action to the feature's helper + types.

**You provide:** Location + new verb + syntax + example step

**AI does:** Extend `types.ts` Step union + add case to `helper.ts` switch + optionally update AGENTS.md Section 9

### Template

```markdown
### Case 2 — Extend pattern (new step verb)

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**New verb**
- Verb: <verb>   (e.g. Upload, Drag, Hover)
- Syntax: <verb> <syntax>   (e.g. "Upload <file> to <target>")
- Example step: <full example from CSV>
- Playwright API: <how to implement>   (e.g. "page.setInputFiles(target, file)")

**Rules**
1. Read `AGENTS.md` Section 8 and Section 9
2. Read `<feature>.types.ts` — extend the Step union with the new action variant
3. Read `<feature>.helper.ts` — add a new case to the `applyStep` switch
   - Include: locator lookup, visibility check, action, state assertion
   - Include guards: empty-value guard (if applicable), not-found hint
4. Update `AGENTS.md` Section 9 — add verb to the action verbs table
5. Do NOT add test cases to `data.ts` — Case 2 only extends the pattern. TCs come via Case 1 next.

**Output**
- Modified `<feature>.types.ts` (Step union extended)
- Modified `<feature>.helper.ts` (switch case added)
- Modified `AGENTS.md` (Section 9 updated)
- Brief note: "Verb '<verb>' added — Case 1 can now handle scenarios using this verb"
```

### Example — filled in

```markdown
### Case 2 — Extend pattern (new step verb)

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

**New verb**
- Verb: Upload
- Syntax: Upload <file path> to <target>
- Example step: `Upload report.pdf to attachment field`
- Playwright API: `page.locator(target).setInputFiles(filePath)`
```

### Stop conditions

| Signal | Report |
|---|---|
| Verb already exists in Section 9 | "Verb '<verb>' already handled — check spelling/casing" |
| Playwright API not specified | "Cannot implement without knowing the Playwright API for this action" |

---

## Case 3 — New feature (bootstrap 4 files + seed TCs)

**Use when:** feature does not exist yet. Codegen + CSV are prepared. Goal: create 4-file feature with populated data.ts ready to run.

**You provide:** Location + pattern archetype + CSV path + feature-level default verify

**AI generates:** 4 files with data.ts populated from CSV

**Precondition (dev/QA prepare BEFORE prompting):**
- `<module>/_flows/<feature>.ts` — full flow codegen
- `<module>/_locators/<feature>.ts` — field inventory codegen
- `<module>/_scenarios/<feature>.csv` — scenarios written by QA

### Template

```markdown
### Case 3 — New feature (bootstrap)

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**Structure**
- flat | nested   (see AGENTS.md Section 1 criteria)

**Pattern archetype**
- A: Search Pattern (Fill-and-Submit) | B: Action Pattern (Click-and-Verify)
  → See AGENTS.md Section 8. New features use step-based union regardless of archetype.

**Precondition files**
- `<module>/_flows/<feature>.ts` — codegen ready
- `<module>/_locators/<feature>.ts` — codegen ready
- `<module>/_scenarios/<feature>.csv` — scenarios ready

**Feature-level default verify** (runs at end of every test)
- <describe what "success" looks like for this feature>
- e.g. "no error dialog visible + still on /dashboard URL"

**Rules**
1. Read `AGENTS.md` Section 8 (pattern) and Section 9 (step vocabulary)
2. Read `<module>/_flows/<feature>.ts` — extract flow sequence for spec.ts setup
3. Read `<module>/_locators/<feature>.ts` — extract field/button inventory
4. Read `<module>/_scenarios/<feature>.csv` — parse every row into a TestCase
5. Generate 4 files in `<module>/<feature>/`:
   - **`<feature>.types.ts`** — step-based Step union + <Feature>TestCase interface
   - **`<feature>.helper.ts`** — apply<Feature>Steps + applyStep switch (one case per verb used in CSV) + guards + never default
   - **`<feature>.spec.ts`** — setup helpers derived from `_flows/` + describe + beforeEach + for-loop + defaultVerify + test body calling apply<Feature>Steps then defaultVerify
   - **`<feature>.data.ts`** — Populated array: one TestCase per CSV row
6. For each CSV row:
   a. Parse Steps into Step[] array (strip `1.`, `2.` prefixes)
   b. Verify every verb is in Section 9 vocabulary — if any missing, **STOP** and report
   c. Verify every `Click`/`Fill` target exists in `_locators/` — if not, **STOP** and report
7. Setup helpers in spec.ts MUST derive from `_flows/`
8. Verification via `_shared/verify-helpers.ts` when applicable
9. Guards required in helper.ts:
   - Empty-value guard for `fill` and `select`
   - Not-found hint for `click` targets
   - `never`-type default case
10. Preserve Thai UI text character-for-character

**Output**
- 4 new files in `<module>/<feature>/`
- Per file note:
  - `types.ts`: "Step union covers <N> verbs: <list>"
  - `helper.ts`: "<N> switch cases + guards + defaultVerify contract"
  - `spec.ts`: "flow derived from _flows/ — <N> setup helpers"
  - `data.ts`: "<M> TCs seeded from CSV"
- Next-step reminder: "Feature ready to run. Use Case 1 to append more TCs later."
```

### Example — filled in

```markdown
### Case 3 — New feature (bootstrap)

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

**Structure**
- nested

**Pattern archetype**
- B: Action Pattern (Click-and-Verify)

**Precondition files**
- `dashboard/_flows/print.ts` — ready
- `dashboard/_locators/print.ts` — ready
- `dashboard/_scenarios/print.csv` — ready with TC012-TC014

**Feature-level default verify**
- No error dialog visible
- URL still matches /dashboard/
```

### Expected AI behavior

For the example above, AI will:

**1. Read pattern reference** — AGENTS.md Section 8 (Action Pattern) + Section 9 (verbs)

**2. Read `_flows/print.ts`** — extract:
- Login sequence (already covered by beforeEach)
- Reach dashboard sequence
- Feature-specific setup: `clearFilters`, `clickSearch` (from flow)

**3. Read `_locators/print.ts`** — extract available buttons/fields

**4. Read `_scenarios/print.csv`** and parse each row:

```
TC012 — Print Job Sheet — 2 steps
TC013 — Export Job Sheet to PDF — 2 steps
TC014 — Print Compulsory Insurance Table — 2 steps
```

**5. Generate `print.types.ts`:**

```typescript
export type Step =
  | { action: 'click'; target: string }
  | { action: 'select'; option: string; target: string };

export interface DashboardPrintTestCase {
  testCaseId: string;
  scenario: string;
  steps: Step[];
}
```

(Only 2 verbs used in CSV → union has 2 variants)

**6. Generate `print.helper.ts`** — 2 switch cases + guards + never default + defaultVerify contract

**7. Generate `print.spec.ts`** — setup helpers from `_flows/`, defaultVerify per user's description

**8. Generate `print.data.ts`:**

```typescript
export const dashboardPrintTestCases: DashboardPrintTestCase[] = [
  {
    testCaseId: 'TC012',
    scenario: 'Print Job Sheet',
    steps: [
      { action: 'click', target: 'Print button on a record' },
      { action: 'select', option: 'Print', target: 'Print options' },
    ],
  },
  {
    testCaseId: 'TC013',
    scenario: 'Export Job Sheet to PDF',
    steps: [
      { action: 'click', target: 'Print button on a record' },
      { action: 'select', option: 'PDF', target: 'Print options' },
    ],
  },
  {
    testCaseId: 'TC014',
    scenario: 'Print Compulsory Insurance Table',
    steps: [
      { action: 'click', target: 'Print Compulsory button' },
      { action: 'select', option: 'Print', target: 'Print options' },
    ],
  },
];
```

### Stop conditions

| Signal | Report |
|---|---|
| Any precondition file missing | "Precondition missing — <file>. Prepare before running Case 3." |
| CSV has verb not in Section 9 | "Unknown verb '<verb>' in <TC>. Run Case 2 first to add this verb OR remove that row from CSV." |
| CSV target not in `_locators/` | "Target '<name>' from CSV not found in _locators/. Re-codegen or fix CSV." |
| Feature folder already exists | "Feature already exists — use Case 1 to add TCs or Case 2 to extend pattern." |

### Why data.ts is populated (not empty)

Earlier design (v2) kept `data.ts` empty. This required a follow-up Case 2 to seed the first TC, which added friction with no benefit — CSV already has values from QA, so AI can populate directly without hallucination risk.

The hallucination risk only appears when AI is asked to invent values. Here AI only **transcribes** from CSV — value-preserving, not value-generating.

### Why AGENTS.md pattern > reference feature

Peeking at an existing feature (say, `search/`) risks copying:
- Project-specific navigation (TMSTH Staff → Hongqi selection)
- Legacy data shape (controlType-based instead of step-based)
- Feature-specific verification

AGENTS.md Section 8 describes the pattern **abstractly**. Content comes from `_flows/`, `_locators/`, and `_scenarios/` of THIS feature.

---

## Changelog

- 2026-09-20 (v3) — Step-based union canonical for new features. CSV workflow via `_scenarios/`. Case 3 now seeds TCs from CSV (no more empty data.ts). Case 2 = new verb (was: new field). Case 1 = append rows (was: direct match).
- 2026-09-20 (v2) — Case 1 tightened (direct match only). Case 3 introduced with empty data.ts. `_flows/` convention added.
- 2026-09-19 (v1) — Case 1 finalized. Case 2/3 placeholder.