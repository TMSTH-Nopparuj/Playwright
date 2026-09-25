# Case 5 — Generate Scenarios CSV (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

**Purpose:** Generate `_scenarios/<feature>.csv` from scenario:value pairs.

**Does one thing only:** Reads locator count → validates scenarios → writes CSV.
No file conversion. Locators must be in array format.

---

## What the user paste looks like

```markdown
### Case 5 — Generate scenarios CSV

Read: #file:doc/prompts/case-5-csv.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**Scenarios**
<Scenario name 1> : <value 1>
<Scenario name 2> : <value 2>
...
```

AI extracts Location + Scenarios from user prompt. AI reads N from `_locators/<feature>.ts` on disk.

---

## Preconditions

**`_locators/<feature>.ts` MUST exist AS ARRAY FORMAT (Format B).**

Expected structure:
```typescript
import type { Locator, Page } from '@playwright/test';

export const <feature>Locators: Array<(page: Page) => Locator> = [
  (page) => <locator 1>,
  (page) => <locator 2>,
  ...
];
```

If the file is not in array format → **STOP** and report.

---

## Scenario format

Each scenario is one line:

```
<Scenario name> : <value>
```

**Separator:** ` : ` (space + colon + space)

**Value format:**
- Comma-separated items, position matches `_locators/` order
- **Item count MUST equal N** (locator array length)
- Empty items (`,,`) = skip that locator
- Plain text = fill/select at that locator
- `|<action>` prefix = action (e.g., `|click`) at that locator

**Comma count rule:** N locators → value string MUST have N - 1 commas.

### Examples

For a feature with **N = 3 locators**:

**Button click at position 0:**
```
Print Job Sheet : |click,,
```

**Button click at position 1:**
```
Export Excel : ,|click,
```

For a feature with **N = 12 locators**:

**Fill at position 0:**
```
Search by Receipt Number : HQ0000020,,,,,,,,,,,
```

**Fill at position 2 (skip 0, 1):**
```
Search by Coverage Start Date : ,,10,,,,,,,,,
```

---

## Scope

- **DO NOT open interactive input dialogs asking the user to paste content.** All required content is on disk. READ files directly.
- Generate 1 file: `_scenarios/<feature>.csv`
- If CSV exists → auto-delete and regenerate
- `_flows/`, `_locators/`, feature folder, spec/helper/types/data are READ-ONLY — DO NOT modify
- DO NOT run tests, terminal commands, or scripts.
- DO NOT convert raw codegen — if `_locators/` is not array format, STOP.

---

## Rules

Execute in this order.

### Precondition verification

1. Verify user prompt has `**Scenarios**` block. If missing → **STOP** and report.

2. **READ** the file `_locators/<feature>.ts` at:
   `Test-Local/<project>/<access-flow>/<module>/_locators/<feature>.ts`
   
   **CRITICAL DIRECTIVES:**
   - You MUST read the file DIRECTLY using file tools.
   - DO NOT ask the user to paste the file content.
   - DO NOT open an interactive input dialog requesting information.
   - The file exists on disk — READ IT.
   
   If the file cannot be read → **STOP** and report:
   ```
   Cannot read _locators/<feature>.ts. File missing or inaccessible.
   ```

3. Verify file is Format B (array):
   - Content MUST have `export const <feature>Locators: Array<(page: Page) => Locator>`
   - If not → **STOP** and report:
     ```
     _locators/<feature>.ts is not in array format.
     Expected: export const <feature>Locators: Array<(page: Page) => Locator> = [...]
     ```

### Count locators

4. Parse the array in `_locators/<feature>.ts`.
   Count entries → N.

### Parse Scenarios block

5. For each scenario line: split on ` : ` (space + colon + space) → `[scenario_name, value_string]`
   Trim whitespace. Skip empty lines.
   If any line missing ` : ` → **STOP** and report line number.

6. For each parsed scenario:
   - Count items in `value_string.split(',')` = M
   - **If M ≠ N → STOP** and report:
     ```
     Scenario '<name>' has <M> items, expected <N>.
     _locators/<feature>.ts has <N> locators. Value must have exactly <N-1> commas.
     ```

### Generate CSV

7. Delete existing `_scenarios/<feature>.csv` if present.

8. Generate `Test-Local/<project>/<access-flow>/<module>/_scenarios/<feature>.csv`:
   
   ```csv
   TC-ID,Module,Feature,Scenario,Value
   TC001,<Module>,<Feature>,<Scenario name 1>,"<value 1>"
   TC002,<Module>,<Feature>,<Scenario name 2>,"<value 2>"
   ...
   ```
   
   - Auto-assign TC-ID: `TC001`, `TC002`, ...
   - `<Module>` from Location's Module (preserve case)
   - `<Feature>` from Location's Feature, capitalized (e.g., `print` → `Print`)
   - Value column MUST be wrapped in double quotes `"..."`
   - Preserve `|<action>` markers exactly
   - Preserve Thai/Unicode characters

### Verify output

9. **Verify each CSV row (in-conversation only — NO tools):**
   - For each row, count commas in Value column by inspection
   - **DO NOT run terminal, PowerShell, bash, regex tools, scripts, or any tool for this check**
   - **DO NOT read the file back with a tool — trust what you just wrote**
   - Assert `comma_count === N - 1` (which gives N items when split)
   - Report each row inline: "TC001: <N-1> commas ✓"
   - If ANY row fails → **STOP** and report:
     ```
     Row TC<ID> has <M> items in Value, expected <N>.
     ```

---

## Output

- New `_scenarios/<feature>.csv`
- Report:
  - "<N> locators counted from _locators/"
  - "<X> scenarios generated"
  - "All rows have <N> items in Value: verified"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Scenarios block missing | `"Scenarios block required"` |
| `_locators/` missing | `"Cannot read _locators/<feature>.ts. File missing or inaccessible."` |
| `_locators/` not array format | `"_locators/ not in array format."` |
| Scenario line missing ` : ` | `"Line <N> missing ' : ' separator"` |
| Scenario item count ≠ locator count | `"Scenario '<name>' has <M> items, expected <N>."` |
| Verification failed | `"Row TC<ID> has <M> items in Value, expected <N>"` |

---

## Example — Print feature

**Precondition file** `_locators/print.ts` (Format B, already converted by Case 4):

```typescript
import type { Locator, Page } from '@playwright/test';

export const printLocators: Array<(page: Page) => Locator> = [
  (page) => page.getByRole('button', { name: 'ใบแจ้งงาน' }).first(),
  (page) => page.getByRole('button', { name: ' Export Excel' }),
  (page) => page.getByRole('button', { name: 'ปริ้นท์ พ.ร.บ' }).first(),
];
```

**User paste:**

```markdown
### Case 5 — Generate scenarios CSV

Read: #file:doc/prompts/case-5-csv.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: print

**Scenarios**
Print Job Sheet : |click,,
Export Excel : ,|click,
Print Compulsory Insurance : ,,|click
```

**AI process:**
- Read `_locators/print.ts` → verify Format B ✓
- Count N = 3
- Parse 3 scenarios → each has 3 items → verified

**Generates `_scenarios/print.csv`:**

```csv
TC-ID,Module,Feature,Scenario,Value
TC001,Dashboard,Print,Print Job Sheet,"|click,,"
TC002,Dashboard,Print,Export Excel,",|click,"
TC003,Dashboard,Print,Print Compulsory Insurance,",,|click"
```

**Report:**
```
3 locators counted
3 scenarios generated
All rows have 3 items in Value: verified
```

---

## Example — Search feature

**Precondition file** `_locators/search.ts` (Format B, 12 locators)

**User paste:**

```markdown
### Case 5 — Generate scenarios CSV

Read: #file:doc/prompts/case-5-csv.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search

**Scenarios**
Search by Receipt Number : HQ0000020,,,,,,,,,,,
Search by Coverage Start Date : ,,10,,,,,,,,,
Search by Coverage End Date : ,,,30,,,,,,,,
Search by Transaction Status : ,,,,,,งานใหม่,,,,,
Search by Insured Name : ,Harry,,,,,,,,,,
Search by Car Model : ,,,,,,,,,,,E-HS9
Search by Chassis Number : ,,,,,,,,,,1HGBH41JXMN109186,
Search with Multiple Filters : HQ0000020,Harry,,,,,,,,,,
```

**AI process:**
- Read `_locators/search.ts` → verify Format B ✓ → N = 12
- Parse 8 scenarios → each has 12 items → verified

**Generates `_scenarios/search.csv`:**

```csv
TC-ID,Module,Feature,Scenario,Value
TC001,Dashboard,Search,Search by Receipt Number,"HQ0000020,,,,,,,,,,,"
TC002,Dashboard,Search,Search by Coverage Start Date,",,10,,,,,,,,,"
TC003,Dashboard,Search,Search by Coverage End Date,",,,30,,,,,,,,"
TC004,Dashboard,Search,Search by Transaction Status,",,,,,,งานใหม่,,,,,"
TC005,Dashboard,Search,Search by Insured Name,",Harry,,,,,,,,,,"
TC006,Dashboard,Search,Search by Car Model,",,,,,,,,,,,E-HS9"
TC007,Dashboard,Search,Search by Chassis Number,",,,,,,,,,,1HGBH41JXMN109186,"
TC008,Dashboard,Search,Search with Multiple Filters,"HQ0000020,Harry,,,,,,,,,,"
```

---

## Notes

### Purpose

Case 5 does one thing: takes an array-format `_locators/` file + scenario:value pairs → produces a validated CSV.

Benefits:
- Fast (small task)
- Easy to debug (single concern)
- CSV can be regenerated many times without touching locators

### After Case 5

`_scenarios/<feature>.csv` ready. Next:
- New feature → **Case 3** (bootstrap 4 files)
- Existing feature → **Case 1** (regenerate `data.ts` from updated CSV)