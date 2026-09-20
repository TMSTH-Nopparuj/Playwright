# AGENT_PROMPTS.md — Prompt Templates

Ready-to-use prompt templates for AI agents (GitHub Copilot, Claude, Cursor, ChatGPT) working with **ttest-playwright**.

Each case = one template. Copy → fill placeholders → send to agent.

---

## Which case?

| Case | When to use | Files touched |
|---|---|---|
| **Case 1** | Update test cases — `_locators/` snippets changed or CSV rows appended | 2 (`helper.ts` locator array + `data.ts`) |
| **Case 2** | New action pattern in `_flows/` — helper switch doesn't handle it | 2-3 (`helper.ts` + `types.ts` + optionally AGENTS.md) |
| **Case 3** | New feature — bootstrap all 4 files (Phase 1 + Phase 2) | 4 new files |

Full decision tree in `AGENTS.md` Section 4.

---

## Universal principles

**AI does not generate selectors.** All Playwright selectors come from dev's codegen in `_flows/` and `_locators/`. AI's job is to **transcribe** into the 4-file pattern, not to invent.

**Order is the source of truth.** `_locators/` snippet at index N ↔ CSV row at index N ↔ helper's locators array at index N. No name matching, no translation.

**Snippet count and CSV row count MUST match.** Mismatch = STOP + report.

---

## Case 1 — Update test cases

**Use when:** Feature exists. Dev updated `_locators/` snippets, OR QA updated `_scenarios/*.csv`. Test data needs to be regenerated.

**You provide:** Location

**AI does:**
- Read updated `_locators/` + CSV
- Verify count matches
- Regenerate helper's `locators` array (transcribe snippets)
- Regenerate `data.ts` (transcribe CSV rows)
- Verify every CSV `Action` value has a case in helper's switch (else STOP)

**AI does NOT touch:** `spec.ts`, `types.ts`

### Template

```markdown
### Case 1 — Update test cases

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**Rules**
1. Read `AGENTS.md` Section 8 + Section 9
2. Read `<module>/_locators/<feature>.ts` — get snippets ordered by TC-ID
3. Read `<module>/_scenarios/<feature>.csv` — get rows in CSV order
4. Verify snippet count == CSV row count. If mismatch → **STOP** and report:
   - "Count mismatch: N snippets in _locators/, M CSV rows"
   - Which side has extras (which TC-IDs are missing where)
5. Read `<feature>.types.ts` — get valid Action union values
6. For each CSV row, verify `Action` value is in the union. If any not in union → **STOP** and report:
   - "Case 2 required — action '<value>' not in types union"
7. Regenerate `<feature>.helper.ts` locators array:
   - Wrap each `_locators/` snippet as `async (page) => { <snippet> }`
   - Keep `// TC<ID>` comment above each entry
   - Preserve snippet code character-for-character (no rewrites)
8. Regenerate `<feature>.data.ts`:
   - One TestCase object per CSV row
   - `locatorIndex` = 0-based row position
   - `action` from CSV Action column
   - `testCaseId` + `scenario` from CSV
9. Do NOT touch: `spec.ts`, `types.ts`, `_locators/*`, `_flows/*`, CSV

**Output**
- Modified `<feature>.helper.ts` (locators array section)
- Modified `<feature>.data.ts` (full replacement)
- Report: "<N> TCs regenerated. Actions used: <list>."
```

### Stop conditions

| Signal | Report |
|---|---|
| Snippet count ≠ CSV row count | "Count mismatch: N snippets, M rows. Missing TCs in <side>: <list>." |
| CSV `Action` value not in types union | "Case 2 required — action '<value>' not handled. Add case to helper first." |
| `_locators/` missing TC-ID comments | "Cannot verify order — snippets missing TC-ID markers. Fix codegen file." |
| Feature folder does not exist | "Case 3 required — feature does not exist" |

---

## Case 2 — Extend pattern (new action type)

**Use when:** Dev added a new interaction pattern in `_flows/` TEST ACTIONS section that helper's switch doesn't handle.

**You provide:** Location + pattern name + `_flows/` reference lines + Playwright API notes

**AI does:**
- Add case to helper switch
- Add variant to types.ts Action union
- Update AGENTS.md Section 9 patterns table

### Template

```markdown
### Case 2 — Extend pattern (new action type)

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**New pattern**
- Name: <camelCase name>   (e.g. dragAndDrop, uploadFile)
- Description: <one line>
- `_flows/` reference: <line numbers or paste the pattern block>
- Playwright API to use: <e.g. page.setInputFiles(target, file)>

**Rules**
1. Read `AGENTS.md` Section 8 and Section 9
2. Read `<feature>.types.ts` — extend the Action union with the new literal
3. Read `<feature>.helper.ts` — add a new case to the switch:
   - Fetch locator by index
   - Execute pattern using Playwright API (transcribe from `_flows/`)
   - Include appropriate wait/state assertion
4. Update `AGENTS.md` Section 9 — add row to canonical patterns table
5. Do NOT touch: `spec.ts`, `data.ts`, `_locators/*`, `_flows/*`

**Output**
- Modified `<feature>.types.ts`
- Modified `<feature>.helper.ts`
- Modified `AGENTS.md`
- Report: "Pattern '<name>' added — Case 1 can now handle rows with Action='<name>'."
```

### Stop conditions

| Signal | Report |
|---|---|
| Pattern name already in union | "Pattern '<name>' already handled" |
| Playwright API unclear from `_flows/` | "Cannot infer implementation — provide explicit API in prompt" |

---

## Case 3 — New feature (bootstrap all 4 files)

**Use when:** Feature doesn't exist. All 3 precondition files are prepared. Goal: 4-file feature ready to run.

**You provide:** Location + structure choice + feature-level default verify

**AI does 2 phases:**
- **Phase 1** — Read `_flows/` → generate `spec.ts`, `helper.ts` (empty locators array + switch cases), `types.ts`
- **Phase 2** — Read `_locators/` + CSV → populate helper's locators array + generate `data.ts`

### Preconditions (dev/QA prepare BEFORE prompting)

- `<module>/_flows/<feature>.ts` — MUST have `// === SETUP ===` and `// === TEST ACTIONS ===` markers
- `<module>/_locators/<feature>.ts` — MUST have `// TC<ID>` comments before each snippet, in CSV order
- `<module>/_scenarios/<feature>.csv` — MUST match `_locators/` snippet count and order

### Template

```markdown
### Case 3 — New feature (bootstrap)

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**Structure**
- flat | nested   (see AGENTS.md Section 1)

**Feature-level default verify** (runs at end of every test)
- <describe what "success" looks like>
- e.g. "no error dialog visible + URL still matches /dashboard/"

**Precondition files** (all must exist)
- `<module>/_flows/<feature>.ts` — with SETUP / TEST ACTIONS markers
- `<module>/_locators/<feature>.ts` — with TC-ID markers
- `<module>/_scenarios/<feature>.csv` — rows match _locators/ count + order

**Rules**

**Precondition verification:**
1. Verify all 3 precondition files exist. If any missing → **STOP** and report.
2. Verify `_flows/` has `// === SETUP ===` and `// === TEST ACTIONS ===` markers. If missing → **STOP**.
3. Verify `_locators/` has TC-ID comments. If missing → **STOP**.
4. Verify `_locators/` snippet count == CSV row count. If mismatch → **STOP** and report which side has extras.
5. Verify feature folder does NOT already exist. If exists → **STOP** (use Case 1 instead).

**Phase 1 — Generate spec.ts + helper.ts (structure) + types.ts:**
6. Read `AGENTS.md` Section 8 and Section 9
7. Read `<module>/_flows/<feature>.ts`:
   - SETUP section → transcribe into `enter<Feature>Page` helper in spec.ts
   - TEST ACTIONS section → identify each pattern (Section 9 canonical list)
8. For each identified pattern:
   - If in Section 9 → note the name (e.g., `click`, `download`, `clickWithClose`)
   - If NOT in Section 9 → **STOP** and report "Case 2 required — new pattern: <description>"
9. Generate `<feature>.types.ts`:
   - Action union with one string literal per identified pattern
   - TestCase interface with `testCaseId`, `scenario`, `action`, `locatorIndex`
10. Generate `<feature>.helper.ts` structure:
    - Empty `locators` array (populated in Phase 2)
    - `applyAction` switch — one case per identified pattern (from TEST ACTIONS)
    - Each case: fetch locator by index, execute pattern (transcribe from _flows/), never default
    - Export `apply<Feature>Action` public function
11. Generate `<feature>.spec.ts`:
    - Transcribe `_flows/` SETUP into `enter<Feature>Page` (literal transcription, insert `waitForLoading` where flow shows loading states)
    - `defaultVerify` per user's description
    - `test.describe` + `beforeEach` + `for` loop over test cases

**Phase 2 — Populate locators array + generate data.ts:**
12. Read `<module>/_locators/<feature>.ts` — collect snippets in file order with TC-IDs
13. Read `<module>/_scenarios/<feature>.csv` — collect rows in file order
14. Verify each CSV `Action` value has a matching case in helper's switch. If any missing → **STOP** and report.
15. Populate `<feature>.helper.ts` `locators` array:
    - One entry per snippet, in file order
    - Wrap each snippet as `async (page) => { <snippet code> }`
    - Preserve TC-ID comment above each entry
    - Transcribe snippet character-for-character (no rewrites)
16. Generate `<feature>.data.ts`:
    - One TestCase object per CSV row
    - `locatorIndex` = 0-based row position (matches snippet position)
    - `action` from CSV Action column
    - `testCaseId` + `scenario` from CSV

**Output**
- 4 new files in `<module>/<feature>/`
- Report per file:
  - `types.ts`: "Action union: <list>"
  - `helper.ts`: "<N> switch cases + <M> locators"
  - `spec.ts`: "SETUP transcribed: <N> steps"
  - `data.ts`: "<M> TCs generated"
- Sanity check: "All CSV Actions match switch cases: yes"
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

**Feature-level default verify**
- No error dialog visible on page
- URL still matches /dashboard/

**Precondition files**
- `dashboard/_flows/print.ts` — ready with markers
- `dashboard/_locators/print.ts` — ready with TC markers
- `dashboard/_scenarios/print.csv` — 3 rows (TC001, TC002, TC003)
```

### Stop conditions

| Signal | Report |
|---|---|
| Precondition file missing | "Precondition missing — <file>" |
| `_flows/` markers missing | "Add `// === SETUP ===` and `// === TEST ACTIONS ===` markers" |
| `_locators/` TC-IDs missing | "Add `// TC<ID>` comments before each snippet" |
| Snippet count ≠ CSV rows | "Count mismatch: N snippets, M rows" |
| Pattern in TEST ACTIONS not in Section 9 | "Case 2 required — new pattern: <description>" |
| Feature folder exists | "Feature exists — use Case 1 to update TCs" |
| CSV Action not in identified patterns | "CSV Action '<value>' doesn't match any TEST ACTIONS pattern" |

### Why 2 phases in one prompt

- Phase 1 alone gives 3 files with empty locators (can't run tests)
- Phase 2 alone requires Phase 1 files to exist
- Combining them in Case 3 = one-shot bootstrap ready to run
- Case 1 handles Phase 2 alone for later updates (much more common)

### Why AI does not match by name

Order is deterministic. Name matching would require translation guessing (English CSV vs Thai codegen), which caused hallucination bugs in earlier versions. `_locators/` position N ↔ CSV row N ↔ `data.ts` `locatorIndex: N`.

TC-ID comments are audit trail for humans, not the mechanism. AI cross-checks CSV TC-ID against `_locators/` TC-ID comment as a safety check — if mismatch → STOP.

### Why data.ts is populated (not empty)

CSV already has scenario names + actions from QA. AI transcribes deterministically. No hallucination risk because AI doesn't invent — it copies.

---

## Changelog

- 2026-09-20 (v4) — Snippet-based model. Case 1 = update TCs (Phase 2 alone). Case 2 = extend action pattern. Case 3 = full bootstrap (Phase 1 + 2). AI never generates selectors — only transcribes from `_flows/` and `_locators/`. Order is source of truth (no name matching).
- 2026-09-20 (v3.1) — Universal locator rules L1-L3, Setup steps field, Rule 11.
- 2026-09-20 (v3) — Step-based union, CSV workflow.
- 2026-09-20 (v2) — Case 1 direct match only. Case 3 empty data.ts.
- 2026-09-19 (v1) — Case 1 finalized. Case 2/3 placeholder.