# Gap closure queue: chat-3

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-3-b`. 194 gaps on 8 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/drives (53: OPEN 25, WRONG 1, FIXED-ON-MAIN 24, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/drives.md` (and `drives-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-drives-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-drives-01 | S2 | MISSING-PAGE | DONE |
| TPO-drives-03 | S2 | MISSING-TAB | WRONG |
| TPO-drives-05 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-06 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-07 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-09 | S2 | COPY | DONE |
| TPO-drives-10 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-drives-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-14 | S2 | SIDE-EFFECT | DONE |
| TPO-drives-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-17 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-drives-21 | S2 | COPY | DONE |
| TPO-drives-22 | S2 | COPY | DONE |
| TPO-drives-23 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drives-24 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-drives-26 | S2 | MISSING-ACTION | DONE |
| TPO-drives-28 | S2 | MISSING-FIELD | UNCONFIRMED |
| TPO-drives-31 | S2 | MISSING-ACTION | OPEN |
| TPO-drives-32 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drives-33 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drives-34 | S2 | MISSING-FIELD | UNCONFIRMED |
| TPO-drives-40 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drives-42 | S2 | VALIDATION | OPEN |
| TPO-drives-43 | S2 | STATE | OPEN |
| TPO-drives-47 | S2 | MISSING-MODAL | OPEN |
| TPO-drives-48 | S2 | MISSING-ACTION | OPEN |
| TPO-drives-04 | S3 | STATE | DONE |
| TPO-drives-08 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-11 | S3 | MISSING-FILTER | DONE |
| TPO-drives-12 | S3 | MISSING-ACTION | DONE |
| TPO-drives-16 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-18 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-19 | S3 | STATE | FIXED-ON-MAIN |
| TPO-drives-20 | S3 | PERMISSION | DONE |
| TPO-drives-25 | S3 | MISSING-FIELD | DONE |
| TPO-drives-27 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-29 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-30 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-35 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-37 | S3 | VALIDATION | DONE |
| TPO-drives-38 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-39 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-41 | S3 | STATE | OPEN |
| TPO-drives-44 | S3 | COPY | OPEN |
| TPO-drives-45 | S3 | VALIDATION | DONE |
| TPO-drives-49 | S3 | STATE | DONE |
| TPO-drives-50 | S3 | PERMISSION | OPEN |
| TPO-drives-51 | S3 | PERMISSION | NOT-A-GAP |
| TPO-drives-R03 | S3 | VALIDATION | DONE |
| TPO-drives-R05 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-drives-R06 | S3 | MISSING-ACTION | DONE |
| TPO-drives-36 | S4 | MISSING-ACTION | OPEN |
| TPO-drives-52 | S4 | MISSING-FIELD | OPEN |

## learner/learning-misc (36: OPEN 15, FIXED-ON-MAIN 19, UNCONFIRMED 2)

Audit: `docs/audit/pages/learner/learning-misc.md` (and `learning-misc-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-learning-misc-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-learning-misc-01 | S1 | STATE | OPEN |
| LEARNER-learning-misc-02 | S2 | MISSING-FIELD | OPEN |
| LEARNER-learning-misc-03 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-learning-misc-04 | S2 | MISSING-ACTION | OPEN |
| LEARNER-learning-misc-07 | S2 | VALIDATION | OPEN |
| LEARNER-learning-misc-09 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-learning-misc-10 | S3 | COPY | DONE |
| LEARNER-learning-misc-11 | S3 | MISSING-FIELD | OPEN |
| LEARNER-learning-misc-14 | S3 | COPY | DONE |
| LEARNER-learning-misc-15 | S3 | PERFORMANCE | OPEN |
| LEARNER-learning-misc-16 | S3 | MISSING-COLUMN | DONE |
| LEARNER-learning-misc-17 | S3 | COPY | DONE |
| LEARNER-learning-misc-18 | S3 | COPY | DONE |
| LEARNER-learning-misc-19 | S3 | STATE | DONE |
| LEARNER-learning-misc-20 | S3 | MISSING-MODAL | DONE |
| LEARNER-learning-misc-21 | S3 | COPY | DONE |
| LEARNER-learning-misc-22 | S3 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-learning-misc-24 | S3 | MISSING-FIELD | DONE |
| LEARNER-learning-misc-25 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-learning-misc-27 | S3 | SIDE-EFFECT | DONE |
| LEARNER-learning-misc-30 | S3 | MISSING-FIELD | DONE |
| LEARNER-learning-misc-33 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-34 | S3 | PERFORMANCE | OPEN |
| LEARNER-learning-misc-36 | S3 | MISSING-COLUMN | DONE |
| LEARNER-learning-misc-38 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-39 | S3 | COPY | DONE |
| LEARNER-learning-misc-12 | S4 | MISSING-ACTION | OPEN |
| LEARNER-learning-misc-13 | S4 | COPY | DONE |
| LEARNER-learning-misc-28 | S4 | COPY | DONE |
| LEARNER-learning-misc-29 | S4 | COPY | DONE |
| LEARNER-learning-misc-31 | S4 | MISSING-FIELD | DONE |
| LEARNER-learning-misc-32 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-35 | S4 | RESPONSIVE | FIXED-ON-MAIN |
| LEARNER-learning-misc-37 | S4 | COPY | DONE |
| LEARNER-learning-misc-40 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-41 | S4 | MISSING-PAGE | UNCONFIRMED |

## college/people (27: FIXED-ON-MAIN 19, UNCONFIRMED 3, OPEN 5)

Audit: `docs/audit/pages/college/people.md` (and `people-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-people-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-people-01 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-people-02 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-03 | S2 | MISSING-ACTION | DONE |
| COL-people-04 | S2 | MISSING-ACTION | DONE |
| COL-people-05 | S2 | MISSING-FIELD | DONE |
| COL-people-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-08 | S2 | MISSING-ACTION | DONE |
| COL-people-17 | S2 | MISSING-TAB | DONE |
| COL-people-20 | S2 | PERMISSION | DONE |
| COL-people-21 | S2 | MISSING-FIELD | DONE |
| COL-people-22 | S2 | MISSING-FILTER | DONE |
| COL-people-23 | S2 | SIDE-EFFECT | DONE |
| COL-people-06 | S3 | MISSING-ACTION | DONE |
| COL-people-10 | S3 | MISSING-ACTION | DONE |
| COL-people-11 | S3 | MISSING-ACTION | DONE |
| COL-people-13 | S3 | COPY | OPEN |
| COL-people-14 | S3 | MISSING-FIELD | DONE |
| COL-people-15 | S3 | COPY | DONE |
| COL-people-16 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-people-18 | S3 | PERMISSION | NOT-A-GAP |
| COL-people-19 | S3 | COPY | DONE |
| COL-people-24 | S3 | COPY | DONE |
| COL-people-25 | S3 | VALIDATION | FIXED-ON-MAIN |
| COL-people-09 | S4 | MISSING-ACTION | NOT-A-GAP |
| COL-people-12 | S4 | MISSING-ACTION | NOT-A-GAP |
| COL-people-26 | S4 | A11Y | FIXED-ON-MAIN |
| COL-people-27 | S4 | RESPONSIVE | DONE |

## public/auth-public-2-links-marketing (25: FIXED-ON-MAIN 13, OPEN 10, UNCONFIRMED 2)

Audit: `docs/audit/pages/public/auth-public-2-links-marketing.md` (and `auth-public-2-links-marketing-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/public-auth-public-2-links-marketing-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| PUB-auth-public-44 | S2 | VALIDATION | FIXED-ON-MAIN |
| PUB-auth-public-45 | S2 | STATE | FIXED-ON-MAIN |
| PUB-auth-public-46 | S2 | STATE | DONE |
| PUB-auth-public-47 | S2 | COPY | OPEN |
| PUB-auth-public-50 | S2 | PERMISSION | OPEN |
| PUB-auth-public-51 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| PUB-auth-public-52 | S2 | SIDE-EFFECT | OPEN |
| PUB-auth-public-53 | S2 | MISSING-COLUMN | OPEN |
| PUB-auth-public-55 | S2 | MISSING-EXPORT | OPEN |
| PUB-auth-public-56 | S2 | MISSING-FIELD | DONE |
| PUB-auth-public-59 | S2 | COPY | DONE |
| PUB-auth-public-67 | S2 | MISSING-PAGE | DONE |
| PUB-auth-public-68 | S2 | MISSING-PAGE | DONE |
| PUB-auth-public-48 | S3 | COPY | DONE |
| PUB-auth-public-49 | S3 | SIDE-EFFECT | UNCONFIRMED |
| PUB-auth-public-54 | S3 | MISSING-EXPORT | DONE |
| PUB-auth-public-57 | S3 | MISSING-FIELD | OPEN |
| PUB-auth-public-60 | S3 | SIDE-EFFECT | UNCONFIRMED |
| PUB-auth-public-58 | S4 | MISSING-FIELD | DONE |
| PUB-auth-public-61 | S4 | MISSING-PAGE | OPEN |
| PUB-auth-public-62 | S4 | MISSING-PAGE | DONE |
| PUB-auth-public-63 | S4 | MISSING-PAGE | DONE |
| PUB-auth-public-64 | S4 | MISSING-PAGE | DONE |
| PUB-auth-public-65 | S4 | MISSING-PAGE | DONE |
| PUB-auth-public-66 | S4 | MISSING-PAGE | DONE |

## superadmin/tenants-modules (21: OPEN 12, FIXED-ON-MAIN 9)

Audit: `docs/audit/pages/superadmin/tenants-modules.md` (and `tenants-modules-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-tenants-modules-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-tenants-modules-10 | S2 | VALIDATION | DONE |
| SA-tenants-modules-12 | S2 | VALIDATION | DONE |
| SA-tenants-modules-18 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-21 | S2 | MISSING-ACTION | DONE |
| SA-tenants-modules-03 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-04 | S3 | COPY | DONE |
| SA-tenants-modules-06 | S3 | MISSING-TAB | OPEN |
| SA-tenants-modules-07 | S3 | COPY | NOT-A-GAP |
| SA-tenants-modules-08 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-11 | S3 | MISSING-FIELD | DONE |
| SA-tenants-modules-13 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-14 | S3 | COPY | NOT-A-GAP |
| SA-tenants-modules-16 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-17 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| SA-tenants-modules-19 | S3 | MISSING-TAB | OPEN |
| SA-tenants-modules-23 | S3 | STATE | OPEN |
| SA-tenants-modules-R02 | S3 | MISSING-ACTION | DONE |
| SA-tenants-modules-05 | S4 | A11Y | FIXED-ON-MAIN |
| SA-tenants-modules-09 | S4 | STATE | DONE |
| SA-tenants-modules-R01 | S4 | MISSING-FIELD | OPEN |
| SA-tenants-modules-R03 | S4 | PERMISSION | NOT-A-GAP |

## college/courses-content (14: FIXED-ON-MAIN 8, UNCONFIRMED 2, OPEN 4)

Audit: `docs/audit/pages/college/courses-content.md` (and `courses-content-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-courses-content-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-courses-content-01 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-courses-content-02 | S2 | MISSING-FIELD | UNCONFIRMED |
| COL-courses-content-03 | S2 | MISSING-ACTION | OPEN |
| COL-courses-content-07 | S2 | MISSING-ACTION | DONE |
| COL-courses-content-08 | S2 | MISSING-FIELD | DONE |
| COL-courses-content-09 | S2 | MISSING-FILTER | DONE |
| COL-courses-content-11 | S2 | MISSING-ACTION | DONE |
| COL-courses-content-04 | S3 | MISSING-ACTION | DONE |
| COL-courses-content-05 | S3 | MISSING-COLUMN | OPEN |
| COL-courses-content-10 | S3 | STATE | DONE |
| COL-courses-content-12 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-courses-content-14 | S4 | MISSING-FILTER | DONE |
| COL-courses-content-16 | S4 | MISSING-PAGE | NOT-A-GAP |
| COL-courses-content-17 | S4 | STATE | OPEN |

## college/attendance (13: OPEN 11, UNCONFIRMED 2)

Audit: `docs/audit/pages/college/attendance.md` (and `attendance-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-attendance-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-attendance-03 | S3 | MISSING-COLUMN | DONE |
| COL-attendance-04 | S3 | MISSING-FIELD | DONE |
| COL-attendance-05 | S3 | STATE | DONE |
| COL-attendance-06 | S3 | STATE | DONE |
| COL-attendance-07 | S3 | VALIDATION | NOT-A-GAP |
| COL-attendance-09 | S3 | COPY | UNCONFIRMED |
| COL-attendance-11 | S3 | STATE | DONE |
| COL-attendance-16 | S3 | PERMISSION | DONE |
| COL-attendance-10 | S4 | COPY | OPEN |
| COL-attendance-12 | S4 | MISSING-EXPORT | DONE |
| COL-attendance-14 | S4 | MISSING-FIELD | OPEN |
| COL-attendance-15 | S4 | MISSING-FILTER | OPEN |
| COL-attendance-17 | S4 | A11Y | DONE |

## learner/profile-learning (5: OPEN 2, FIXED-ON-MAIN 3)

Audit: `docs/audit/pages/learner/profile-learning.md` (and `profile-learning-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-profile-learning-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-learning-misc-R01 | S2 | SIDE-EFFECT | OPEN |
| LEARNER-profile-misc-R01 | S3 | MISSING-MODAL / STATE | OPEN |
| LEARNER-profile-misc-R02 | S3 | MISSING-FIELD | DONE |
| LEARNER-profile-misc-R04 | S3 | VALIDATION | DONE |
| LEARNER-profile-misc-R05 | S4 | COPY / STATE | DONE |

## Round 2 — verified source closure (tests authored, not run)

Merged current `origin/main` into `chatgpt/chat-3-b` before work and checked again between page areas. The queue's prior status column is the **initial assignment**, not a claim about the merged commit. Exact per-gap evidence is in the files below.

- `college/courses-content`: 8 DONE (04, 07, 08, 09, 10, 11, 14, 15), 1 NOT-A-GAP (16); 6 OPEN (01, 02, 03, 05, 12, 17). Evidence `docs/audit/acceptance/college-courses-content-verification.md`; tests `tests/unit/college-courses-content-gap-closure.test.ts` (15 cases including COPY -15, not in the original queue).
- `college/attendance`: 8 DONE (03, 04, 05, 06, 11, 12, 13, 17), 1 NOT-A-GAP (07); 5 OPEN (09, 10, 14, 15, 16). Evidence `docs/audit/acceptance/college-attendance-verification.md`; tests `tests/unit/college-attendance-gap-closure.test.ts` (14 cases including improvement -13).
- `learner/profile-learning`: 3 DONE (R02, R04, R05), 2 OPEN (`LEARNER-learning-misc-R01`, `LEARNER-profile-misc-R01`). Evidence `docs/audit/acceptance/learner-profile-learning-verification.md`; tests `tests/unit/learner-profile-learning-gap-closure.test.ts` (5 cases).
- GR page adoption: `docs/audit/acceptance/graceful-chat-3-verification.md`; 9 ID-named tests in `tests/unit/chat-3-graceful-pages.test.ts`. Shared friendly-error/guarded hooks still absent from main at round start. No test, typecheck, lint or build was run by chat-3; orchestrator will execute.

**Round-2 source dispositions:** 19 DONE, 2 NOT-A-GAP, 13 still OPEN across 32 assigned gaps. Separate source-contract assertions on incomplete gaps are not counted DONE.

## Notes (blockers, one line each)

- COL-courses-content-02 (Course Image upload only): needs a private upload bucket, scanner and verified storage workflow; non-storage display fields remain OPEN for feature parity.

- PUB-auth-public-55: All-resume ZIP download remains blocked by production private document receipt/bucket and scanner readiness; do not fabricate PDFs or public signed links.

- LEARNER-learning-misc-01: Assignment file-upload acceptance needs real private bucket and scanner readiness; do not fake signed receipts.
- TPO-drives-27: JD file upload needs real private bucket and scanner readiness; no public storage URLs.
- COL-people-02/07: Canonical login identity edits stay restricted pending the approved identity verification workflow.

## Verified acceptance progress (source claims, tests not run)

- tpo/drives: 6 DONE + 1 NOT-A-GAP with gap-ID-named tests in `tests/unit/tpo-drives-gap-closure.test.ts` and page record in `docs/audit/acceptance/tpo-drives-verification.md`; the other gaps remain open/partial.
- learner/learning-misc: 11 DONE with gap-ID-named tests in `tests/unit/learner-learning-misc-gap-closure.test.ts` and page record in `docs/audit/acceptance/learner-learning-misc-verification.md`.
- college/people: 9 DONE with unit and disposable-PostgreSQL integration gap tests in `tests/unit/college-people-gap-closure.test.ts`, `tests/integration/college-people-gap-closure.test.ts`, and page record `docs/audit/acceptance/college-people-verification.md`.
- Current round: 42 DONE and 1 NOT-A-GAP source-level dispositions through Super Admin Tenants & Modules, subject to orchestrator acceptance; unexecuted tests are not proof of integration.
- superadmin/tenants-modules: 4 DONE, 11 ID-named tests in `tests/unit/superadmin-tenants-gap-closure.test.ts`, acceptance `docs/audit/acceptance/superadmin-tenants-modules-verification.md`; remaining gaps explicitly OPEN.
- public/auth-public-2-links-marketing: 12 DONE in `docs/audit/acceptance/public-auth-public-2-links-marketing-verification.md`, 18 ID-named tests in `tests/unit/public-auth-links-gap-closure.test.ts`; remaining open gaps have explicit reasons.

## Needs shell (chat-9 only)

- LEARNER-profile-misc-R01: chat-9 owns `src/components/shell/learner-topbar-tools.tsx`; replace plain Notifications link with a guarded, accessible eight-item drawer, refresh/read/error/stale states and View all link; no chat-3 edits in shell.



## Round 5 — 2026-10-17 (current source disposition; tests authored, not run)

Updated queue statuses above are authoritative for this round. The previous "Round 2" and "Verified acceptance progress" paragraphs are historical snapshots. Fast-forwarded the lane branch from the earlier main head, then merged the newer upstream main changes into `chatgpt/chat-3-b` with two parents and preserved concurrent `membership-protection.ts` integration; push only to this branch.

- **DONE**: `TPO-drives-49` frozen drive has exact closed-state recovery copy and a safe read-error boundary with Retry; test `tests/unit/tpo-drives-chat-3-round4.test.ts`. `COL-attendance-16` has guarded, confirmed Reset to default (75%, 24h) over the existing audited, tenant-scoped policy transaction; test `tests/unit/college-attendance-gap-closure.test.ts`. `COL-people-24` uses a guarded accessible reassign confirmation and exact outcome wording, preserves failed-only selection, and suppresses codes; test `tests/unit/college-people-gap-closure.test.ts`. `COL-people-19` now prioritizes search + category tabs with advanced filters available on demand. `COL-people-20` enforces Super Admin-only COLLEGE_ADMIN role grants **and** revocations via central permission policy while retaining upstream protected-membership safeguards; both IDs have tests in `tests/unit/college-people-gap-closure.test.ts`.
- **NOT-A-GAP**: `COL-people-09` permanent delete is intentionally replaced by suspend/end membership per approved OD-23; existing attendance and membership history are not deleted. Unit test named `COL-people-09`.
- **Remains OPEN after partial improvement**: `TPO-drives-39` (round presets need actual creation), `-42` (publish preflight still needs whole server/field parity), `-44` (not every domain error mapped), `-45` (end-of-day action exists but automatic default remains), `COL-courses-content-17` (offerings blocked; nested content dependencies uncounted). These are not counted as closed. Other OPEN rows remain assigned; no invented integration success.
- **Evidence**: `docs/audit/acceptance/tpo-drives-verification.md`, `college-attendance-verification.md`, `college-people-verification.md`. Changed pages and services are covered by ID-named source/unit tests. **No tests, typecheck, lint, build, database migrations or runtime checks were executed** in the lane.

## Round 6 — acceptance-backed queue reconciliation, 2026-10-17

**Authoritative source-status reconciliation**: 75 entries had acceptance records saying source-level DONE/NOT-A-GAP while their original queue table still said OPEN, UNCONFIRMED or FIXED-ON-MAIN. This update reconciles 25 formerly **OPEN** IDs, 3 formerly **UNCONFIRMED**, and 47 formerly **FIXED-ON-MAIN**. It does **not** claim 75 newly implemented features: the referenced work and ID-named tests were already committed (some by other lanes) and merged onto main. See the eight per-page acceptance files for source paths, outcomes, and exact named unit tests.

- From **OPEN** to source-DONE: `TPO-drives-01`, `TPO-drives-09`, `TPO-drives-22`, `TPO-drives-04`, `TPO-drives-R03`, `LEARNER-learning-misc-16`, `LEARNER-learning-misc-19`, `LEARNER-learning-misc-24`, `LEARNER-learning-misc-27`, `LEARNER-learning-misc-13`, `LEARNER-learning-misc-28`, `LEARNER-learning-misc-29`, `PUB-auth-public-46`, `PUB-auth-public-48`, `SA-tenants-modules-10`, `SA-tenants-modules-12`, `SA-tenants-modules-09`, `COL-courses-content-10`, `COL-attendance-03`, `COL-attendance-04`, `COL-attendance-05`, `COL-attendance-06`, `COL-attendance-11`, `COL-attendance-12`, `COL-attendance-17`.
- From **UNCONFIRMED** to source-NOT-A-GAP: `TPO-drives-51`, `COL-courses-content-16`, `COL-attendance-07`.
- Prior FIXED-ON-MAIN receipts moved to **DONE** only where existing per-ID acceptance documentation was explicit; 47 such receipts were verified against published ID-named test files.
- **Runtime disclaimer**: no new test suite, integration suite, lint, typecheck, build, or database tests have been executed by chat-3. Source-DONE means authored, reviewed and test-covered in existing work, **not** independently runtime-accepted. All other OPEN rows remain OPEN; no status was inferred from a passing build or from absence of a failure.

Evidence (already under `docs/audit/acceptance/`): `tpo-drives-verification.md`, `learner-learning-misc-verification.md`, `college-people-verification.md`, `superadmin-tenants-modules-verification.md`, `public-auth-public-2-links-marketing-verification.md`, `college-courses-content-verification.md`, `college-attendance-verification.md`, `learner-profile-learning-verification.md`.

## Round 7 — current source-level dispositions, October 17

Prior batches and fixed-on-main reconciliation are historical. This batch resolves: `TPO-drives-37`=DONE, `COL-people-12`=NOT-A-GAP, `COL-people-15`=DONE, `COL-people-27`=DONE, `SA-tenants-modules-04`=DONE, `SA-tenants-modules-07`=NOT-A-GAP, `SA-tenants-modules-14`=NOT-A-GAP, `SA-tenants-modules-R03`=NOT-A-GAP, `PUB-auth-public-54`=DONE. Named tests in `tests/unit/superadmin-tenants-gap-closure.test.ts`, `tests/unit/college-people-gap-closure.test.ts`, `tests/unit/tpo-drives-chat-3-round4.test.ts`, and `tests/unit/public-auth-links-gap-closure.test.ts`. Exact evidence lives in each page's acceptance document.

Still **OPEN** despite useful code: `TPO-drives-39` round mode/row editor (pending rounds now persist through a server readback-safe preset workflow); `TPO-drives-42/-43` server publication/idempotency; `COL-attendance-10` elective slot labels; `COL-people-13` private metric/contact columns; `SA-tenants-modules-06/-19` complete embedded tab/detail parity; `PUB-auth-public-47` review-drive invite title. Nothing here claims an unexecuted runtime test passed.

**Failing-unit report reconciliation**: the listed chat-3 source assertions `COL-courses-content-17`, `TPO-drives-39`, `TPO-drives-51`, `TPO-drives-42` now have corresponding source on this branch, including the real round workflow and exact preflight copy. Unit tests were authored/updated, **not run**; the orchestrator must refresh the failure report after running Vitest. No edits to other lane files or shared shell.

## Round 8 — verified mentor workspaces, tests unexecuted

`COL-people-21`, `COL-people-22`, and `COL-people-23` source-closed based on the real persisted workload query, cross-page mentor filter/selection, and tenant-scoped reassignment transaction which clears former-mentor task ownership and writes notifications for both mentors and learners. Added 3 gap-ID tests in `tests/unit/college-people-gap-closure.test.ts` and corresponding evidence in `docs/audit/acceptance/college-people-verification.md`. Tests/PG not executed; integration acceptance remains with orchestrator.

## Round 9 — additional verified dispositions

`TPO-drives-11` is source-DONE: the lifecycle dashboard now supplies all five persisted, tenant-scoped Needs doing categories with actual SQL counts and clickable filtered links; ID-named `tests/unit/tpo-drives-gap-closure.test.ts` upgraded and acceptance documented. `COL-people-18` is a deliberate privacy NOT-A-GAP: generic Contacts masks learner email and phone, with a separate need-to-know workflow required. `tests/unit/college-people-gap-closure.test.ts` checks this policy. **Tests have not been run in this lane.**

## Round 10 — recovery of archived tenants

`SA-tenants-modules-R02` source-DONE. Both archived organizations and archived colleges can be restored by Super Admin in an authorized scope through same-origin POST endpoints, guarded accessible confirmation, archived-state optimistic SQL and audit events. Parent organization must be ACTIVE before restoring college; organization name cannot conflict with another active one. Organization list and College detail expose recovery. `tests/unit/superadmin-tenants-gap-closure.test.ts` has named R02 test; PostgreSQL/runtime and browser testing remain **unexecuted**. Do not treat this as automatic restoration of child membership, DNS, credential, or runtime readiness.

## Chat-3 round 12 — owner UX freeze honored; source checks are not closures

- Merged `main` commit `40fb893d` into the chat-3 branch before edits; UX page styling is frozen pending a signed-off and three-times-audited playbook. No new teacher-page UX styling was pushed after that owner instruction.
- Corrected the four `tests/integration/courses-c3-progress.test.ts` missing `points` fixtures from the typecheck report; no tests or typecheck could be executed in this connector-only lane.
- Existing reported COL-people-20, TPO-drives-47, TPO-drives-51 test assertions match current source on the branch; do not delete or weaken the feature to make an old snapshot appear green.
- Source review: 39 distinct queued gap IDs have additive, ID-named **sub-contract** tests in `tests/unit/chat3-{tpo,learner,college}-round12-parity-contracts.test.ts`; 18 TPO, 11 learner, 10 college. Full gaps still OPEN/FIXED-ON-MAIN where the legacy workflow is incomplete. The page acceptance files record each ID without inflating DONE counts.
- Functional code progressed: `TPO-drives-R05`/`TPO-drives-44` validate known field keys using predefined safe text; `COL-attendance-09` now includes tenant-scoped ended deliveries and orders active first, with persisted `past` labels, but archived-term coverage remains incomplete. Added or strengthened ID-named tests. No migrations and no edits to the shared shell, auth or UX playbook.
- Delegated UNCONFIRMED `MEN-projects-meetings-71` decision is documented in `docs/audit/acceptance/mentor-projects-meetings-part2-verification.md` with an ID-named partial-source failure test; intentional fail-soft delivery is retained.
