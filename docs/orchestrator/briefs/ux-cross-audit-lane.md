# UX cross-audit lane brief (brutally exhaustive pass, phase 4)

You AUDIT another lane's UX slice. You did not write it. Assume it is wrong until the source proves otherwise.

## Inputs
- `docs/design-system/UX-PLAYBOOK.md` (signed off) and `docs/design-system/UX-AUDIT-RUBRIC.md` (21 checks).
- `docs/orchestrator/briefs/ui-ux-excellence-lane.md` (the 10 "excellent" criteria and the hard rules).
- The slice you audit (route list in `docs/orchestrator/ui-ux/pages-<area>.md`) and the author's notes in `docs/audit/ux/`.
- Legacy wording catalogue: `docs/audit/legacy-copy-A.md`, `legacy-copy-B.md`.

## What to do, per page
1. Open the page source and every component it renders. Check all 21 rubric items plus the 10 excellence criteria.
2. Check exact legacy wording: titles, nav labels, buttons, messages. Any changed string is a BLOCKER unless the legacy string is kept.
3. Check phone behaviour at 320, 360 and 390px: no horizontal page scroll, 44px targets, tables become cards with every field reachable, sheets instead of popovers, safe areas.
4. Check all states: loading, empty (explicit copy), error with retry, partial, denied, stale. Never loading shown as empty.
5. Check forms (labels, inline errors tied with aria, focus first error, double-submit guard, draft preserved), dialogs (focus trap, Escape, focus return, nested history), tables (sort/filter in URL, pagination).
6. Check permissions and tenancy did not regress: central can()/requirePermission, same-origin on mutating routes, GET never writes.
7. Check tests: each page has UX-<area>-<page>-NN tests that truly assert the behaviour (not tautologies), and no existing test was weakened.

## Output
Write `docs/design-system/audits/UX-ROLLOUT-AUDIT-<area>-<your lane>.md` with a table: page, finding id, severity (BLOCKER/MAJOR/MINOR/NIT), evidence `file:line`, required fix. End with a per-area verdict (PASS or FAIL with counts). Then FIX every BLOCKER and MAJOR yourself in the code (small commits tagged with your lane and the finding id), and list what you fixed. Push to your own `chatgpt/chat-N-b` branch and reply with counts.

## Rules
Never remove or weaken tests. TypeScript strict-clean. Legacy wording exact. Dev only, never production.
