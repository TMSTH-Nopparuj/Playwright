### Case 1 — Add test case(s) to existing feature

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search

**Scenarios to add** (from QA Excel)
| TC-ID | Scenario | Value | Expected |
|-------|----------|-------|----------|
| TC001 | Search by Receipt Number | HQ0000020 | HQ0000020 |
| TC002 | Search by Insured Name | Harry | Harry |
| TC003 | Search by Coverage Start Date | 10 | 10 |
| TC004 | Search by Coverage End Date | 30 | 30 |
| TC005 | Search by Transaction Status | งานใหม่ | งานใหม่ |
| TC006 | Search by Car Model | E-HS9 | E-HS9 |
| TC007 | Search by Chassis Number | 1HGBH41JXMN109186 | 1HGBH41JXMN109186 |
| TC008 | Search with Multiple Filters | "" | "" |

**Rules**
1. Read `AGENTS.md` and `.agent-cache/project-structure.json`
2. Locate feature path from JSON
3. Read the 3 pattern files:
   - `search.types.ts` — supported controlTypes union
   - `search.helper.ts` — how each controlType is handled
   - `search.data.ts` — existing scenario → control mappings
4. For each new scenario, infer control config in this order:
   a. **Direct match** — same or near-identical scenario name exists in `data.ts` → copy its `control` block as-is
   b. **Inferred match** — scenario name maps to a field defined in `dashboard/_locators/search.ts` AND `helper.ts` handles that controlType → build control block from locator
   c. **No match** → **STOP** and report: "Case 2 or 3 required — scenario '<name>' cannot be mapped to existing pattern"
5. Change ONLY: `testCaseId`, `scenario`, `value`, `expectedText`
6. Preserve Thai UI labels character-for-character (no romanize, no translate, no trim)
7. Modify ONLY `search.data.ts` — append at end of test cases array
8. Do not touch: `helper.ts`, `spec.ts`, `types.ts`, `_locators/*`
9. Modify ONLY `search.data.ts` — append at end of test cases array
10. Do not touch: `helper.ts`, `spec.ts`, `types.ts`, `_locators/*`, `_flows/*`

**Output**
- Full modified `search.data.ts`
- Per TC note: "TC00X inferred from <source> (control: <type> / <identifier>)"
  - source = "direct match TC00Z" | "locators + helper case '<type>'"