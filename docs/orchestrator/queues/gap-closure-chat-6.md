# Gap closure queue: chat-6

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-6-b`. 189 gaps on 7 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## faculty/assessments (40: FIXED-ON-MAIN 26, WRONG 4, OPEN 10)

Audit: `docs/audit/pages/faculty/assessments.md` (and `assessments-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/faculty-assessments-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| FAC-assessments-01 | S1 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-assessments-02 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-assessments-03 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-assessments-04 | S2 | VALIDATION | FIXED-ON-MAIN |
| FAC-assessments-05 | S2 | STATE | FIXED-ON-MAIN |
| FAC-assessments-07 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| FAC-assessments-15 | S2 | VALIDATION | WRONG |
| FAC-assessments-R01 | S2 | VALIDATION | FIXED-ON-MAIN |
| FAC-assessments-R02 | S2 | VALIDATION | FIXED-ON-MAIN |
| FAC-assessments-06 | S3 | STATE | FIXED-ON-MAIN |
| FAC-assessments-08 | S3 | COPY | FIXED-ON-MAIN |
| FAC-assessments-09 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-assessments-10 | S3 | COPY | FIXED-ON-MAIN |
| FAC-assessments-11 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-assessments-12 | S3 | COPY | DONE |
| FAC-assessments-13 | S3 | STATE | DONE |
| FAC-assessments-16 | S3 | COPY | FIXED-ON-MAIN |
| FAC-assessments-17 | S3 | COPY | FIXED-ON-MAIN |
| FAC-assessments-23 | S3 | COPY | FIXED-ON-MAIN |
| FAC-assessments-27 | S3 | STATE | FIXED-ON-MAIN |
| FAC-assessments-29 | S3 | RESPONSIVE | FIXED-ON-MAIN |
| FAC-assessments-R03 | S3 | STATE | DONE |
| FAC-assessments-R04 | S3 | PERFORMANCE | DONE |
| FAC-assessments-14 | S4 | STATE | DONE |
| FAC-assessments-18 | S4 | VALIDATION | FIXED-ON-MAIN |
| FAC-assessments-19 | S4 | VALIDATION | FIXED-ON-MAIN |
| FAC-assessments-20 | S4 | MISSING-FIELD | NOT-A-GAP |
| FAC-assessments-21 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-assessments-22 | S4 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-assessments-24 | S4 | COPY | DONE |
| FAC-assessments-25 | S4 | MISSING-COLUMN | WRONG |
| FAC-assessments-26 | S4 | MISSING-ACTION | WRONG |
| FAC-assessments-28 | S4 | COPY | WRONG |
| FAC-assessments-30 | S4 | COPY | FIXED-ON-MAIN |
| FAC-assessments-R05 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-assessments-R06 | S4 | COPY | DONE |
| FAC-assessments-R07 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-assessments-R08 | S4 | VALIDATION | DONE |
| FAC-attendance-grades-R01 | S4 | VALIDATION | NOT-A-GAP |
| FAC-attendance-grades-R02 | S4 | VALIDATION | FIXED-ON-MAIN |

## superadmin/academics-people-3-people-recruiters (39: OPEN 18, FIXED-ON-MAIN 20, UNCONFIRMED 1)

Audit: `docs/audit/pages/superadmin/academics-people-3-people-recruiters.md` (and `academics-people-3-people-recruiters-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-academics-people-101 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-106 | S2 | PERMISSION | DONE |
| SA-academics-people-108 | S2 | MISSING-FIELD | DONE |
| SA-academics-people-109 | S2 | MISSING-ACTION | DONE |
| SA-academics-people-110 | S2 | MISSING-FIELD | DONE |
| SA-academics-people-116 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-80 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-81 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-82 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-83 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-85 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-88 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| SA-academics-people-93 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-94 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-95 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-96 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-100 | S3 | COPY | OPEN |
| SA-academics-people-102 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-103 | S3 | COPY | OPEN |
| SA-academics-people-104 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| SA-academics-people-105 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-107 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-academics-people-111 | S3 | VALIDATION | DONE |
| SA-academics-people-112 | S3 | STATE | DONE |
| SA-academics-people-113 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-114 | S3 | COPY | DONE |
| SA-academics-people-115 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-78 | S3 | COPY | DONE |
| SA-academics-people-79 | S3 | COPY | DONE |
| SA-academics-people-87 | S3 | MISSING-ACTION | NOT-A-GAP |
| SA-academics-people-89 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-90 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-91 | S3 | COPY | DONE |
| SA-academics-people-97 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-98 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-99 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-84 | S4 | MISSING-ACTION | NOT-A-GAP |
| SA-academics-people-86 | S4 | MISSING-ACTION | OPEN |
| SA-academics-people-92 | S4 | VALIDATION | OPEN |

## superadmin/academics-people-2-courses-content (30: FIXED-ON-MAIN 5, UNCONFIRMED 5, OPEN 20)

Audit: `docs/audit/pages/superadmin/academics-people-2-courses-content.md` (and `academics-people-2-courses-content-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-academics-people-58 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-59 | S1 | PERMISSION | FIXED-ON-MAIN |
| SA-academics-people-49 | S2 | MISSING-FIELD | UNCONFIRMED |
| SA-academics-people-50 | S2 | MISSING-FIELD | OPEN |
| SA-academics-people-52 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-53 | S2 | PERMISSION | OPEN |
| SA-academics-people-56 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-64 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-65 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-67 | S2 | MISSING-COLUMN | OPEN |
| SA-academics-people-72 | S2 | MISSING-MODAL | BLOCKED |
| SA-academics-people-77 | S2 | MISSING-ACTION | DONE |
| SA-academics-people-48 | S3 | COPY | DONE |
| SA-academics-people-51 | S3 | MISSING-ACTION | DONE |
| SA-academics-people-54 | S3 | MISSING-FILTER | OPEN |
| SA-academics-people-55 | S3 | COPY | OPEN |
| SA-academics-people-57 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-60 | S3 | MISSING-ACTION | BLOCKED |
| SA-academics-people-61 | S3 | MISSING-FILTER | DONE |
| SA-academics-people-62 | S3 | MISSING-COLUMN | OPEN |
| SA-academics-people-66 | S3 | MISSING-FILTER | DONE |
| SA-academics-people-68 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-69 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-academics-people-73 | S3 | STATE | DONE |
| SA-academics-people-74 | S3 | STATE | DONE |
| SA-academics-people-63 | S4 | COPY | DONE |
| SA-academics-people-70 | S4 | STATE | NOT-A-GAP |
| SA-academics-people-71 | S4 | COPY | DONE |
| SA-academics-people-75 | S4 | RESPONSIVE | DONE |
| SA-academics-people-76 | S4 | A11Y | NOT-A-GAP |

## college/placements (26: FIXED-ON-MAIN 16, UNCONFIRMED 3, OPEN 7)

Audit: `docs/audit/pages/college/placements.md` (and `placements-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-placements-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-placements-01 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-04 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| COL-placements-03 | S2 | MISSING-ACTION | UNCONFIRMED |
| COL-placements-05 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-placements-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-09 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-10 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-placements-12 | S2 | MISSING-FIELD | OPEN |
| COL-placements-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-placements-14 | S2 | MISSING-ACTION | OPEN |
| COL-placements-17 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| COL-placements-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-placements-20 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-placements-07 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-placements-11 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-placements-15 | S3 | MISSING-ACTION | UNCONFIRMED |
| COL-placements-16 | S3 | COPY | DONE |
| COL-placements-18 | S3 | PERMISSION | FIXED-ON-MAIN |
| COL-placements-21 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-placements-22 | S3 | STATE | NOT-A-GAP |
| COL-placements-23 | S3 | PERMISSION | NOT-A-GAP |
| COL-placements-24 | S3 | COPY | DONE |
| COL-placements-26 | S3 | MISSING-FIELD | DONE |
| COL-placements-25 | S4 | RESPONSIVE | DONE |

## superadmin/placements-projects-c-tracker (23: OPEN 20, FIXED-ON-MAIN 1, UNCONFIRMED 2)

Audit: `docs/audit/pages/superadmin/placements-projects-c-tracker.md` (and `placements-projects-c-tracker-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-placements-projects-101 | S2 | PERMISSION | NOT-A-GAP |
| SA-placements-projects-102 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-103 | S2 | MISSING-FIELD | BLOCKED |
| SA-placements-projects-113 | S2 | MISSING-PAGE | BLOCKED |
| SA-placements-projects-119 | S2 | MISSING-PAGE | DONE |
| SA-placements-projects-120 | S2 | MISSING-ACTION | BLOCKED |
| SA-placements-projects-104 | S3 | STATE | DONE |
| SA-placements-projects-105 | S3 | COPY | DONE |
| SA-placements-projects-106 | S3 | MISSING-ACTION | DONE |
| SA-placements-projects-109 | S3 | MISSING-FIELD | OPEN |
| SA-placements-projects-110 | S3 | COPY | DONE |
| SA-placements-projects-112 | S3 | COPY | DONE |
| SA-placements-projects-114 | S3 | MISSING-ACTION | OPEN |
| SA-placements-projects-115 | S3 | MISSING-ACTION | UNCONFIRMED |
| SA-placements-projects-116 | S3 | MISSING-ACTION | OPEN |
| SA-placements-projects-117 | S3 | MISSING-EXPORT | OPEN |
| SA-placements-projects-121 | S3 | MISSING-ACTION | DONE |
| SA-placements-projects-122 | S3 | MISSING-FILTER | DONE |
| SA-placements-projects-107 | S4 | MISSING-ACTION | DONE |
| SA-placements-projects-108 | S4 | MISSING-ACTION | DONE |
| SA-placements-projects-111 | S4 | MISSING-ACTION | DONE |
| SA-placements-projects-118 | S4 | PERMISSION | NOT-A-GAP |
| SA-placements-projects-123 | S4 | COPY | DONE |

## learner/profile-misc (19: OPEN 6, FIXED-ON-MAIN 13)

Audit: `docs/audit/pages/learner/profile-misc.md` (and `profile-misc-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-profile-misc-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-profile-misc-01 | S1 | MISSING-ACTION | BLOCKED |
| LEARNER-profile-misc-03 | S1 | MISSING-FIELD | BLOCKED |
| LEARNER-profile-misc-02 | S2 | MISSING-ACTION | BLOCKED |
| LEARNER-profile-misc-04 | S3 | MISSING-MODAL | BLOCKED |
| LEARNER-profile-misc-07 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-profile-misc-09 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-profile-misc-13 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-profile-misc-14 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-profile-misc-21 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-profile-misc-22 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| LEARNER-profile-misc-08 | S4 | COPY | NOT-A-GAP |
| LEARNER-profile-misc-10 | S4 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-profile-misc-11 | S4 | STATE | FIXED-ON-MAIN |
| LEARNER-profile-misc-12 | S4 | STATE | FIXED-ON-MAIN |
| LEARNER-profile-misc-18 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| LEARNER-profile-misc-23 | S4 | COPY | DONE |
| LEARNER-profile-misc-24 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-profile-misc-25 | S4 | STATE | FIXED-ON-MAIN |
| LEARNER-profile-misc-26 | S4 | COPY | FIXED-ON-MAIN |

## college/dashboard (12: FIXED-ON-MAIN 7, OPEN 4, UNCONFIRMED 1)

Audit: `docs/audit/pages/college/dashboard.md` (and `dashboard-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-dashboard-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-dashboard-03 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-04 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-05 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-06 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-08 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-10 | S2 | STATE | DONE |
| COL-dashboard-09 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-dashboard-14 | S3 | COPY | DONE |
| COL-dashboard-15 | S3 | STATE | DONE |
| COL-dashboard-16 | S4 | A11Y | DONE |
| COL-dashboard-17 | S4 | RESPONSIVE | DONE |

## Notes (blockers, one line each)

- LEARNER-profile-misc-01: resume upload/replace/Drive-import remains BLOCKED until a private bucket, malware scanner and signed learner upload receipts are provisioned; links alone are not resume files.
- LEARNER-profile-misc-03: Aadhaar/PAN and marksheet binary uploads remain BLOCKED until the same private storage/scanner and verified upload receipts exist; never store IDs or file URLs publicly.
- LEARNER-profile-misc-04: record/upload video intro remains BLOCKED on the private video bucket, scanner and safe camera-upload receipt workflow.

- FAC-assessments-01: PDF/file assignment resource uploads require the private object-storage bucket/scanner; existing text/method controls do not close full resource parity.
- FAC-assessments-22: inline private PDF submission preview requires a scoped storage download grant and scanner-ready files; do not expose permanent URLs.
- SA-academics-people-59: Super Admin binary video actor/grants require the private object-storage bucket; retain link-only content until provisioned.
- SA-academics-people-60: import video from arbitrary HTTPS URL requires private storage/scanner and anti-SSRF ingestion infrastructure.

### Chat-6 verified gap-closure progress, 2026-10-17

- Synced branch `chatgpt/chat-6-b` with the latest `main` (was 269 behind and 0 ahead; branch was fast-forwarded before edits). No pushes to `main`.
- Faculty Assessments: 21 dispositions (18 DONE, 3 NOT-A-GAP) across 2 source-contract test files and `faculty-assessments-verification.md`, including the course→lesson→Continue create entry; other S1/S2/S3 differences remain on this page.
- Super Admin People/Recruiters: 5 dispositions (3 DONE, 2 NOT-A-GAP), with scoped roles, legacy empty-state copy, faculty bulk importer and student program/class registration as evidence. Extra wording changes -91/-100/-103/-114 are partial and not certified as closed.
- Super Admin Courses/Content: 1 DONE (-69 four CSV routes). Binary video uploads/import remain BLOCKED on private storage.
- College Placements: 4 DONE (-01/-04/-05/-06) from persisted college pipeline and interview actions, with source-contract unit acceptance tests. Additional parity remains.
- Five unit test files total, each named case includes its gap ID; authored but NOT RUN (orchestrator executes). Acceptance records live under `docs/audit/acceptance/`.


### Chat-6 verified follow-up, 2026-10-17

- 25 gap-specific tests authored, NOT RUN, across four new source-contract test files. Faculty: FAC-assessments-11/14 DONE, -20 NOT-A-GAP. Super Admin People: SA-academics-people-89/98/102/104/105/107/113/116 DONE. College dashboard: COL-dashboard-03/04/05/06/07/08/09/14/15/16 DONE. College placements: COL-placements-07/08/09/21 DONE.
- New learner profile S1 blockers documented as LEARNER-profile-misc-01/03/04; private upload/preview must not be simulated. Larger open gaps and DB/browser-only acceptance remain for the orchestrator.

### Chat-6 round 2 verified-closure handoff (2026-10-17)

- Branch `chatgpt/chat-6-b` already contained origin/main on entry; no force-push or push to main. Source and acceptance edits pushed in scoped batches.
- 25 new gap dispositions: Super Admin Courses/Content `SA-academics-people-48/51/63/71/73` DONE and `-70/-76` NOT-A-GAP (7); Learner `LEARNER-profile-misc-07/09/10/11/12/13/14/21/22/23/26` DONE (11); College Placements `COL-placements-11/13/16/17/18/19` DONE and `-23` NOT-A-GAP (7). Total 23 DONE, 2 NOT-A-GAP.
- Tests authored, **not run**, named by gap ID and grouped by page area: `tests/unit/chat6-superadmin-content-round2.test.ts` (7 cases), `chat6-learner-notification-copy-round2.test.ts` (1), `chat6-learner-profile-round2-verified.test.ts` (10), `chat6-college-placements-round2-verified.test.ts` (6), `chat6-college-placements-copy-round2.test.ts` (1). Orchestrator must run unit, integration, typecheck and browser tests before independent acceptance.
- Graceful operation still needs GR-30/34/50/52/60/70/90 adoption in the remaining mutating and data-loading pages when chat-14 shared helpers reach main. Do not treat source-only named tests as complete runtime resilience.
- Remaining major items: Faculty `FAC-assessments-13/27/R01..R08`; Super Admin People unresolved actions and identity; Super Admin Courses/Content policy and editor parity; College Placements company editor/offer letter and application completeness; Super Admin tracker; Learner private uploads; College Dashboard failure isolation. Existing private storage/scanner blockers in Notes are unchanged.


### Chat-6 round 4 source-closure handoff (2026-10-17)

- Branch was fast-forwarded to main at the beginning of this round (no force-push). Main advanced again while changes were authored; the orchestrator should merge the current main into chatgpt/chat-6-b before accepting or merging.
- DONE (source-authored, unexecuted tests): SA-academics-people-68, SA-academics-people-74, SA-academics-people-79, COL-placements-20, COL-placements-26, SA-placements-projects-104. Cloud CI test repairs also cover SA-academics-people-114, SA-academics-people-63 and SA-tenants-modules-17/GR-30.
- OPEN (partial parity, not claimed DONE): SA-academics-people-54 (no course image, short title, refresh/page size), -55 (field/editor copy), -62 (private materials counts/preview), SA-placements-projects-112 (dark-mode switch and live Logs parity). Private binary operations SA-academics-people-58 and -72 remain BLOCKED by the storage/scanner provider; supported link-based metadata edits are safer.
- Cross-page tests authored but NOT RUN: tests/unit/chat6-cross-page-verification-round4.test.ts, chat6-superadmin-course-catalogue-round4.test.ts, chat6-tracker-parity-round4.test.ts. Existing unit tests for recruiter/content labels and tenant memberships were repaired on this branch; none has yet passed orchestrator CI in this round.
- NO numbered migrations, no writes to main or shell. The requested 25+ fully closed OPEN gaps were NOT reached in this round; continue per-page S1/S2 queue work after merging main and running orchestrator checks.

## Needs shell (chat-9 only)

- SA-placements-projects-102: chat-9 must mount the existing `src/components/tracker/tracker-quick-report-launcher.tsx` into the shared `src/components/shell/app-shell.tsx` for all authenticated roles, with permission-aware visibility and keyboard focus; chat-6 may not edit shell. Do not mark global-launcher parity DONE until mounted and keyboard-tested.


### Chat-6 current batch: verified formerly OPEN statuses

- Faculty FAC-assessments-12, FAC-assessments-13, FAC-assessments-14, FAC-assessments-20, FAC-assessments-24: tested on main with named cases, recorded in `docs/audit/acceptance/faculty-assessments-verification.md` (20 is OD-38 intentional scope).
- Super Admin People SA-academics-people-79, SA-academics-people-84, SA-academics-people-87, SA-academics-people-109, SA-academics-people-112, SA-academics-people-114: acceptance in `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md`; 84/87 follow OD-23 (no hard delete/impersonation).
- These are prior source-authored tests being reconciled, not claimed as newly run. Cloud test failures in SA-academics-people-58 and SA-academics-people-63 fixed in this batch.

- Super Admin Courses/Content: SA-academics-people-48, SA-academics-people-51, SA-academics-people-63, SA-academics-people-70, SA-academics-people-71, SA-academics-people-74, SA-academics-people-77, SA-academics-people-73 matched existing ID-named tests and recorded dispositions in `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md`; -70 is OD-38 authoritative-scope intentional difference. Tests not executed by lane.

- College Placements -16/-23/-24/-25/-26: prior source contracts, responsive cards, Hired stage and intentional placement-policy boundary verified against `docs/audit/acceptance/college-placements-verification.md` and named tests. Browser/DB tests pending.
- Super Admin Tracker -104/-105/-108/-110/-111: prior named tests and acceptance verified; -106/-107: new named source-contract tests in `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts`, acceptance appended. No tests executed by lane; browser/DB workflows await orchestrator.

- College Dashboard -10/-14/-15/-16 matched existing failure-isolation and copy/a11y tests, with dispositions in `docs/audit/acceptance/college-dashboard-verification.md`. Learner -23 matched notification copy and named test under `docs/audit/acceptance/learner-profile-misc-verification.md`. No tests run.

- SA-academics-people-78: existing named test `chat6-superadmin-people-verified-closure.test.ts` and people acceptance match the no-college wording.
- SA-placements-projects-112: real Light/Dark tracker mode, exact nav and keyboard skip control, named test `chat6-tracker-theme-nav-verification.test.ts`, acceptance updated. -118 is OD-27 Super Admin-only logs (new named policy test).
- Provider-only blockers: SA-academics-people-60/-72 and LEARNER-profile-misc-01/-02/-03/-04 need private scanned object storage; SA-placements-projects-103 needs same for screenshots; -113 needs Cloud Logging provider integration; -120 needs GitHub findings-import credentials. All have acceptance notes; do not fake uploads or provider responses.

- LEARNER-profile-misc-08: OD-38 retains safety-enhancing academic/verification separation and the privacy-aware career checklist. Named test `chat6-learner-safe-profile-enhancements.test.ts`; acceptance updated, not run.

- FAC-assessments-R06: report page now shows legacy Back, Submitted, Average score, Questions, Due date; named contract `tests/unit/chat6-faculty-quiz-report-header-r06.test.ts` and acceptance added (tests not run).

- SA-academics-people-76: intentionally accessible keyboard move controls per OD-38; existing named unit test and Courses/Content acceptance. SA-placements-projects-123: confirmed existing named tracker-title test and acceptance. Tests not run.
