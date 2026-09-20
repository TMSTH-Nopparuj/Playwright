# AGENT_PROMPTS.md — Index

Prompt templates for AI agents (GitHub Copilot, Cursor, Claude) working with **ttest-playwright**.

Each case has minimal user prompt + separate rules file.

---

## Which case?

| Case | When to use | Rules file |
|---|---|---|
| **Case 1** | Update test cases — `_locators/` snippets or CSV rows changed | `doc/prompts/case-1-update-tcs.md` |
| **Case 2** | New action pattern — helper switch doesn't handle it | `doc/prompts/case-2-extend-action.md` |
| **Case 3** | New feature — bootstrap 4 files | `doc/prompts/case-3-bootstrap.md` |

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
- Feature: print
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
- Feature: print

**Overrides**
- Structure: flat
- Default verify: no error toast + URL /dashboard/print
```

If not specified, defaults from the rules file apply.

---

## User prompt templates (copy-paste)

### Case 1
```markdown
### Case 1 — Update test cases

Read: #file:doc/prompts/case-1-update-tcs.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>
```

### Case 2
```markdown
### Case 2 — Extend action pattern

Read: #file:doc/prompts/case-2-extend-action.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>

**New pattern**
- Name: <camelCase>
- Description: <one line>
- Playwright API: <API to call>
```

### Case 3
```markdown
### Case 3 — New feature bootstrap

Read: #file:doc/prompts/case-3-bootstrap.md

**Location**
- Project: <name>
- AccessFlow: <name>
- Module: <name>
- Feature: <name>
```

---

## Universal principles (recap)

- **AI does not generate selectors** — transcribe from dev's codegen only
- **Order is source of truth** — `_locators/` position N ↔ CSV row N ↔ data.ts `locatorIndex: N`
- **Snippet count MUST match CSV row count** — mismatch = STOP

Full rules in each case's file.

---

## Changelog

- 2026-09-20 (v5) — Minimal user prompt + separate rules file. User specifies Location only; defaults live in rules file. Overrides optional. Copilot uses `#file:` to pin rules file.
- 2026-09-20 (v4) — `{{}}` placeholder templates (superseded).
- 2026-09-20 (v3) — Step-based union, CSV workflow.
- 2026-09-19 (v1) — Case 1 finalized.