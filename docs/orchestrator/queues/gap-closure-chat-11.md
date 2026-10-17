# Gap closure queue: chat-11

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-11-b`. 189 gaps on 7 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## learner/projects (39: FIXED-ON-MAIN 19, OPEN 16, UNCONFIRMED 4)

Audit: `docs/audit/pages/learner/projects.md` (and `projects-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-projects-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-projects-01 | S2 | MISSING-FIELD | DONE |
| LEARNER-projects-13 | S2 | MISSING-FIELD | DONE |
| LEARNER-projects-26 | S2 | MISSING-ACTION | DONE |
| LEARNER-projects-33 | S2 | MISSING-ACTION | DONE |
| LEARNER-projects-36 | S2 | MISSING-FIELD | DONE |
| LEARNER-projects-02 | S3 | MISSING-FIELD | DONE |
| LEARNER-projects-03 | S3 | MISSING-FIELD | DONE |
| LEARNER-projects-04 | S3 | COPY | DONE |
| LEARNER-projects-06 | S3 | COPY | DONE |
| LEARNER-projects-10 | S3 | COPY | DONE |
| LEARNER-projects-12 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-projects-14 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-projects-15 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-projects-16 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-projects-17 | S3 | COPY | OPEN |
| LEARNER-projects-18 | S3 | COPY | OPEN |
| LEARNER-projects-23 | S3 | COPY | OPEN |
| LEARNER-projects-27 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| LEARNER-projects-28 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-projects-29 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-projects-31 | S3 | COPY | OPEN |
| LEARNER-projects-32 | S3 | COPY | OPEN |
| LEARNER-projects-37 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-projects-39 | S3 | COPY | OPEN |
| LEARNER-projects-40 | S3 | COPY | OPEN |
| LEARNER-projects-R03 | S3 | A11Y | FIXED-ON-MAIN |
| LEARNER-projects-05 | S4 | COPY | OPEN |
| LEARNER-projects-07 | S4 | STATE | UNCONFIRMED |
| LEARNER-projects-08 | S4 | COPY | OPEN |
| LEARNER-projects-09 | S4 | COPY | OPEN |
| LEARNER-projects-11 | S4 | STATE | FIXED-ON-MAIN |
| LEARNER-projects-19 | S4 | VALIDATION | UNCONFIRMED |
| LEARNER-projects-20 | S4 | COPY | OPEN |
| LEARNER-projects-21 | S4 | COPY | OPEN |
| LEARNER-projects-22 | S4 | MISSING-FIELD | OPEN |
| LEARNER-projects-30 | S4 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-projects-34 | S4 | COPY | UNCONFIRMED |
| LEARNER-projects-35 | S4 | COPY | OPEN |
| LEARNER-projects-R04 | S4 | MISSING-FIELD | OPEN |

## public/auth-public-1-login-session (39: OPEN 23, FIXED-ON-MAIN 11, UNCONFIRMED 5)

Audit: `docs/audit/pages/public/auth-public-1-login-session.md` (and `auth-public-1-login-session-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/public-auth-public-1-login-session-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| PUB-auth-public-01 | S2 | MISSING-FIELD | OPEN |
| PUB-auth-public-03 | S2 | COPY | OPEN |
| PUB-auth-public-04 | S2 | COPY | OPEN |
| PUB-auth-public-05 | S2 | COPY | OPEN |
| PUB-auth-public-06 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| PUB-auth-public-10 | S2 | STATE | OPEN |
| PUB-auth-public-12 | S2 | STATE | FIXED-ON-MAIN |
| PUB-auth-public-17 | S2 | COPY | OPEN |
| PUB-auth-public-19 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| PUB-auth-public-26 | S2 | MISSING-PAGE | UNCONFIRMED |
| PUB-auth-public-02 | S3 | STATE | FIXED-ON-MAIN |
| PUB-auth-public-07 | S3 | VALIDATION | FIXED-ON-MAIN |
| PUB-auth-public-08 | S3 | STATE | OPEN |
| PUB-auth-public-09 | S3 | STATE | OPEN |
| PUB-auth-public-11 | S3 | COPY | OPEN |
| PUB-auth-public-13 | S3 | STATE | FIXED-ON-MAIN |
| PUB-auth-public-18 | S3 | STATE | OPEN |
| PUB-auth-public-20 | S3 | MISSING-ACTION | OPEN |
| PUB-auth-public-21 | S3 | COPY | OPEN |
| PUB-auth-public-22 | S3 | STATE | OPEN |
| PUB-auth-public-25 | S3 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-27 | S3 | COPY | OPEN |
| PUB-auth-public-28 | S3 | COPY | OPEN |
| PUB-auth-public-29 | S3 | STATE | OPEN |
| PUB-auth-public-30 | S3 | STATE | UNCONFIRMED |
| PUB-auth-public-31 | S3 | STATE | OPEN |
| PUB-auth-public-33 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| PUB-auth-public-35 | S3 | STATE | UNCONFIRMED |
| PUB-auth-public-14 | S4 | STATE | OPEN |
| PUB-auth-public-15 | S4 | COPY | OPEN |
| PUB-auth-public-16 | S4 | MISSING-FIELD | FIXED-ON-MAIN |
| PUB-auth-public-23 | S4 | STATE | UNCONFIRMED |
| PUB-auth-public-24 | S4 | STATE | OPEN |
| PUB-auth-public-32 | S4 | STATE | OPEN |
| PUB-auth-public-34 | S4 | A11Y | FIXED-ON-MAIN |
| PUB-auth-public-36 | S4 | COPY | UNCONFIRMED |
| PUB-auth-public-37 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-38 | S4 | PERMISSION | OPEN |
| PUB-auth-public-39 | S4 | MISSING-PAGE | OPEN |

## college/academic-setup (34: FIXED-ON-MAIN 19, OPEN 13, WRONG 1, UNCONFIRMED 1)

Audit: `docs/audit/pages/college/academic-setup.md` (and `academic-setup-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-academic-setup-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-academic-setup-02 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-03 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-09 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-academic-setup-10 | S2 | STATE | FIXED-ON-MAIN |
| COL-academic-setup-14 | S2 | COPY | OPEN |
| COL-academic-setup-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-academic-setup-25 | S2 | VALIDATION | OPEN |
| COL-academic-setup-27 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-academic-setup-28 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-31 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-academic-setup-35 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| COL-academic-setup-05 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-academic-setup-13 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-15 | S3 | COPY | FIXED-ON-MAIN |
| COL-academic-setup-16 | S3 | A11Y | FIXED-ON-MAIN |
| COL-academic-setup-17 | S3 | STATE | OPEN |
| COL-academic-setup-19 | S3 | STATE | OPEN |
| COL-academic-setup-23 | S3 | VALIDATION | OPEN |
| COL-academic-setup-29 | S3 | STATE | OPEN |
| COL-academic-setup-30 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-academic-setup-32 | S3 | STATE | OPEN |
| COL-academic-setup-33 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-academic-setup-40 | S3 | STATE | OPEN |
| COL-academic-setup-20 | S4 | VALIDATION | OPEN |
| COL-academic-setup-21 | S4 | MISSING-FILTER | WRONG |
| COL-academic-setup-24 | S4 | STATE | OPEN |
| COL-academic-setup-36 | S4 | VALIDATION | OPEN |
| COL-academic-setup-38 | S4 | COPY | OPEN |
| COL-academic-setup-39 | S4 | MISSING-EXPORT | OPEN |
| COL-academic-setup-41 | S4 | RESPONSIVE | UNCONFIRMED |

## mentor/projects-meetings-part2 (25: FIXED-ON-MAIN 8, OPEN 16, UNCONFIRMED 1)

Audit: `docs/audit/pages/mentor/projects-meetings-part2.md` (and `projects-meetings-part2-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/mentor-projects-meetings-part2-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| MEN-projects-meetings-64 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| MEN-projects-meetings-66 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| MEN-projects-meetings-72 | S2 | SIDE-EFFECT | OPEN |
| MEN-projects-meetings-53 | S3 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-54 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-55 | S3 | MISSING-FILTER | OPEN |
| MEN-projects-meetings-57 | S3 | COPY | OPEN |
| MEN-projects-meetings-59 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| MEN-projects-meetings-60 | S3 | STATE | OPEN |
| MEN-projects-meetings-61 | S3 | COPY | OPEN |
| MEN-projects-meetings-63 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-65 | S3 | COPY | OPEN |
| MEN-projects-meetings-67 | S3 | COPY | OPEN |
| MEN-projects-meetings-68 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-70 | S3 | COPY | OPEN |
| MEN-projects-meetings-71 | S3 | STATE | UNCONFIRMED |
| MEN-projects-meetings-76 | S3 | COPY | OPEN |
| MEN-projects-meetings-56 | S4 | MISSING-ACTION | OPEN |
| MEN-projects-meetings-58 | S4 | COPY | OPEN |
| MEN-projects-meetings-62 | S4 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-69 | S4 | STATE | OPEN |
| MEN-projects-meetings-73 | S4 | STATE | OPEN |
| MEN-projects-meetings-74 | S4 | MISSING-PAGE | OPEN |
| MEN-projects-meetings-75 | S4 | STATE | OPEN |
| MEN-projects-meetings-77 | S4 | A11Y | FIXED-ON-MAIN |

## faculty/attendance-grades (22: OPEN 7, FIXED-ON-MAIN 15)

Audit: `docs/audit/pages/faculty/attendance-grades.md` (and `attendance-grades-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/faculty-attendance-grades-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| FAC-attendance-grades-01 | S2 | SIDE-EFFECT | OPEN |
| FAC-attendance-grades-02 | S2 | STATE | FIXED-ON-MAIN |
| FAC-attendance-grades-04 | S3 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-05 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| FAC-attendance-grades-06 | S3 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-07 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-attendance-grades-14 | S3 | COPY | OPEN |
| FAC-attendance-grades-20 | S3 | RESPONSIVE | FIXED-ON-MAIN |
| FAC-attendance-grades-22 | S3 | COPY | OPEN |
| FAC-attendance-grades-03 | S4 | STATE | FIXED-ON-MAIN |
| FAC-attendance-grades-08 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-09 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-10 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-attendance-grades-11 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-12 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-13 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-15 | S4 | VALIDATION | OPEN |
| FAC-attendance-grades-16 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| FAC-attendance-grades-17 | S4 | COPY | FIXED-ON-MAIN |
| FAC-attendance-grades-18 | S4 | VALIDATION | OPEN |
| FAC-attendance-grades-19 | S4 | COPY | OPEN |
| FAC-attendance-grades-21 | S4 | MISSING-PAGE | OPEN |

## learner/course-detail (18: FIXED-ON-MAIN 4, OPEN 12, UNCONFIRMED 2)

Audit: `docs/audit/pages/learner/course-detail.md` (and `course-detail-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-course-detail-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-course-detail-01 | S2 | VALIDATION / PERMISSION | FIXED-ON-MAIN |
| LEARNER-course-detail-03 | S2 | MISSING-FIELD | OPEN |
| LEARNER-course-detail-04 | S2 | MISSING-FIELD / VALIDATION | FIXED-ON-MAIN |
| LEARNER-course-detail-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-course-detail-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-course-detail-10 | S2 | MISSING-ACTION / STATE | UNCONFIRMED |
| LEARNER-course-detail-05 | S3 | MISSING-FIELD / COPY | OPEN |
| LEARNER-course-detail-08 | S3 | VALIDATION / COPY | OPEN |
| LEARNER-course-detail-09 | S3 | MISSING-FIELD | OPEN |
| LEARNER-course-detail-14 | S3 | MISSING-FIELD / COPY | OPEN |
| LEARNER-course-detail-15 | S3 | COPY | OPEN |
| LEARNER-course-detail-16 | S3 | MISSING-PAGE | OPEN |
| LEARNER-course-detail-17 | S3 | MISSING-ACTION | OPEN |
| LEARNER-course-detail-19 | S3 | STATE | OPEN |
| LEARNER-course-detail-12 | S4 | MISSING-FIELD | OPEN |
| LEARNER-course-detail-13 | S4 | COPY | OPEN |
| LEARNER-course-detail-18 | S4 | STATE | UNCONFIRMED |
| LEARNER-course-detail-20 | S4 | COPY | OPEN |

## superadmin/tenants-modules-2 (12: FIXED-ON-MAIN 4, OPEN 5, UNCONFIRMED 3)

Audit: `docs/audit/pages/superadmin/tenants-modules-2.md` (and `tenants-modules-2-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-tenants-modules-2-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-tenants-modules-33 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-35 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-25 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-29 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| SA-tenants-modules-36 | S3 | MISSING-FIELD | OPEN |
| SA-tenants-modules-37 | S3 | MISSING-FIELD | OPEN |
| SA-tenants-modules-38 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-tenants-modules-39 | S3 | MISSING-FIELD | OPEN |
| SA-tenants-modules-30 | S4 | MISSING-ACTION | UNCONFIRMED |
| SA-tenants-modules-31 | S4 | MISSING-FIELD | UNCONFIRMED |
| SA-tenants-modules-32 | S4 | MISSING-FIELD | OPEN |
| SA-tenants-modules-40 | S4 | MISSING-ACTION | OPEN |


## Builder chat-11 checkpoint — learner/projects first verified-closure batch (2026-10-17)

- Synced `chatgpt/chat-11-b` to `origin/main` `0233e08b` before starting the page; pushed only to this branch, never main.
- Source-complete with named tests and page verification entries: `LEARNER-projects-01/02/03/05/07/08/10/11/12/13/16/17/18/19/22/23/26/27/28/29/30/31/32/33/36/37/39/40/R03` (29 queued gaps); `LEARNER-projects-38` additional non-queue witness.
- Named tests in `tests/unit/learner-projects-gap-verification.test.ts`, DB-permission tests for `LEARNER-projects-26/33` in `tests/integration/projects-p5-lifecycle.test.ts`; updated `tests/unit/chat7-learner-project-goals.test.ts`. No tests run, no correctness certification implied.
- Remaining learner/projects gaps needing additional implementation/legacy verification: `LEARNER-projects-04/06/09/14/15/20/21/34/35/R04`. These are **OPEN**, not blocked or marked NOT-A-GAP; their partial witnesses do not count as closure.
- `docs/audit/acceptance/learner-projects-verification.md` records implementation paths and exact named tests for the 29 queued source-complete items; orchestrator validates them before closing the official tracker.

## Round-two checkpoint — 2026-10-17 (chat-11)

- Merged main `3b213085` as two-parent commit `068c778e` (non-overlapping source changes), branch-only. Reread revised graceful/friendly protocol and checklist; shared helpers were not on main at the start of the round.
- Learner/projects: closed source plus named tests for `LEARNER-projects-04/06/09/14/15/20/21/34/35/R04` (10 IDs). Implemented status options, legacy error and page copy, progress donut, delivery-readiness summary, meeting/team headings, safe resource opening with fallback and stats, activity state, overdue sprint rollup. `tests/unit/learner-projects-round2-gap-closure.test.ts` and learner page verification updated atomically; orchestrator runs tests.
- Public/auth login: documented and covered `PUB-auth-public-01/02/03/04/05/06/07/08/09/11/12/13/16/17/19/25/33/34/37` (19 IDs). Updated login copy/failures, default/allowed methods, legal links, branding/title, unknown host, expired notice, recruiter deep-link, last-used chooser, suspended accounts, keyboard/focus. `tests/unit/public-auth-login-gap-verification.test.ts` and `tests/unit/public-auth-chooser-graceful-gap.test.ts`; public verification created/updated.
- Total for this reply: 29 gap IDs with source evidence and tests authored (not run). Public remaining: `PUB-auth-public-10/14/15/18/20/21/22/23/24/26/27/28/29/30/31/32/35/36/38/39`. Remaining chat-11 pages: college academic setup; mentor projects meetings part2; faculty attendance grades; learner course detail; superadmin tenants modules 2. Tests, build, typecheck, lint delegated to orchestrator. No migration proposals.


## Round-three public-auth checkpoint — 2026-10-17

- `PUB-auth-public-10/14/18/27`: source verified or corrected; named tests and public page acceptance file updated. `PUB-auth-public-15`: NOT-A-GAP per owner OD-19. Shared `apiFetch`, `friendlyApiError` and `useGuardedAction` adopted in login, missing imports and malformed guarded-email callback fixed.
- Needs shell: `PUB-auth-public-20/21/22/23/24/29/31/38` need chat-9-owned switcher, logout and other shell edits; chat-11 leaves their source unchanged.
- BLOCKED `PUB-auth-public-26`: owner sign-in to the legacy JNTU/DGIPUC tenant environments is required to confirm whether the special PIN login must exist (OD-14).
- Remaining non-shell public gaps `PUB-auth-public-28/30/32/35/36/39` still OPEN pending end-to-end legacy and runtime evidence.
- Tests authored but not run; orchestrator runs them.


## Round-three checkpoint — 2026-10-17 (chat-11)

- Synced to latest main: branch already contained merged `bda21e4d` as a merge parent; verified the shared `src/lib/friendly-error.ts`, `src/lib/api-fetch.ts` and `src/hooks/use-guarded-action.ts` before editing. All writes pushed only to `chatgpt/chat-11-b`.
- Public/auth: source-complete with named tests `PUB-auth-public-10/14/18/27`; `PUB-auth-public-15` NOT-A-GAP per OD-19. Fixed missing shared-helper imports, malformed guarded resend callback, immediate resend for unusable codes, uncached tenant-lookup outage and safe 404 legacy copy. Test `tests/unit/public-auth-round3-gap-verification.test.ts`; evidence in `docs/audit/acceptance/public-auth-public-1-login-session-verification.md`.
- College Academic Setup: `COL-academic-setup-02/03/04/05/06/07/08/09/10/13/14/22/24/25/27/30/31/33/35` recorded source-complete with a named unit witness per ID; `COL-academic-setup-38` NOT-A-GAP (intentional archive instead of delete). Source includes elective allocation/roster, curriculum mapping, staffing, program blockers, derived semester credits, cohort fields, recurring course schedule and promotion effects. Test `tests/unit/college-academic-setup-gap-verification.test.ts`; evidence in `docs/audit/acceptance/college-academic-setup-verification.md`. Adjacent PostgreSQL integration suites already exist, but orchestrator must verify behavioral coverage and add dedicated tests where insufficient.
- Shared `apiFetch` adopted in touched login, semester, batch/cohort, class, program, elective-offering, curriculum mapping and recurring-schedule client forms; raw provider/database errors are not rendered in touched flows. This is partial GR-31/32/70/90 adoption, not a claim that every GR requirement is complete.
- COL still open: `COL-academic-setup-15/16/17/19/20/21/23/28/29/32/36/39/40/41`; public still open: `PUB-auth-public-20/21/22/23/24/26/28/29/30/31/32/35/36/38/39`. Other queued pages are not yet verified in this round.
- BLOCKED `PUB-auth-public-26`: live JNTU/DGIPUC special sign-in requires owner access to the legacy tenant environment (OD-14).
- Needs shell `PUB-auth-public-20/21/22/23/24/29/31/38`: chat-9 owns the membership switcher/global connectivity/logout interactions under `src/components/shell`.
- No tests were run, nor build/typecheck/lint; orchestrator executes all checks and may reject weak source-level acceptance witnesses.

## Notes (blockers, one line each)

## Needs shell (chat-9 only)
- PUB-auth-public-20/21/22/24/29/31: chat-9 owns shell membership switching, cross-tab signout, forbidden notices and global connectivity banners; chat-11 cannot modify src/components/shell.

