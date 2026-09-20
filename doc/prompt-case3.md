### Case 3 — New feature (bootstrap)

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

**Structure**
- flat | nested   (see AGENTS.md Section 1 criteria; if unsure, ask AI to recommend)

**Precondition files** (dev prepared via codegen)
- `dashboard/_flows/print.ts` — full flow
- `dashboard/_locators/print.ts` — field inventory

**Seed example** (helper's first case)
- Field label (as shown in UI): <thai label>
- Control type: textbox | dateTextbox | dropdown | namedTextbox | namedDropdown | <new>
- Why chosen: <e.g., "primary search field", "simplest to verify">

**Rules**
1. Read `AGENTS.md` Section 8 — 4-file pattern (this is the STRUCTURE reference)
2. Read `dashboard/_flows/print.ts` — extract full flow sequence
3. Read `dashboard/_locators/print.ts` — extract field inventory
4. (Optional) Peek at any existing feature under `Test-Local/` for STRUCTURE only
   — do NOT copy business logic, project-specific flows, or verification steps
   — structure means: file layout, function signatures, import order, switch shape
5. Generate 4 files in `dashboard/print/`:
   - **`print.types.ts`** — union with the seed control type + TestCase interface
   - **`print.helper.ts`** — apply function + switch with 1 seed case + guards + never default
   - **`print.spec.ts`** — setup helpers derived from `_flows/` + describe + beforeEach + for-loop
   - **`print.data.ts`** — EMPTY array with type annotation (no test cases)
6. Setup helpers in spec.ts MUST derive from `_flows/print.ts` — do not invent flow steps
7. Verification MUST use `_shared/verify-helpers.ts` when applicable (see AGENTS.md Section 2)
8. Guards required in helper.ts:
   - Empty-value guard for dropdown-type controls
   - Not-found hint for named-lookup controls (better error than raw timeout)
   - `never`-type default case
9. Preserve Thai UI text character-for-character
10. **Do NOT seed any test case in data.ts** — array must be empty. Test cases are added via Case 1 or Case 2.

**Output**
- 4 new files in `dashboard/print/`
- Brief note per file:
  - `types.ts`: "1 control type in union — <name>"
  - `helper.ts`: "1 case implemented — <name>, guards added"
  - `spec.ts`: "flow derived from _flows/ — <N> setup helpers, <M> test steps"
  - `data.ts`: "empty skeleton, ready for Case 1/2"
- Next-step reminder: "Use Case 2 to seed first test case, or Case 1 if scenario matches the seed example"