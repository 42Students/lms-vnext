# Gap closure queue: chat-9

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-9-b`. 225 gaps on 5 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/calendar-reports (56: OPEN 3, DONE-BRANCH 22, FIXED-ON-MAIN 30, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/calendar-reports.md` (and `calendar-reports-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-calendar-reports-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-calendar-reports-01 | S2 | MISSING-FIELD | DONE-BRANCH |
| TPO-calendar-reports-02 | S2 | VALIDATION | DONE-BRANCH |
| TPO-calendar-reports-10 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-19 | S2 | COPY | DONE-BRANCH |
| TPO-calendar-reports-23 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-calendar-reports-31 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-32 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| TPO-calendar-reports-35 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-calendar-reports-36 | S2 | COPY | DONE-BRANCH |
| TPO-calendar-reports-38 | S2 | COPY | DONE-BRANCH |
| TPO-calendar-reports-43 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-44 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-48 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-49 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-R01 | S2 | VALIDATION | DONE-BRANCH |
| TPO-calendar-reports-03 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-calendar-reports-04 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-08 | S3 | VALIDATION | DONE-BRANCH |
| TPO-calendar-reports-09 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-14 | S3 | RESPONSIVE | DONE-BRANCH |
| TPO-calendar-reports-15 | S3 | STATE | DONE-BRANCH |
| TPO-calendar-reports-16 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-17 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-18 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-37 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-39 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-40 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-41 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-42 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-45 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-46 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-47 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-52 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-calendar-reports-54 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-56 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-calendar-reports-57 | S3 | STATE | NOT-A-GAP |
| TPO-calendar-reports-R02 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-R03 | S3 | SIDE-EFFECT | DONE-BRANCH |
| TPO-calendar-reports-R04 | S3 | MISSING-FIELD | DONE-BRANCH |
| TPO-calendar-reports-R06 | S3 | COPY | DONE-BRANCH |
| TPO-calendar-reports-R08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-calendar-reports-07 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-12 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-13 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-21 | S4 | STATE | DONE-BRANCH |
| TPO-calendar-reports-22 | S4 | STATE | OPEN |
| TPO-calendar-reports-24 | S4 | SIDE-EFFECT | DONE-BRANCH |
| TPO-calendar-reports-25 | S4 | A11Y | DONE-BRANCH |
| TPO-calendar-reports-50 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-51 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-53 | S4 | STATE | OPEN |
| TPO-calendar-reports-55 | S4 | STATE | DONE-BRANCH |
| TPO-calendar-reports-58 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-R05 | S4 | STATE | FIXED-ON-MAIN |
| TPO-calendar-reports-R07 | S4 | PERFORMANCE | FIXED-ON-MAIN |

## tpo/settings-audit (56: FIXED-ON-MAIN 35, DONE-BRANCH 12, OPEN 5, UNCONFIRMED 2, NOT-A-GAP 2)

Audit: `docs/audit/pages/tpo/settings-audit.md` (and `settings-audit-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-settings-audit-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-settings-audit-53 | S1 | STATE | FIXED-ON-MAIN |
| TPO-settings-audit-03 | S2 | COPY | DONE-BRANCH |
| TPO-settings-audit-05 | S2 | PERMISSION | UNCONFIRMED |
| TPO-settings-audit-12 | S2 | MISSING-FIELD | UNCONFIRMED |
| TPO-settings-audit-20 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-settings-audit-23 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-settings-audit-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-31 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-32 | S2 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-33 | S2 | SIDE-EFFECT | DONE-BRANCH |
| TPO-settings-audit-40 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-41 | S2 | SIDE-EFFECT | OPEN |
| TPO-settings-audit-43 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-44 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-settings-audit-50 | S2 | MISSING-FIELD | OPEN |
| TPO-settings-audit-51 | S2 | MISSING-FIELD | OPEN |
| TPO-settings-audit-52 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-54 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-56 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-57 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-settings-audit-70 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-72 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-74 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-76 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-92 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-settings-audit-93 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-settings-audit-96 | S2 | COPY | DONE-BRANCH |
| TPO-settings-audit-R03 | S2 | STATE | NOT-A-GAP |
| TPO-settings-audit-04 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-06 | S3 | STATE | DONE-BRANCH |
| TPO-settings-audit-11 | S3 | VALIDATION | DONE-BRANCH |
| TPO-settings-audit-13 | S3 | COPY | DONE-BRANCH |
| TPO-settings-audit-14 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-settings-audit-24 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-settings-audit-25 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-42 | S3 | COPY | DONE-BRANCH |
| TPO-settings-audit-45 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-58 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-settings-audit-59 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-60 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-settings-audit-71 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-73 | S3 | COPY | DONE-BRANCH |
| TPO-settings-audit-75 | S3 | COPY | DONE-BRANCH |
| TPO-settings-audit-82 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-94 | S3 | COPY | DONE-BRANCH |
| TPO-settings-audit-95 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-97 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-98 | S3 | STATE | OPEN |
| TPO-settings-audit-99 | S3 | SIDE-EFFECT | DONE-BRANCH |
| TPO-settings-audit-R02 | S3 | VALIDATION | DONE-BRANCH |
| TPO-settings-audit-07 | S4 | RESPONSIVE | DONE-BRANCH |
| TPO-settings-audit-80 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-81 | S4 | MISSING-ACTION | NOT-A-GAP |
| TPO-settings-audit-R04 | S4 | MISSING-ACTION | FIXED-ON-MAIN |

## superadmin/placements-projects-a-placements (50: FIXED-ON-MAIN 27, OPEN 20, UNCONFIRMED 3)

Audit: `docs/audit/pages/superadmin/placements-projects-a-placements.md` (and `placements-projects-a-placements-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-placements-projects-a-placements-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-placements-projects-25 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-01 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-02 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-09 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-10 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| SA-placements-projects-12 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-13 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-17 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| SA-placements-projects-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-20 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-22 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-24 | S2 | MISSING-ACTION | DONE-BRANCH |
| SA-placements-projects-26 | S2 | MISSING-ACTION | DONE-BRANCH |
| SA-placements-projects-27 | S2 | MISSING-ACTION | DONE-BRANCH |
| SA-placements-projects-28 | S2 | MISSING-ACTION | DONE-BRANCH |
| SA-placements-projects-30 | S2 | MISSING-ACTION | DONE-BRANCH |
| SA-placements-projects-31 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-34 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-38 | S2 | PERMISSION | FIXED-ON-MAIN |
| SA-placements-projects-40 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-41 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-42 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-45 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-49 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-04 | S3 | COPY | DONE-BRANCH |
| SA-placements-projects-05 | S3 | MISSING-FIELD | OPEN |
| SA-placements-projects-08 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-11 | S3 | MISSING-ACTION | OPEN |
| SA-placements-projects-14 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-placements-projects-15 | S3 | STATE | DONE-BRANCH |
| SA-placements-projects-16 | S3 | STATE | DONE-BRANCH |
| SA-placements-projects-18 | S3 | MISSING-FIELD | OPEN |
| SA-placements-projects-21 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-23 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-29 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-35 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-36 | S3 | COPY | DONE-BRANCH |
| SA-placements-projects-37 | S3 | VALIDATION | UNCONFIRMED |
| SA-placements-projects-39 | S3 | SIDE-EFFECT | UNCONFIRMED |
| SA-placements-projects-43 | S3 | COPY | NOT-A-GAP |
| SA-placements-projects-44 | S3 | COPY | DONE-BRANCH |
| SA-placements-projects-46 | S3 | MISSING-FILTER | OPEN |
| SA-placements-projects-47 | S3 | MISSING-EXPORT | OPEN |
| SA-placements-projects-48 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-50 | S3 | COPY | DONE-BRANCH |
| SA-placements-projects-33 | S4 | MISSING-TAB | FIXED-ON-MAIN |

## superadmin/academics-people-1-academic-setup (45: FIXED-ON-MAIN 21, OPEN 21, UNCONFIRMED 3)

Audit: `docs/audit/pages/superadmin/academics-people-1-academic-setup.md` (and `academics-people-1-academic-setup-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-academics-people-1-academic-setup-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-academics-people-16 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-17 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-18 | S2 | MISSING-ACTION | OPEN |
| SA-academics-people-19 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-20 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-22 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-29 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-31 | S2 | MISSING-ACTION | UNCONFIRMED |
| SA-academics-people-38 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-R02 | S2 | PERMISSION | FIXED-ON-MAIN |
| SA-academics-people-01 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-02 | S3 | COPY | OPEN |
| SA-academics-people-03 | S3 | COPY | OPEN |
| SA-academics-people-04 | S3 | COPY | OPEN |
| SA-academics-people-06 | S3 | COPY | OPEN |
| SA-academics-people-07 | S3 | VALIDATION | OPEN |
| SA-academics-people-08 | S3 | STATE | OPEN |
| SA-academics-people-09 | S3 | STATE | OPEN |
| SA-academics-people-11 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-12 | S3 | MISSING-FIELD | OPEN |
| SA-academics-people-13 | S3 | COPY | OPEN |
| SA-academics-people-15 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-21 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-23 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-25 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-academics-people-28 | S3 | COPY | OPEN |
| SA-academics-people-30 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-32 | S3 | COPY | OPEN |
| SA-academics-people-33 | S3 | STATE | OPEN |
| SA-academics-people-41 | S3 | STATE | OPEN |
| SA-academics-people-46 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-academics-people-R03 | S3 | STATE | OPEN |
| SA-academics-people-R04 | S3 | SIDE-EFFECT | UNCONFIRMED |
| SA-academics-people-10 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-34 | S4 | STATE | OPEN |
| SA-academics-people-35 | S4 | PERFORMANCE | FIXED-ON-MAIN |
| SA-academics-people-36 | S4 | COPY | OPEN |
| SA-academics-people-37 | S4 | COPY | OPEN |
| SA-academics-people-39 | S4 | RESPONSIVE | UNCONFIRMED |
| SA-academics-people-40 | S4 | A11Y | FIXED-ON-MAIN |
| SA-academics-people-42 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-academics-people-43 | S4 | VALIDATION | OPEN |
| SA-academics-people-44 | S4 | VALIDATION | OPEN |
| SA-academics-people-45 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-academics-people-R05 | S4 | A11Y | OPEN |

## college/projects (18: FIXED-ON-MAIN 7, DONE-BRANCH 5, OPEN 5, NOT-A-GAP 1)

Audit: `docs/audit/pages/college/projects.md` (and `projects-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-projects-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-projects-03 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-projects-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-projects-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-projects-12 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-projects-13 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-projects-04 | S3 | MISSING-ACTION | OPEN |
| COL-projects-05 | S3 | MISSING-PAGE | NOT-A-GAP |
| COL-projects-08 | S3 | MISSING-EXPORT | DONE-BRANCH |
| COL-projects-15 | S3 | MISSING-MODAL | DONE-BRANCH |
| COL-projects-16 | S3 | MISSING-COLUMN | DONE-BRANCH |
| COL-projects-17 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-projects-19 | S3 | COPY | DONE-BRANCH |
| COL-projects-20 | S3 | STATE | DONE-BRANCH |
| COL-projects-09 | S4 | STATE | FIXED-ON-MAIN |
| COL-projects-18 | S4 | MISSING-FILTER | DONE-BRANCH |
| COL-projects-21 | S4 | COPY | DONE-BRANCH |
| COL-projects-22 | S4 | MISSING-FILTER | NOT-A-GAP |
| COL-projects-23 | S4 | RESPONSIVE | DONE-BRANCH |

## Notes (blockers, one line each)
- BLOCKED TPO-calendar-reports-23: ROUND_REMINDER provider-backed delivery and evening-before verification require real configured email provider credentials; no fake sends or delivery success claimed.
- BLOCKED TPO-calendar-reports-43: Resume uploaded/verified state requires the private object-storage bucket and scanner integration owned by the storage service.
- OPEN TPO-calendar-reports-31: Batch/branch/company/mode/pay category aggregation parity across all report APIs remains to implement; the verified company and summary table filters do not cover them all.
- OPEN TPO-calendar-reports-38: Legacy gallery subtitle and main report titles align, but remaining individual page descriptions need evidence review.
- DONE TPO-calendar-reports-R01: Selected outcomes now read persisted placement_drive_selections alongside released/accepted offers; model tests cover selection-only records (orchestrator to execute).


## Needs shell (chat-9 only)


## Round 2 handoff (2026-10-17)
- TPO Calendar/Reports verified-closure source pass: add and preserve gap-ID tests for prior-implemented S3/S4 calendar/report controls; fix blocked URL filter, future follow-up time, exact calendar copy, legacy report group and accreditation labels, remove internal unplaced IDs, remove warning pseudo-row, derive selection-only placed and employer contact, restore branch LPA columns. Exact IDs/evidence are in `docs/audit/acceptance/tpo-calendar-reports-verification.md`.
- OPEN TPO-calendar-reports-31/38/52/57: complete report-wide dimension filtering, remaining per-page copy, all-row export parity and seasonless reporting; no source-only claim of closure.
- BLOCKED TPO-calendar-reports-23: production round reminder delivery needs live provider credentials to verify end-to-end sends.
- BLOCKED TPO-calendar-reports-43: resume availability/verification requires private object-storage and malware-scanner integration.
- Shared graceful helpers `src/lib/friendly-error.ts` and `src/lib/api-fetch.ts` were absent from main when this round began; adopt when chat-14 merges them. `docs/orchestrator/queues/graceful-needs-shell.md` was absent; reviewed other available lane "Needs shell" sections and found no populated requests.
- Reassigned Super Admin placements and academic setup belong to chat-13: no edits by chat-9.

## Round 3 handoff (2026-10-17)
- Main bda21e4d6e8637e19f795ce205efb0f52d3c04e7 fast-forwarded into chatgpt/chat-9-b first. Only chat-9 branch was pushed.
- Shell GR-16/70/75, TPO-inbox-team-28/63, TPO-requests-verification-06/21, LEARNER-profile-misc-R01, TPO-home-40/44, PUB-auth-public-20/21/22/24: standalone widget boundaries and Retry, connectivity banner, validated unread counters, accessible eight-item learner drawer, TPO global messages badge and cross-tab sign-out. Tests and status in docs/audit/acceptance/graceful-shell-verification.md and docs/audit/acceptance/shell-dependencies-verification.md. Other lanes' Needs shell sections were reviewed.
- TPO-settings-audit-04/14/20/21/22/24/25/30/31/32/43/44/45/52/53/54/56/57/58/59/70/71/72/74/76/82/92/93/97: 29 gap-ID cases batched in tests/unit/chat9-tpo-settings-source-closure.test.ts; 15 source-level DONE and 14 partial OPEN, documented in docs/audit/acceptance/tpo-settings-audit-verification.md.
- TPO-settings-audit-21/31/43/72 and GR-32/70: shared apiFetch + InlineNotice now wired to those four save paths; tests/unit/chat9-tpo-settings-friendly-saves.test.ts. Editor drafts remain after failed saves.
- OPEN: TPO-settings-audit-22 removal/in-use drives, 31 student-side label display, 44 warnings on all other scheduling paths, 52 No end date, 57 remaining profile columns, 74 about/number configurator, 93 Excel; status intentionally remains OPEN for these partial implementations.
- OPEN: PUB-auth-public-29/31 outstanding cross-role shell journeys, TPO calendar-reports 14 nonverified gaps, and college/projects queue page still require work; do not claim all 225 complete.
- BLOCKED TPO-calendar-reports-23: live provider credentials required for delivered evening-before round reminder verification.
- BLOCKED TPO-calendar-reports-43: verified private resume storage and malware scanning integration not available to this lane.
- Chat-13 reassigned Super Admin placements and academic pages were not changed. Tests authored but never executed by chat-9.

## Round 3 college/projects continuation and precise open items
- COL-projects-03 OPEN (admin Overview/Resources edits are available; sprint/task plan edits remain Mentor-gated); COL-projects-06/07/12/13 DONE source-evidence, tests/unit/chat9-college-projects-s2-closure.test.ts and docs/audit/acceptance/college-projects-verification.md. Tests not run by builder.
- TPO-calendar-reports-15 DONE source-level: legacy TPO query scope for any status round on DRAFT/PUBLISHED drive, PUBLISHED-only deadlines and OPEN follow-ups; verified independently from admin calendar scope. Test tests/unit/chat9-calendar-legacy-event-scope.test.ts.
- TPO-inbox-team-28 OPEN: Team and Messages count producers exist, but Announcements requires its own authoritative unread count, not the personal Notifications total. No false count displayed.
- TPO-settings-audit-56 OPEN: extending timed grants works, but No end date is not offered. TPO-settings-audit-70 OPEN: optional SMS cap works, usage-this-month figure is not sourced.
- All source verification DONE entries still require orchestrator's tests, typecheck, lint and browser acceptance; none were run in this lane.


## Round 4 continuation — next 28 gaps and gap evidence (2026-10-17)

Merged latest origin/main before editing; no test, lint, typecheck or build runs. All writes are on `chatgpt/chat-9-b`; the orchestrator owns execution. See page-specific acceptance files.

- TPO calendar: TPO-calendar-reports-13/14/21/25 PARTIAL / OPEN with `tests/unit/chat9-calendar-adaptive-draft.test.ts`; instant company chips, mobile Agenda/desktop Week, unsaved follow-up guard and keyboard hour actions. TPO-calendar-reports-11 OPEN: color/count legend implemented with `chat9-calendar-event-legend.test.ts`, but multi-kind selection and a separate Talk type remain.
- TPO settings: TPO-settings-audit-03/06/13/42/73/75/94/96 PARTIAL / OPEN in `chat9-tpo-settings-legacy-graceful.test.ts`: legacy labels, readiness search and beforeunload safeguard, friendly apiFetch, sharing explanation, public status and audit names. Further S2 producer gaps TPO-settings-audit-05/12/22/33/41/44/50/51/52/56/70/74 remain open.
- College Projects: COL-projects-01/02/09/14/17 DONE source-level; COL-projects-10/11/19/20 PARTIAL / OPEN via existing functional implementations and `chat9-college-projects-round4-evidence.test.ts`; COL-projects-22 NOT-A-GAP (mentor/class/template filters were not legacy features). COL-projects-03/08/18/21/23 OPEN with partial source work. Visible-page safe CSV, card/table view, 10/20/50/100 sizing, archived shortcut and no-college recovery have been added. COL-projects-04/05/15/16 remain open and are next.
- The two reassigned Super Admin pages remain with chat-13; shell work from round 3 is already on main. Existing provider/bucket blockers TPO-calendar-reports-23 and -43 remain unchanged.

## Round 5 scoped implementation (2026-10-17)
- COL-projects-16 DONE source-level: template catalogue now has searchable table, all five section counts and scoped visible-row CSV.
- COL-projects-08 OPEN: template label displayed; legacy In progress/Ready/Blocked semantics remain unmapped.
- Tests authored but NOT run; orchestrator executes. Other gaps are not marked DONE by this source patch.

- TPO-calendar-reports-11 DONE source-level: multi-select calendar chips, independent Talks and Rounds, backward-compatible single-kind URLs. Test authored, not run.

- COL-projects-15 OPEN: Team tab has validated preselected bulk-reassignment deep link; full per-member legacy roster actions remain unverified.

- COL-projects-18 OPEN: project Audit now filters resource events by Added/Edited/Saved/Removed and searches text, with persisted event-type model; exact Saved event origin unverified.

- TPO-calendar-reports-21 DONE source: draft confirmation on escape/cancel/navigation/reload in both follow-up dialogs; orchestrator UI tests outstanding.
- TPO-calendar-reports-14 DONE source: verified responsive TPO view defaults and mobile agenda against actual existing implementation; browser checks outstanding.

- TPO-calendar-reports-24 DONE source: transactional activity event on follow-up create and move; test written and not executed.

- TPO-calendar-reports-55 DONE source: no empty snapshot on failure, explicit alert and Retry; source test authored.

## Main CI unit-failure inventory (2026-10-17)
- Fixed test fixture `chat9-tpo-calendar-needs` hours with `padStart` (2099-02-04 09,10,11; not invalid 010/011).
- Updated `chat9-super-admin-college-create-copy` source expectation from raw fetch to shared safe `apiFetch`; `colleges-domain` slug normalization expectation to lowercase `eec`.
- Updated tenant-domain service and DB01 positive authorization fixtures to the current superadmin-only policy without weakening negative college/TPO permission tests.
- `notification-providers` tests now read Headers correctly after outbound transport added `new Headers`; `src/lib/outbound.ts` redacts exception detail before structured provider logging (leaked PII/OTP prevented). Tests not run.

- TPO-calendar-reports-25 OPEN: hour Enter activates Add, Escape/cancel focus restored; Enter-to-Move on existing followup not yet paritied.

## Round 5 — full S2/S3/S4 TPO calendar-reports queue reconciliation
- Reviewed 25 next OPEN entries. 20 have existing (or Round 5) DONE acceptance evidence and a gap-ID test in the branch; queue marked DONE-BRANCH only, NOT merged or CI verified.
- Remaining OPEN after this 25-gap group: TPO-calendar-reports-38, TPO-calendar-reports-57, TPO-calendar-reports-22, TPO-calendar-reports-25, TPO-calendar-reports-53.
- TPO-calendar-reports-38: remaining report-page subtitle parity; -57: seasonless report totals; -22: last-good cached calendar data/partial banner; -25: Enter on existing follow-up should open Move; -53: full-width report states and unknown slug recovery. All still OPEN; no unverified closure claim.
- Source tests are written but never run by builder; the orchestrator performs tests, typecheck, lint and UI acceptance.

## Round 6 CI failure triage
- `public-auth-login-gap-verification.test.ts` PUB-auth-public-04 and PUB-auth-public-12: assertions updated to the retained legacy-approved OTP expired phrase and the `sessionExpiredHref` safe redirect helper; guard still requires 401/session revoked/expired checks. Tests written, not executed by builder.
- Other chat-9 test fixture fixes from previous merged round retained; scanner and provider checks continue to be audited.

- Round 6 source close TPO-calendar-reports-25/-38 and TPO-settings-audit-06/-11; proof in tests/unit/chat9-round6-calendar-settings.test.ts; tests NOT RUN.

- TPO-settings-audit-33/-73/-75 DONE source-level; -03/-94/-96 still OPEN with partial improvements. `tests/unit/chat9-round6-tpo-settings-and-audit.test.ts` written; not run.

- TPO-settings-audit-03/-13 DONE source, -42 improved but OPEN (course list cap 200). Tests authored; orchestrator runs.

- COL-projects-16/-19/-20 DONE source and COL-projects-22 NOT-A-GAP; tests/unit/chat9-round6-college-projects-parity.test.ts authored, tests NOT run.

- Round 6: TPO-settings-audit-42/-07 DONE-BRANCH; no 200-course truncation and responsive grouped navigation; tests written not run.

- COL-projects-10/-11 VERIFIED-ON-MAIN, -18/-23 DONE-BRANCH. Tests authored, not run; browser narrow-width acceptance outstanding.

- Round 6 evidence: R02 DONE-BRANCH, R03/81 NOT-A-GAP, COL-projects-09/17 FIXED-ON-MAIN verified. Test file chat9-round6-reviewed-not-a-gaps.test.ts, not run.

- Round 6: TPO-settings-audit-94/-96 and COL-projects-21 improved but OPEN. TPO-settings-audit-07 sticky left desktop layout refined. Source tests unrun.

- Unit CI `api-origin-guard` resolved source-level: Telegram provider webhook uses mandatory x-telegram-bot-api-secret-token and is a documented ALLOWED exception (not a cookie endpoint). `tests/unit/api-origin-guard.test.ts` — `api-origin-guard telegram webhook accepts only the provider secret without a browser session`. Tests authored, NOT run.
