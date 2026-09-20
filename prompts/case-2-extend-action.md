# Case 2 — Extend Action Pattern (Rules)

Rules file for AI. Do NOT paste this file's content as prompt — user pastes minimal invocation (see `AGENT_PROMPTS.md`).

---

## What the user paste looks like

```markdown
### Case 2 — Extend action pattern

Read: #file:doc/prompts/case-2-extend-action.md

**Location**
- Project: <project>
- AccessFlow: <access-flow>
- Module: <module>
- Feature: <feature>

**New pattern**
- Name: <camelCase name>
- Description: <one line>
- Playwright API: <API to call>
```

AI extracts Location + New pattern from user prompt.

---

## When to use

Feature exists. Dev added a new interaction pattern in `_flows/<feature>.ts` TEST ACTIONS that helper's switch doesn't handle (e.g., `dragAndDrop`, `uploadFile`, `hoverAndClick`).

---

## Rules

Execute in this order.

### Precondition verification

1. Verify feature folder exists at `Test-Local/<project>/<access-flow>/<module>/<feature>/`. If missing → **STOP** and report "Case 3 required".

2. Read `<feature>.types.ts`:
   - Get current Action union values
   - If `<pattern-name>` already in union → **STOP** and report "Pattern already exists".

3. Read `_flows/<feature>.ts`:
   - Confirm the new pattern is visible in TEST ACTIONS section
   - Use as reference for step 5

### Extension

4. Update `<feature>.types.ts`:
   - Add `'<pattern-name>'` to the Action union
   
   Example:
   ```typescript
   // Before
   export type <Feature>Action = 'click' | 'download';
   
   // After
   export type <Feature>Action = 'click' | 'download' | '<pattern-name>';
   ```

5. Update `<feature>.helper.ts`:
   - Add new case to `applyAction` switch, ABOVE the `default` case
   - Case body:
     - Fetch locator via `await locator(page)`
     - Transcribe the Playwright API from user's New pattern block
     - Use exact same wrappers/waits as `_flows/` shows
   
   Example structure:
   ```typescript
   case '<pattern-name>': {
     await locator(page);
     // ... additional API calls per user's Playwright API
     break;
   }
   ```

6. Update `AGENTS.md` Section 9 canonical patterns table:
   - Add new row with pattern name, description, transcribed API
   
   If AGENTS.md not writable → skip and note in output.

7. Do NOT touch: `spec.ts`, `data.ts`, `_locators/*`, `_flows/*`, other features.

---

## Output

- Modified `<feature>.types.ts` (Action union extended)
- Modified `<feature>.helper.ts` (switch case added)
- Modified `AGENTS.md` Section 9 (pattern documented)
- Report:
  - "Pattern '<pattern-name>' added"
  - "Next: use Case 1 to add TCs with Action='<pattern-name>'"

---

## Stop conditions summary

| Signal | Report |
|---|---|
| Feature folder missing | `"Case 3 required — feature does not exist"` |
| Pattern already in union | `"Pattern '<name>' already handled"` |
| Playwright API unclear | `"Cannot infer implementation — clarify Playwright API"` |
| Pattern not in `_flows/` | `"Warning: <name> not found in _flows/ — add there first"` |

---

## Why Case 2 doesn't add test cases

Case 2 extends the pattern. Test cases come via Case 1 (with new action already in union).

Split ensures:
- Pattern change reviewed independently
- Test case additions batched with QA's CSV updates
- No mixing of infrastructure + data changes

---

## Note on AGENTS.md updates

If AI cannot modify `AGENTS.md`:
- Still complete steps 4-5 (types + helper)
- Report: "AGENTS.md Section 9 needs manual update — add row for <pattern-name>"

Do not block on AGENTS.md update.