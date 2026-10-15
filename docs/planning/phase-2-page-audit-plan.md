# Phase 2 plan: brutal page-by-page audit of the old LMS, then close every gap

Written 2026-10-15. Start this when phase 1 (the surface matrix, `docs/planning/account-surface-parity.md`) is closed or the owner says go.

## 0. Why phase 2

Phase 1 tracked about 360 surface rows (page, tab, action level) and reached 347 DONE. Its evidence was: pages render and lay out correctly at 1280px and 375px with seeded data, no console or hydration errors, no role leaks, plus unit and integration tests. It did NOT exercise UI mutations, file/CSV downloads, real sending, or fine detail (every column, filter, validation message, modal field, empty state, error state, keyboard behaviour).

So the next goal is depth: for EVERY legacy page, list everything the old LMS does on it, compare with vNext, record every difference, then close them.

## 1. Inputs

- Legacy source: `C:\Users\LENOVO\Desktop\42lms` (branches prod-2026 and lms-dev-2026; dev-only features are in scope, per decision 7) and the legacy frontend `_hr-tpo-fe` for the recruiter/TPO apps.
- Legacy running stack (optional, for screenshots and behaviour confirmation): scripts in `C:\Users\LENOVO\local-stack` were disabled on 2026-10-15 (scheduled tasks `42LMS Local Stack` and `42LMS Local Stack (new)` disabled, scripts renamed `*.disabled`). Re-enable ONLY with the owner's go, run it on demand, and stop it afterwards (the laptop overheats). Prefer reading code first; run the stack only to confirm ambiguous behaviour.
- vNext: this repo, `docs/planning/account-surface-parity.md`, `docs/parity/*.md`, `docs/decisions/*`.
- Owner decisions that bound scope: dev-only legacy features in scope; messaging is real via one delivery module with non-prod allowlist; AI grading is OUT of scope (decision 9); BLOCKED items (storage uploads, signed video, Vertex AI quality runs) need owner/infra input.

## 2. Unit of audit = one page

A page = one route plus everything reachable from it without leaving the route: every tab, section, table, filter, sort, pagination, drawer, modal, dialog, toast, inline edit, bulk action, export/import, empty/error/loading/permission-denied state, and every API call it triggers.

Each page gets its OWN audit round by its own fresh agent (one page per agent context, so nothing is skimmed). Large pages (for example TPO drive detail) are split by tab, but each tab still gets its own round.

## 3. Outputs (all committed under `docs/audit/`)

1. `docs/audit/legacy-inventory.md`: master list of every legacy route per account (from the legacy router and nav config, cross-checked with API route usage), with the vNext route it maps to (or none). One row per page; columns: account, legacy route, legacy component file(s), vNext route, audit file, status (NOT_STARTED / AUDITED / REVIEWED / GAPS_OPEN / CLOSED).
2. `docs/audit/pages/<account>/<page-slug>.md`: the per-page audit, using the template in section 4.
3. `docs/audit/gap-register.md`: one row per gap: ID (`<ACCT>-<page>-NN`), page, description, type, severity, legacy evidence (file:line), vNext evidence (file or "absent"), proposed owner lane, status.
4. `docs/audit/PROGRESS.md`: counts per account and status, updated after every round.

## 4. Per-page audit template

```
# <Account> / <Page title>  (legacy: <route>, vNext: <route or MISSING>)
Audited: <date> by <agent>   Reviewed: <date> by <agent>
## 1. Legacy behaviour (from code, confirmed by running stack where ambiguous)
- Entry points and navigation (menu, deep links, query params)
- Data shown: every column / card / field, formats, sort defaults, pagination size
- Filters and search: every control, options, defaults, URL state
- Actions: every button/menu item, what it calls (API + params), confirmation dialogs, success/failure messages
- Modals/drawers/dialogs: each one, every field, validation rules and messages, submit behaviour
- Tabs and sub-sections
- Exports/imports/downloads: file format, columns, naming
- States: loading, empty, error, permission denied, partial data
- Roles that can see/do what; scope rules (college/org); audit events
- Side effects: emails/SMS/notifications, counters, derived data
- Responsive/mobile behaviour; keyboard/accessibility details worth matching
## 2. vNext behaviour (from code)
Same headings, factual.
## 3. Gaps (each becomes a gap-register row)
| ID | Gap | Type | Severity | Legacy evidence | vNext evidence |
## 4. Intentional differences (approved deviations, with decision reference)
## 5. Test hooks: unit/integration tests that exist; browser script needed
```

Gap types: MISSING-PAGE, MISSING-TAB, MISSING-ACTION, MISSING-MODAL, MISSING-FIELD, MISSING-FILTER, MISSING-COLUMN, MISSING-EXPORT, VALIDATION, STATE (empty/error/loading), PERMISSION, SIDE-EFFECT, COPY (wording), RESPONSIVE, PERFORMANCE, A11Y.
Severity: S1 blocks a real workflow; S2 degrades a workflow; S3 cosmetic/rare; S4 nice-to-have.

## 5. Rounds (how the audit runs)

- Round 0, inventory (one agent per account): enumerate every legacy route and component tree entry point; produce `legacy-inventory.md` rows. A second agent reconciles it against the legacy nav and API route list to catch pages with no menu entry (deep links, modals-as-pages, public pages, email-link pages).
- Round A (audit): one agent per page (3 to 6 in parallel at most because of laptop limits) writes the per-page file and its gap rows. The agent must cite file:line for every claim and must not guess: unknown means "UNCONFIRMED" plus a note on how to confirm.
- Round R (adversarial review): a different agent re-reads the legacy code for the same page WITHOUT seeing the audit first, produces its own list, then diffs. Anything the reviewer finds that the auditor missed is added, and the discrepancy rate per auditor is recorded in PROGRESS.md (if above 15%, re-audit that account).
- Round G (gap consolidation, per account): dedupe, severity-rank, group into work items of about 1 to 3 hours of builder work each.

Account order (highest operational value first): TPO, Recruiter (HR), Learner, College admin, Faculty, Mentor, Super Admin, then public/unauthenticated pages (join links, unsubscribe, placements public, share pages, login/recovery).

## 6. From gaps to builds

- Convert each work item to a short task spec in `docs/orchestrator/briefs/phase2/<lane>.md` (the same one-line-pointer technique used in phase 1: the ChatGPT builder reads its brief file from main). Assign by lane ownership (TPO lanes, learner lanes, etc.).
- The gap register is the source of truth; builders mark gaps CLOSED in their own docs/parity file only with a commit reference, and the orchestrator flips the register row after verification.
- Same build rules and pitfalls as phase 1 (`docs/orchestrator/briefs/chat-N.md`): cast reused SQL params, alias duplicate Drizzle columns, ::enum casts, non-leaking denials, requirePermission with admin scope, isSameOriginRequest on mutating routes, GET handlers never write, no setState in effects, no Date.now in render, no eslint-disable, no JSX in try/catch, new tables only as staged schema + proposed migration (orchestrator registers migrations).

## 7. Verification v2 (what phase 1 could not do)

A page is CLOSED only when all of these hold:
1. No open S1/S2 gaps for the page in the register.
2. Unit tests cover its validation and permission rules; integration tests cover its DB paths.
3. A browser script (Playwright, `scripts/verify/pages/<account>-<page>.mjs`) exercises the page's mutations end to end on seeded local data: open each modal, submit valid and invalid input, confirm messages, confirm DB effect, confirm audit event, confirm another role cannot do it, confirm export downloads parse. Layout checked at 1280px and 375px.
4. Messaging side effects verified in non-prod allowlist mode (recorded as suppressed or delivered to test recipients only).
5. Orchestrator acceptance pass records evidence in `docs/audit/acceptance/<date>.md` (with the evidence level stated honestly).

## 8. Orchestration lessons learned in phase 1 (apply them)

- Builders: ChatGPT Chat mode, High power, nine fresh-ish conversations. Re-task with a one-line pointer to the brief; start a fresh conversation (and close the hung tab) whenever a tab stops responding or says "Could not load this conversation". Front a tab (`tabs_select`) before any find/click. Never send long pasted briefs through the browser (typing lag); keep briefs in the repo.
- Merging: a repair agent merges all lane branches serially (merge --no-commit, stage fixes, tsc + eslint on changed files + unit tests, push main after each) about every 30 to 40 minutes; `scripts/orchestrator/auto-merge.mjs` is too slow for nine branches. Migrations are registered by an agent from `docs/proposed-migrations/*`; integration tests for changed files run in one DB agent, one file at a time.
- Do not let two agents write git in the same checkout at once (use `git commit -- <paths>`, never broad adds; or use a separate worktree).
- Laptop limits: about 13.9 GB RAM; each long ChatGPT tab costs 0.5 to 1 GB; legacy stack and dev servers must not run alongside builds and acceptance runs. Run heavy runs (acceptance, integration) when load is below about 60% CPU; one page at a time; larger Node heap for dev server.
- Wakeups: `ScheduleWakeup` is unreliable (only fires when idle). Use the Monitor watcher `scripts/orchestrator/lane-watch.sh` (30 minute expiry, re-arm) plus a cron backup; false idle alerts happen right after re-tasking, so check the screen before sending.
- Deploys: batch them (migrations 0059 to 0075+ are pending on dev; one deploy with a migration check). Do not touch production.

## 9. Start procedure (when phase 1 closes)

1. Confirm phase 1 state: matrix counts, open BLOCKED decisions with the owner.
2. Ask the owner for: permission to run the legacy stack on demand; answers on storage/video blockers; priority order change if any.
3. Run Round 0 for all accounts, commit `docs/audit/legacy-inventory.md`.
4. Run Rounds A and R per page in account order; commit per account; keep PROGRESS.md current.
5. Run Round G; create `docs/audit/gap-register.md`; create phase 2 lane briefs; assign lanes; resume the build/merge/verify loop from section 8.
6. After each account's gaps are closed, run Verification v2 for its pages and report.

## 10. Estimates (to be refined after Round 0)

Legacy pages: expected roughly 250 to 350 routes across accounts (matrix has about 360 surface rows, many are tabs/actions of the same page). Audit cost: about one agent round per page. Build cost: unknown until the gap register exists; plan on the register being 800 to 2000 rows with S3/S4 forming most.

## 11. Open questions for the owner

- Run the legacy stack for confirmation screenshots? (default: code-only audit)
- Are S4 "nice-to-have" gaps in scope, or only S1 to S3?
- Storage buckets and video signing: who provides access, and when?
