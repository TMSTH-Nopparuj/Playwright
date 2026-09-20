### Case 3 — New feature (bootstrap)

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

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