# AGENT_PROMPTS.md — Index

Prompt templates for AI agents (GitHub Copilot, Cursor, Claude) working with **ttest-playwright**.

Each case has minimal user prompt + separate rules file under `doc/prompts/`.

---

## Which case?

| Case | When to use | Rules file |
|---|---|---|
| **Case 1** | Update test cases — CSV rows changed | `doc/prompts/case-1-update-tcs.md` |
| **Case 2** | Extend helper — new locator type or `\|action` | `doc/prompts/case-2-extend-helper.md` |
| **Case 3** | New feature — bootstrap 4 files | `doc/prompts/case-3-bootstrap.md` |
| **Case 4** | Bootstrap _locators (raw codegen → array) | `doc/prompts/case-4-locators.md` |
| **Case 5** | Generate scenarios CSV | `doc/prompts/case-5-csv.md` |

Full decision tree in `AGENTS.md` Section 4.

---

## How to use

### Minimal user prompt

Paste this in Copilot Chat. Only Location changes per feature.

**Case 3 example:**
```markdown
### Case 3 — New feature (bootstrap)

Read: #file:doc/prompts/case-3-bootstrap.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search
```

Copilot reads the rules file → applies to your Location → executes.

### Optional overrides

If defaults in the rules file don't fit, add override lines:

```markdown
### Case 3 — New feature (bootstrap)

Read: #file:doc/prompts/case-3-bootstrap.md

**Location**
- Project: WEF
- AccessFlow: Microsoft-Login
- Module: dashboard
- Feature: search

**Overrides**
- Structure: flat
- Default verify: no error toast + URL /dashboard/search
```

If not specified, defaults from the rules file apply.

---

## User prompt templates (copy-paste)

### Case 1 — Update test cases
```markdown
### Case 1 — Update test cases

Read: #file:doc/prompts/case-1-update-tcs.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>
```

### Case 2 — Extend helper
```markdown
### Case 2 — Extend helper capability

Read: #file:doc/prompts/case-2-extend-helper.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>

**Extension**
- Type: locator | action
- Name: <descriptive name>
- Description: <one line>
- Playwright API: <API call>
```

### Case 3 — Bootstrap new feature
```markdown
### Case 3 — New feature bootstrap

Read: #file:doc/prompts/case-3-bootstrap.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>
```

### Case 4 — Bootstrap locators
```markdown
### Case 4 — Bootstrap locators

Read: #file:doc/prompts/case-4-locators.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>
```

**Precondition:** `_locators/<feature>.ts` must exist (raw codegen or array format). Case 4 auto-detects and converts if raw.

### Case 5 — Generate scenarios CSV
```markdown
### Case 5 — Generate scenarios CSV

Read: #file:doc/prompts/case-5-csv.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>

**Scenarios**
<scenario name 1> : <value 1>
<scenario name 2> : <value 2>
```

**Precondition:** `_locators/<feature>.ts` must exist AS ARRAY FORMAT.

---

## Universal principles (recap)

- **AI does not generate selectors** — transcribes from dev's codegen only
- **Order is source of truth** — `_locators/` index N ↔ CSV Value item N
- **Universal helper** — dispatches by content type (`|` prefix = action) + locator type (textbox/combobox)
- **CSV Value format** — comma-separated items, `|` prefix marks action

Full rules in each case's file. Complete spec in `AGENTS.md` Section 5, 8, 9.

---

## Changelog

- 2026-09-20 (v7.2) — Split Case 4 into Case 4 (locators bootstrap only) + Case 5 (CSV generation only). Reduces per-case scope for faster execution and easier debugging.
- 2026-09-20 (v7) — Case 4 added (Generate scenarios CSV from scenario:value paste).
- 2026-09-20 (v6) — Value-based model. Case 2 redefined as "extend helper capability". CSV Value uses `|` prefix for actions. `_locators/` = flat array export. No per-feature action taxonomy.
- 2026-09-20 (v5) — Minimal user prompt + separate rules file. Snippet-based model.
- 2026-09-20 (v4) — `{{}}` placeholder templates (superseded).
- 2026-09-20 (v3) — Step-based union, CSV workflow.
- 2026-09-19 (v1) — Case 1 finalized.