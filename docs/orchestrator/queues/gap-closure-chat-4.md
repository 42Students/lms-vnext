# Gap closure queue: chat-4

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-4-b`. 194 gaps on 8 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## superadmin/placements-projects-b-projects (41: OPEN 15, FIXED-ON-MAIN 22, UNCONFIRMED 4)

Audit: `docs/audit/pages/superadmin/placements-projects-b-projects.md` (and `placements-projects-b-projects-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-placements-projects-b-projects-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-placements-projects-51 | S2 | MISSING-PAGE | NOT-A-GAP |
| SA-placements-projects-56 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-60 | S2 | MISSING-FIELD | DONE |
| SA-placements-projects-62 | S2 | MISSING-ACTION | DONE |
| SA-placements-projects-64 | S2 | MISSING-FIELD | DONE |
| SA-placements-projects-65 | S2 | MISSING-FIELD | DONE |
| SA-placements-projects-69 | S2 | MISSING-TAB | DONE |
| SA-placements-projects-70 | S2 | STATE | DONE |
| SA-placements-projects-77 | S2 | SIDE-EFFECT | UNCONFIRMED |
| SA-placements-projects-81 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-82 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-85 | S2 | MISSING-TAB | DONE |
| SA-placements-projects-88 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-89 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-90 | S2 | MISSING-FIELD | DONE |
| SA-placements-projects-91 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-52 | S3 | COPY | DONE |
| SA-placements-projects-53 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-54 | S3 | MISSING-EXPORT | DONE |
| SA-placements-projects-57 | S3 | COPY | DONE |
| SA-placements-projects-58 | S3 | MISSING-FIELD | DONE |
| SA-placements-projects-59 | S3 | MISSING-FILTER | DONE |
| SA-placements-projects-61 | S3 | MISSING-COLUMN | DONE |
| SA-placements-projects-63 | S3 | MISSING-EXPORT | DONE |
| SA-placements-projects-66 | S3 | MISSING-COLUMN | DONE |
| SA-placements-projects-67 | S3 | STATE | DONE |
| SA-placements-projects-68 | S3 | STATE | DONE |
| SA-placements-projects-71 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-72 | S3 | MISSING-ACTION | DONE |
| SA-placements-projects-73 | S3 | COPY | DONE |
| SA-placements-projects-74 | S3 | MISSING-FILTER | DONE |
| SA-placements-projects-75 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-76 | S3 | MISSING-EXPORT | DONE |
| SA-placements-projects-78 | S3 | COPY | DONE |
| SA-placements-projects-79 | S3 | COPY | DONE |
| SA-placements-projects-80 | S3 | MISSING-ACTION | DONE |
| SA-placements-projects-86 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-87 | S3 | MISSING-ACTION | DONE |
| SA-placements-projects-92 | S3 | STATE | DONE |
| SA-placements-projects-55 | S4 | MISSING-FILTER | DONE |
| SA-placements-projects-93 | S4 | MISSING-ACTION | DONE |

## tpo/home (39: OPEN 18, FIXED-ON-MAIN 18, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/home.md` (and `home-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-home-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-home-01 | S2 | COPY | DONE |
| TPO-home-04 | S2 | MISSING-FIELD | DONE |
| TPO-home-05 | S2 | MISSING-FIELD | DONE |
| TPO-home-06 | S2 | MISSING-FIELD | DONE |
| TPO-home-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-08 | S2 | MISSING-FIELD | DONE |
| TPO-home-09 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-13 | S2 | MISSING-FIELD | DONE |
| TPO-home-26 | S2 | STATE | DONE |
| TPO-home-27 | S2 | PERMISSION | UNCONFIRMED |
| TPO-home-28 | S2 | MISSING-MODAL | DONE |
| TPO-home-42 | S2 | MISSING-FIELD | DONE |
| TPO-home-43 | S2 | RESPONSIVE | DONE |
| TPO-home-10 | S3 | MISSING-FIELD | DONE |
| TPO-home-17 | S3 | A11Y | DONE |
| TPO-home-18 | S3 | RESPONSIVE | DONE |
| TPO-home-19 | S3 | STATE | DONE |
| TPO-home-20 | S3 | STATE | DONE |
| TPO-home-21 | S3 | COPY | DONE |
| TPO-home-23 | S3 | COPY | DONE |
| TPO-home-25 | S3 | PERMISSION | UNCONFIRMED |
| TPO-home-29 | S3 | COPY | DONE |
| TPO-home-30 | S3 | COPY | DONE |
| TPO-home-32 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-home-34 | S3 | STATE | DONE |
| TPO-home-36 | S3 | MISSING-FIELD | DONE |
| TPO-home-37 | S3 | STATE | DONE |
| TPO-home-39 | S3 | A11Y | DONE |
| TPO-home-40 | S3 | COPY | OPEN |
| TPO-home-41 | S3 | MISSING-ACTION | DONE |
| TPO-home-R04 | S3 | STATE | FIXED-ON-MAIN |
| TPO-home-R05 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-R06 | S3 | COPY | DONE |
| TPO-home-R07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-R08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-home-22 | S4 | STATE | DONE |
| TPO-home-24 | S4 | COPY | DONE |
| TPO-home-38 | S4 | COPY | DONE |
| TPO-home-44 | S4 | RESPONSIVE | OPEN |

## superadmin/tenants-modules-3 (28: OPEN 11, FIXED-ON-MAIN 14, UNCONFIRMED 3)

Audit: `docs/audit/pages/superadmin/tenants-modules-3.md` (and `tenants-modules-3-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-tenants-modules-3-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-tenants-modules-46 | S2 | MISSING-ACTION | OPEN |
| SA-tenants-modules-47 | S2 | MISSING-ACTION | OPEN |
| SA-tenants-modules-51 | S2 | MISSING-ACTION | DONE |
| SA-tenants-modules-54 | S2 | SIDE-EFFECT | UNCONFIRMED |
| SA-tenants-modules-57 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-63 | S2 | MISSING-ACTION | DONE |
| SA-tenants-modules-65 | S2 | MISSING-ACTION | DONE |
| SA-tenants-modules-41 | S3 | MISSING-FILTER | DONE |
| SA-tenants-modules-42 | S3 | MISSING-FILTER | DONE |
| SA-tenants-modules-43 | S3 | COPY | DONE |
| SA-tenants-modules-44 | S3 | STATE | DONE |
| SA-tenants-modules-48 | S3 | MISSING-FILTER | OPEN |
| SA-tenants-modules-52 | S3 | MISSING-FILTER | DONE |
| SA-tenants-modules-53 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-tenants-modules-55 | S3 | PERMISSION | DONE |
| SA-tenants-modules-58 | S3 | MISSING-FIELD | DONE |
| SA-tenants-modules-59 | S3 | MISSING-COLUMN | DONE |
| SA-tenants-modules-60 | S3 | STATE | UNCONFIRMED |
| SA-tenants-modules-62 | S3 | SIDE-EFFECT | DONE |
| SA-tenants-modules-64 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-tenants-modules-66 | S3 | MISSING-ACTION | DONE |
| SA-tenants-modules-67 | S3 | COPY | DONE |
| SA-tenants-modules-68 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-tenants-modules-45 | S4 | STATE | DONE |
| SA-tenants-modules-49 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-50 | S4 | MISSING-FILTER | DONE |
| SA-tenants-modules-56 | S4 | MISSING-FILTER | DONE |
| SA-tenants-modules-61 | S4 | VALIDATION | DONE |

## learner/home-courses (27: FIXED-ON-MAIN 14, UNCONFIRMED 2, OPEN 11)

Audit: `docs/audit/pages/learner/home-courses.md` (and `home-courses-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-home-courses-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-course-detail-R02 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-home-courses-01 | S2 | COPY / MISSING-PAGE (landing) | UNCONFIRMED |
| LEARNER-home-courses-14 | S2 | MISSING-FIELD / SIDE-EFFECT | UNCONFIRMED |
| LEARNER-course-detail-R01 | S3 | STATE / VALIDATION | DONE |
| LEARNER-course-detail-R03 | S3 | STATE / MISSING-ACTION | DONE |
| LEARNER-course-detail-R04 | S3 | PERFORMANCE | DONE |
| LEARNER-home-courses-02 | S3 | MISSING-FILTER | OPEN |
| LEARNER-home-courses-03 | S3 | STATE / COPY | DONE |
| LEARNER-home-courses-04 | S3 | MISSING-FIELD / COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-05 | S3 | COPY / MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-home-courses-08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| LEARNER-home-courses-09 | S3 | COPY / STATE | DONE |
| LEARNER-home-courses-12 | S3 | COPY | DONE |
| LEARNER-home-courses-16 | S3 | COPY | DONE |
| LEARNER-home-courses-19 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-21 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-home-courses-R01 | S3 | STATE | DONE |
| LEARNER-home-courses-06 | S4 | COPY | DONE |
| LEARNER-home-courses-07 | S4 | MISSING-FILTER | DONE |
| LEARNER-home-courses-10 | S4 | STATE | DONE |
| LEARNER-home-courses-11 | S4 | STATE | DONE |
| LEARNER-home-courses-13 | S4 | COPY | DONE |
| LEARNER-home-courses-15 | S4 | COPY / MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-home-courses-18 | S4 | PERFORMANCE | OPEN |
| LEARNER-home-courses-20 | S4 | MISSING-FIELD / PERMISSION | FIXED-ON-MAIN |
| LEARNER-home-courses-22 | S4 | PERFORMANCE | OPEN |
| LEARNER-home-courses-23 | S4 | COPY | DONE |

## college/course-tabs (23: FIXED-ON-MAIN 16, OPEN 4, UNCONFIRMED 3)

Audit: `docs/audit/pages/college/course-tabs.md` (and `course-tabs-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-course-tabs-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-course-tabs-03 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-04 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-05 | S1 | MISSING-ACTION | DONE |
| COL-course-tabs-06 | S1 | MISSING-ACTION | DONE |
| COL-course-tabs-08 | S1 | MISSING-TAB | DONE |
| COL-course-tabs-07 | S2 | MISSING-ACTION | DONE |
| COL-course-tabs-09 | S2 | MISSING-FILTER | DONE |
| COL-course-tabs-10 | S2 | MISSING-EXPORT | DONE |
| COL-course-tabs-11 | S2 | MISSING-COLUMN | DONE |
| COL-course-tabs-12 | S2 | MISSING-ACTION | DONE |
| COL-course-tabs-13 | S2 | MISSING-ACTION | DONE |
| COL-course-tabs-16 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-17 | S2 | MISSING-ACTION | DONE |
| COL-course-tabs-14 | S3 | MISSING-ACTION | DONE |
| COL-course-tabs-15 | S3 | STATE | UNCONFIRMED |
| COL-course-tabs-18 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-19 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-course-tabs-22 | S3 | STATE | DONE |
| COL-course-tabs-23 | S3 | STATE | UNCONFIRMED |
| COL-course-tabs-26 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-24 | S4 | MISSING-FILTER | DONE |
| COL-course-tabs-25 | S4 | PERMISSION | UNCONFIRMED |
| COL-course-tabs-27 | S4 | RESPONSIVE | DONE |

## college/verification-misc (20: FIXED-ON-MAIN 12, OPEN 8)

Audit: `docs/audit/pages/college/verification-misc.md` (and `verification-misc-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-verification-misc-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-verification-misc-01 | S2 | MISSING-ACTION | DONE |
| COL-verification-misc-03 | S2 | MISSING-ACTION | DONE |
| COL-verification-misc-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-verification-misc-05 | S2 | MISSING-FIELD | DONE |
| COL-verification-misc-07 | S2 | SIDE-EFFECT | DONE |
| COL-verification-misc-10 | S2 | STATE | DONE |
| COL-verification-misc-11 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-verification-misc-17 | S2 | PERMISSION | DONE |
| COL-verification-misc-02 | S3 | MISSING-FIELD | DONE |
| COL-verification-misc-06 | S3 | COPY | DONE |
| COL-verification-misc-08 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-verification-misc-12 | S3 | MISSING-ACTION | DONE |
| COL-verification-misc-13 | S3 | STATE | FIXED-ON-MAIN |
| COL-verification-misc-15 | S3 | STATE | DONE |
| COL-verification-misc-16 | S3 | PERMISSION | NOT-A-GAP |
| COL-verification-misc-18 | S3 | PERMISSION | NOT-A-GAP |
| COL-verification-misc-19 | S3 | STATE | NOT-A-GAP |
| COL-verification-misc-09 | S4 | COPY | DONE |
| COL-verification-misc-14 | S4 | MISSING-EXPORT | NOT-A-GAP |
| COL-verification-misc-20 | S4 | STATE | DONE |

## college/academic-people (9: OPEN 9)

Audit: `docs/audit/pages/college/academic-people.md` (and `academic-people-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-academic-people-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-academic-setup-R02 | S2 | STATE | DONE |
| COL-academic-setup-R03 | S2 | MISSING-ACTION | DONE |
| COL-academic-setup-R04 | S2 | VALIDATION | DONE |
| COL-people-R01 | S2 | VALIDATION | DONE |
| COL-people-R02 | S2 | PERMISSION | DONE |
| COL-academic-setup-R01 | S3 | STATE | DONE |
| COL-people-R03 | S3 | VALIDATION | OPEN |
| COL-academic-setup-R05 | S4 | VALIDATION | DONE |
| COL-courses-content-R01 | S4 | STATE | DONE |

## college/operations (7: OPEN 7)

Audit: `docs/audit/pages/college/operations.md` (and `operations-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-operations-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-attendance-R01 | S2 | VALIDATION | DONE |
| COL-attendance-R02 | S3 | SIDE-EFFECT | OPEN |
| COL-attendance-R03 | S3 | PERMISSION | DONE |
| COL-course-tabs-R01 | S3 | MISSING-FIELD | DONE |
| COL-placements-R01 | S3 | MISSING-EXPORT | OPEN |
| COL-projects-R02 | S3 | MISSING-FIELD | DONE |
| COL-placements-R02 | S4 | MISSING-FIELD | DONE |

## Chat-4 verified-closure round — 2026-10-17

- Super Admin Projects: 19 source-backed outcomes recorded in `docs/audit/acceptance/superadmin-placements-projects-b-projects-verification.md` with individual `SA-placements-projects-*` test names; includes 1 owner-approved `NOT-A-GAP` (archive/restore instead of an additional deleted bin). Exact copy restored for SA-placements-projects-52/57/63/73/78/79; 57 remains partially open because the one-workspace-per-student flow is missing.
- Super Admin Projects nonblocked remaining (not claimed DONE): SA-placements-projects-53/55/56/57/58/65/66/67/68/71/72/75/77/81/82/86/87/88/89/91/92/93; other IDs not in the acceptance file remain open pending full source and acceptance checks. Do not mark these BLOCKED merely because they are large.
- TPO Home: 11 source-backed outcomes in `docs/audit/acceptance/tpo-home-verification.md`, including new TPO-home-01 server-time IST greeting and persisted current-user display name; individual `TPO-home-*` behavioral tests or source contracts added.
- TPO Home nonblocked remaining: TPO-home-04/07/09/26/27/28 plus later S3/S4 gap rows not yet accepted; the 07 recruiter-access and 09 team-ask/overdue sources are not wired despite presentational row models. Live source data must not be invented; shell edits are chat-9 only.
- Aggregate verification recorded this round: 29 DONE and 1 NOT-A-GAP (30 gaps) across the first two page areas. No private storage, malware-scanner, provider-secret or owner-old-LMS-sign-in blocker encountered in these two verification groups. No tests, typecheck, lint, builds or CI runs by chat-4; orchestrator owns independent execution and final acceptance.

## Notes (blockers, one line each)
- COL-verification-misc-01/02 photo *upload* remains blocked on a private object-storage bucket and scanner; approved HTTPS photo links and editable profile fields are implemented.


## Chat-4 round 2 — verified gap closure and graceful UX (2026-10-17)

- **26 new gap-ID tests and acceptance entries** (12 TPO Home, 14 Super Admin Tenants/Modules), committed to `chatgpt/chat-4-b`, tests **written but NOT run**. Each recorded DONE item names its test in `docs/audit/acceptance/tpo-home-verification.md` or `docs/audit/acceptance/superadmin-tenants-modules-3-verification.md`.
- TPO Home DONE this round: `TPO-home-10/18/20/21/23/24/29/30/33/34/35/38`. Implemented legacy desktop 5:7 layout, loading skeleton, friendly Retry error boundary, no internal migration text or redundant requests panel, legacy record-finder empty/no-match copy, five-result section cap and hidden mark-all-read action when all notifications are read. Verified week row, New menu order, live header/message refresh and mark-on-open bell.
- Super Admin Tenants/Modules DONE this round: `SA-tenants-modules-41/42/44/51/52/55/56/58/59/61/62/63/65/66`. Source-backed checks for Activity presets/default date, new scope banner, mail triage/search, broadcast links/receipts/notification and limits, global Super Admin verification switch and bulk/sequential reviews.
- **Remaining OPEN** TPO Home priority gaps: `TPO-home-04/07/09/25/26/27/28` and remaining S3/S4 differences including `TPO-home-19/22/37`. The recruiter-access and team-ask counts still lack authoritative inputs, so don't mark 07/09 done just because the presenter formats them.
- **Remaining OPEN** Super Admin Tenants/Modules: `SA-tenants-modules-43/45/46/47/48/49/50/53/54/57/60/64/67/68` and any others without acceptance rows. Audit findings importer and inbound mail receiver need real integration; do not falsely certify through source strings.
- **Graceful operation:** shared `src/lib/friendly-error.ts` and `src/lib/api-fetch.ts` were absent on origin/main at round start, so the TPO error/loading states were made friendly locally; adopt chat-14 helpers and GR-30/32/70/71/72/73/90/91/92 as applicable after merge. Do not label absent helpers as formal BLOCKED; no private bucket, scanner, real provider credential or old-LMS sign-in blocker was discovered in this round.
- **Next queue page:** learner/home-courses (S2 first). No test, lint, typecheck, build or CI run by builder; orchestrator owns execution.

## Chat-4 round 3 — source-backed gap verification and friendly errors (2026-10-17)

- Synchronized `chatgpt/chat-4-b` to the latest merged origin/main before edits; never pushed to main.
- **26 gap outcomes** recorded individually in `docs/audit/acceptance/learner-home-courses-verification.md`, `college-course-tabs-verification.md`, `college-verification-misc-verification.md` with test names containing each ID. **23 DONE, 3 NOT-A-GAP**, all provisional pending orchestrator-run tests and integrated acceptance.
- Learner DONE: `LEARNER-home-courses-06/07/09/11/13/R01`. Added legacy error copy, tests for search, filtering, course-tab fallback and independent corrupt-card handling. Partial `LEARNER-home-courses-15/19/20/21` remain OPEN pending complete legacy parity; learner discussion POST/DELETE/PATCH now use `apiFetch` and retain draft on failed submit.
- College Course Tabs DONE: `COL-course-tabs-05/06/07/08/09/10/11/12/13/24`. Verified grade/quiz actions, Section-first progress, learner export, denominators, lessons, bulk visibility, page sizes. Bulk Lesson writes now use `apiFetch`; partial `COL-course-tabs-03/04/16/17/18/19` remain OPEN, especially private materials and Section ordering.
- College Verification/Misc DONE: `COL-verification-misc-01/02/03/05/07/12/15`. NOT-A-GAP: `COL-verification-misc-14` (privacy-preserving capped CSV), `-16` (owner allows scoped college announcements), `-19` (account-scoped notifications are an intentional improvement). Admin profile save now uses `apiFetch`; verified sequential decisions, history, status messages, activity shortcuts and explicit no-college alerts.
- Graceful behavior: introduced friendly API error handling and guarded double-submits in touched learner discussion, College lesson visibility and College profile editing; preserved input after failures. Other GR-30/32/60/70/71/90/91/92 gaps in all page surfaces still require stronger browser-level acceptance; do not count them as closed.
- No tests, typecheck, lint, builds, or CI executed by this lane; orchestrator owns actual test execution, typechecks and acceptance.

## Needs shell (chat-9 only)
- TPO-home-40 duplicate global notifications entry and TPO-home-44 global topbar placement belong to chat-9; chat-4 must not edit `src/components/shell`.

## Chat-4 next round after main merge — 26 gap IDs addressed (2026-10-17)

- Synced origin/main with a two-parent merge on `chatgpt/chat-4-b`; the only overlapping test file was reconciled with main's `read` helper, preserving new `COL-verification-misc-10` coverage and other chat-4 College changes. No force push, no main push.
- **Source-backed DONE (5, provisional pending orchestrator tests):** `LEARNER-home-courses-16` (one attendance summary with Present/Absent/Held and IST Day), `LEARNER-home-courses-20` (pinned author/count and own-message delete), `TPO-home-19` (visibility-return refresh), `TPO-home-37` (own-college notification refresh + friendly error/retry), `COL-verification-misc-09` (legacy label, guarded scoped settings save, retry and saved notice).
- **PARTIAL / still OPEN (21):** `TPO-home-R07`; `COL-verification-misc-04/08/11`; `COL-course-tabs-03/04/14/16/18`; `SA-placements-projects-53/55/58/65/66/71/75/81/82/86/88/89`. Gap-ID tests safeguard existing subbehavior, but the acceptance files explicitly enumerate legacy work not yet present. Do not count these as closed.
- Regression tests written but **not run**, with an ID-named test for each of the 26 outcomes in `tests/unit/chat4-{learner-home-courses,tpo-home,super-admin-projects,college-course-tabs,college-verification-misc}-gap-closure.test.ts`. Source-level acceptance records updated in those five page verification files. The orchestrator alone executes/certifies test and database results.
- Next queue: finish the still-open Projects template, readiness and team flows, TPO full palette/team/recruiter inputs, learner semester/setup/performance, College content materials and Section ordering, verification saved views, then later academic/operations pages. No package, migration, shared shell, auth or security edits by this lane.
- Blocked `COL-course-tabs-03/16` full private file materials and per-Section ordering: private object storage, scanner and registered DB05/runtime owner dependency; metadata and scoped filters remain usable. Continue unrelated open gaps without delay.


## Chat-4 next-round recovery — 2026-10-17

- Main fast-forwarded into `chatgpt/chat-4-b` before writes (main was 675 commits ahead; branch had no private commits).
- Corrected failing `SA-placements-projects-58` and `SA-placements-projects-63` expectations by restoring the specified project page descriptions and implementing explicit retryable mentor reassignment failure dialog; corrected stale Faculty zero-point assignment fixture (`FAC-assessments-R08`).
- Repaired missing `points` values in `courses-ui2a-faculty` and `faculty-section-authoring` TypeScript integration fixtures. Other owners' schema and course fixture errors are not claimed as resolved.
- `SA-placements-projects-58`: DONE (workload overload, deep links, success, partial-failure dialog and failed-only retry).
- `SA-placements-projects-56`: still OPEN/PARTIAL; scoped learner preflight now lists individual to-create/covered/duplicate decisions; remaining standalone team create fields and per-student failure details are not yet closed.
- Tests authored or repaired but **not run**; orchestrator must verify TypeScript, lint, unit and PostgreSQL.

## Chat-4 recovery continuation — verified UI closure (2026-10-17)

- `SA-placements-projects-93` DONE: existing transactional Manage students and Reassign mentor dialogs are both reachable from Team; replaced native confirm with accessible exact removal-count `ConfirmDialog` / `Replace roster`, retaining selections on conflict.
- `SA-tenants-modules-50` DONE: saved URL view/search/area/status/severity/kind/page filters under the legacy local-storage key; restoring only bounded allowlisted board-relative params, Clear resets saved view to default.
- SA-tenants-modules-46/47/48 and other unfinished filters/actions remain OPEN; no importer or drawer action is misrepresented as implemented.
- Tests were written but NOT RUN by chat-4; orchestrator is responsible for integrated verification.

- Source-reverified existing `SA-placements-projects-68` ten-section readiness navigation, `SA-placements-projects-72` confirmed submission review dialog, and `TPO-home-26` placements-disabled state; each had an ID-named existing test and existing code on synced main. Statuses moved from UNCONFIRMED to DONE; tests remain unrun.

## Owner UX playbook freeze, gap-and-CI-only round (2026-10-18)

- Owner ordered **STOP all UI/UX page work** until the single UX playbook is audited three times and signed off. Existing earlier UX page commits remain untouched; no additional restyling or UX checklist checkmarks in this round.
- Reconciled 34 stale `FIXED-ON-MAIN` entries to `DONE`: their existing page acceptance files already say DONE, and each has an ID-named regression contract in the corresponding chat-4 unit test. Source/evidence checked only; tests were NOT RUN by this lane. Orchestrator acceptance is still required.
- New work is limited to functional gaps and test/type repairs, not a design pass. Other incomplete OPEN/UNCONFIRMED entries remain open.

