# Phase 2 Round A: per-page audit brief (read-only agents)

You audit ONE legacy page (plus every tab, modal, drawer and action reachable from it) against vNext, and write one audit file. You change no product code. Read `docs/planning/phase-2-page-audit-plan.md` sections 2 to 7 and `AGENTS.md` first.

## Inputs
- Legacy source: `C:\Users\LENOVO\Desktop\42lms` (git repo; read the dev branch with `git -C <repo> show lms-dev-2026:<path>` and `git -C <repo> ls-tree -r --name-only lms-dev-2026 <dir>`; prod-2026 only as `origin/prod-2026`, its local ref is stale). Frontend is `42LMS-FRONTEND\lms2-fe` (Pages Router) or `_hr-tpo-fe` for TPO / recruiter / super admin / public. Dev-only features are in scope.
- Inventory rows with the legacy component files and API calls: `docs/audit/legacy-inventory-A.md` (learner, faculty, mentor, college) and `docs/audit/legacy-inventory-B.md` (TPO, recruiter, super admin, public). Exact legacy copy: `docs/audit/legacy-copy-A.md` and `-B.md`. Known wording gaps: `docs/audit/wording-gap-report.md`. Known logic gaps: `docs/audit/logic-fix-backlog.md`, `docs/audit/db-parity-audit.md`.
- vNext: this repo (`src/app/(authenticated)/...`, `src/components/...`, `src/modules/...`, `src/app/api/...`), parity notes `docs/parity/*.md`, matrix `docs/planning/account-surface-parity.md`, acceptance reports `docs/audit/acceptance/*.md`.

## Method (do not skim; cite file:line for every claim; unknown = UNCONFIRMED + how to confirm)
1. Read every legacy component in the page's closure (page file, tab components, modals, drawers, helpers, services) and the backend endpoints they call (controller + service logic: validations, permissions, side effects, messages).
2. List legacy behaviour per the template in the plan section 4: entry points, every column/card/field with formats and defaults, every filter/sort/pagination, every action with API and confirm dialogs and success/failure messages, every modal field with validation and messages, tabs, exports/imports (format, columns, names), states (loading/empty/error/denied), roles and scope, side effects (notifications, counters, audit), responsive and keyboard details.
3. Read the vNext equivalent the same way (page, components, API routes, services, validators, permission checks, tests).
4. Diff: every difference becomes a gap row. Types: MISSING-PAGE, MISSING-TAB, MISSING-ACTION, MISSING-MODAL, MISSING-FIELD, MISSING-FILTER, MISSING-COLUMN, MISSING-EXPORT, VALIDATION, STATE, PERMISSION, SIDE-EFFECT, COPY, RESPONSIVE, PERFORMANCE, A11Y. Severity: S1 blocks a real workflow; S2 degrades one; S3 cosmetic/rare; S4 nice-to-have (S4 is in scope: owner wants improvements over legacy too). Also record clear improvements in vNext as 'intentional differences'.
5. Gap IDs: `<ACCT>-<page-slug>-NN`, e.g. `TPO-batches-01`.
6. Do NOT re-report gaps already closed on main: check the current vNext code, not older notes. Do not include personal data from any dataset.

## Output
Write `docs/audit/pages/<account>/<page-slug>.md` using the template (sections 1 legacy, 2 vNext, 3 gaps table with ID/Gap/Type/Severity/Legacy evidence/vNext evidence, 4 intentional differences, 5 test hooks). Then commit only that file (and nothing else): `git pull --rebase origin main`, `git add <file>`, `git commit -m "docs(audit): phase 2 round A <account>/<page>" -- <file>` (end the message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`), `git push origin main`. Never use broad adds; leave untracked `.claude/`, `sticky-notes/`, `scripts/orchestrator/lane-watch.sh`, `scripts/verify/route-sweep.mjs`, `tsconfig.tsbuildinfo` alone.

## Limits
Read-only: no dev servers, no tests, no builds, no database. Keep memory low. Final report (<= 15 lines): file written, gap counts by severity and type, top 5 gaps, anything UNCONFIRMED.
