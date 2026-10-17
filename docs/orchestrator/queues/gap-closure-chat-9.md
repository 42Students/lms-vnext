# Gap closure queue: chat-9

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-9-b`. 225 gaps on 5 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/calendar-reports (56: OPEN 25, FIXED-ON-MAIN 30, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/calendar-reports.md` (and `calendar-reports-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-calendar-reports-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-calendar-reports-01 | S2 | MISSING-FIELD | OPEN |
| TPO-calendar-reports-02 | S2 | VALIDATION | OPEN |
| TPO-calendar-reports-10 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-19 | S2 | COPY | OPEN |
| TPO-calendar-reports-23 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-calendar-reports-31 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-32 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| TPO-calendar-reports-35 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-calendar-reports-36 | S2 | COPY | OPEN |
| TPO-calendar-reports-38 | S2 | COPY | OPEN |
| TPO-calendar-reports-43 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-44 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-48 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-49 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-R01 | S2 | VALIDATION | OPEN |
| TPO-calendar-reports-03 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-calendar-reports-04 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-08 | S3 | VALIDATION | OPEN |
| TPO-calendar-reports-09 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-14 | S3 | RESPONSIVE | OPEN |
| TPO-calendar-reports-15 | S3 | STATE | OPEN |
| TPO-calendar-reports-16 | S3 | COPY | OPEN |
| TPO-calendar-reports-17 | S3 | COPY | OPEN |
| TPO-calendar-reports-18 | S3 | COPY | OPEN |
| TPO-calendar-reports-37 | S3 | COPY | OPEN |
| TPO-calendar-reports-39 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-40 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-41 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-42 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-45 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-46 | S3 | COPY | OPEN |
| TPO-calendar-reports-47 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-calendar-reports-52 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-calendar-reports-54 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-calendar-reports-56 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-calendar-reports-57 | S3 | STATE | OPEN |
| TPO-calendar-reports-R02 | S3 | COPY | OPEN |
| TPO-calendar-reports-R03 | S3 | SIDE-EFFECT | OPEN |
| TPO-calendar-reports-R04 | S3 | MISSING-FIELD | OPEN |
| TPO-calendar-reports-R06 | S3 | COPY | OPEN |
| TPO-calendar-reports-R08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-calendar-reports-07 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-12 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-13 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-calendar-reports-21 | S4 | STATE | OPEN |
| TPO-calendar-reports-22 | S4 | STATE | OPEN |
| TPO-calendar-reports-24 | S4 | SIDE-EFFECT | OPEN |
| TPO-calendar-reports-25 | S4 | A11Y | OPEN |
| TPO-calendar-reports-50 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-51 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-53 | S4 | STATE | OPEN |
| TPO-calendar-reports-55 | S4 | STATE | OPEN |
| TPO-calendar-reports-58 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-calendar-reports-R05 | S4 | STATE | FIXED-ON-MAIN |
| TPO-calendar-reports-R07 | S4 | PERFORMANCE | FIXED-ON-MAIN |

## tpo/settings-audit (56: FIXED-ON-MAIN 35, OPEN 17, UNCONFIRMED 4)

Audit: `docs/audit/pages/tpo/settings-audit.md` (and `settings-audit-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-settings-audit-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-settings-audit-53 | S1 | STATE | FIXED-ON-MAIN |
| TPO-settings-audit-03 | S2 | COPY | OPEN |
| TPO-settings-audit-05 | S2 | PERMISSION | UNCONFIRMED |
| TPO-settings-audit-12 | S2 | MISSING-FIELD | UNCONFIRMED |
| TPO-settings-audit-20 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-settings-audit-23 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-settings-audit-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-31 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-32 | S2 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-33 | S2 | SIDE-EFFECT | OPEN |
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
| TPO-settings-audit-96 | S2 | COPY | OPEN |
| TPO-settings-audit-R03 | S2 | STATE | UNCONFIRMED |
| TPO-settings-audit-04 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-06 | S3 | STATE | OPEN |
| TPO-settings-audit-11 | S3 | VALIDATION | OPEN |
| TPO-settings-audit-13 | S3 | COPY | OPEN |
| TPO-settings-audit-14 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-settings-audit-24 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-settings-audit-25 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-42 | S3 | COPY | OPEN |
| TPO-settings-audit-45 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-58 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-settings-audit-59 | S3 | COPY | FIXED-ON-MAIN |
| TPO-settings-audit-60 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-settings-audit-71 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-settings-audit-73 | S3 | COPY | OPEN |
| TPO-settings-audit-75 | S3 | COPY | OPEN |
| TPO-settings-audit-82 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-94 | S3 | COPY | OPEN |
| TPO-settings-audit-95 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-97 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-98 | S3 | STATE | OPEN |
| TPO-settings-audit-99 | S3 | SIDE-EFFECT | OPEN |
| TPO-settings-audit-R02 | S3 | VALIDATION | OPEN |
| TPO-settings-audit-07 | S4 | RESPONSIVE | OPEN |
| TPO-settings-audit-80 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-settings-audit-81 | S4 | MISSING-ACTION | UNCONFIRMED |
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
| SA-placements-projects-24 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-26 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-27 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-28 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-30 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-31 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-34 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-38 | S2 | PERMISSION | FIXED-ON-MAIN |
| SA-placements-projects-40 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-41 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-42 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-45 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-49 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-04 | S3 | COPY | OPEN |
| SA-placements-projects-05 | S3 | MISSING-FIELD | OPEN |
| SA-placements-projects-08 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-11 | S3 | MISSING-ACTION | OPEN |
| SA-placements-projects-14 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-placements-projects-15 | S3 | STATE | OPEN |
| SA-placements-projects-16 | S3 | STATE | OPEN |
| SA-placements-projects-18 | S3 | MISSING-FIELD | OPEN |
| SA-placements-projects-21 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-23 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-29 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-35 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-36 | S3 | COPY | OPEN |
| SA-placements-projects-37 | S3 | VALIDATION | UNCONFIRMED |
| SA-placements-projects-39 | S3 | SIDE-EFFECT | UNCONFIRMED |
| SA-placements-projects-43 | S3 | COPY | OPEN |
| SA-placements-projects-44 | S3 | COPY | OPEN |
| SA-placements-projects-46 | S3 | MISSING-FILTER | OPEN |
| SA-placements-projects-47 | S3 | MISSING-EXPORT | OPEN |
| SA-placements-projects-48 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-50 | S3 | COPY | OPEN |
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

## college/projects (18: FIXED-ON-MAIN 5, OPEN 10, UNCONFIRMED 3)

Audit: `docs/audit/pages/college/projects.md` (and `projects-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-projects-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-projects-03 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-projects-06 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-projects-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-projects-12 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-projects-13 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-projects-04 | S3 | MISSING-ACTION | OPEN |
| COL-projects-05 | S3 | MISSING-PAGE | OPEN |
| COL-projects-08 | S3 | MISSING-EXPORT | OPEN |
| COL-projects-15 | S3 | MISSING-MODAL | OPEN |
| COL-projects-16 | S3 | MISSING-COLUMN | OPEN |
| COL-projects-17 | S3 | MISSING-FILTER | UNCONFIRMED |
| COL-projects-19 | S3 | COPY | OPEN |
| COL-projects-20 | S3 | STATE | OPEN |
| COL-projects-09 | S4 | STATE | UNCONFIRMED |
| COL-projects-18 | S4 | MISSING-FILTER | UNCONFIRMED |
| COL-projects-21 | S4 | COPY | OPEN |
| COL-projects-22 | S4 | MISSING-FILTER | OPEN |
| COL-projects-23 | S4 | RESPONSIVE | OPEN |

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
