# Gap closure queue: chat-12

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round, including the Throughput section). Branch: `chatgpt/chat-12-b`. 90 gaps on 2 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/students (56: FIXED-ON-MAIN 24, OPEN 29, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/students.md` (and `students-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-students-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-students-33 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-06 | S2 | MISSING-ACTION | OPEN |
| TPO-students-07 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-09 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-10 | S2 | MISSING-ACTION | OPEN |
| TPO-students-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-12 | S2 | MISSING-ACTION | OPEN |
| TPO-students-14 | S2 | MISSING-FIELD | OPEN |
| TPO-students-15 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-students-16 | S2 | MISSING-ACTION | OPEN |
| TPO-students-17 | S2 | MISSING-ACTION | OPEN |
| TPO-students-18 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-21 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-22 | S2 | MISSING-FILTER | OPEN |
| TPO-students-23 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-26 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-28 | S2 | MISSING-COLUMN | OPEN |
| TPO-students-29 | S2 | MISSING-FIELD | OPEN |
| TPO-students-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-31 | S2 | MISSING-FIELD | OPEN |
| TPO-students-32 | S2 | STATE | OPEN |
| TPO-students-34 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-36 | S2 | MISSING-EXPORT | OPEN |
| TPO-students-54 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-13 | S3 | MISSING-ACTION | OPEN |
| TPO-students-24 | S3 | MISSING-FILTER | OPEN |
| TPO-students-25 | S3 | MISSING-FILTER | OPEN |
| TPO-students-27 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-37 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-38 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-39 | S3 | MISSING-ACTION | OPEN |
| TPO-students-40 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-41 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-42 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-students-43 | S3 | MISSING-TAB | OPEN |
| TPO-students-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-46 | S3 | COPY | OPEN |
| TPO-students-47 | S3 | COPY | OPEN |
| TPO-students-49 | S3 | PERMISSION | UNCONFIRMED |
| TPO-students-50 | S3 | STATE | UNCONFIRMED |
| TPO-students-51 | S3 | RESPONSIVE | OPEN |
| TPO-students-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-R02 | S3 | STATE | FIXED-ON-MAIN |
| TPO-students-R03 | S3 | STATE | OPEN |
| TPO-students-R04 | S3 | STATE | OPEN |
| TPO-students-R05 | S3 | COPY | OPEN |
| TPO-students-R06 | S3 | COPY | OPEN |
| TPO-students-R07 | S3 | STATE | OPEN |
| TPO-students-R08 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-48 | S4 | STATE | OPEN |
| TPO-students-53 | S4 | MISSING-FIELD | OPEN |

## tpo/requests-verification (34: OPEN 15, FIXED-ON-MAIN 18, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/requests-verification.md` (and `requests-verification-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-requests-verification-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-requests-verification-01 | S1 | MISSING-ACTION | OPEN |
| TPO-requests-verification-02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-03 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-04 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-05 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-07 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-13 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-23 | S2 | STATE | OPEN |
| TPO-requests-verification-24 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-36 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-37 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-38 | S2 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-R02 | S2 | MISSING-FIELD | OPEN |
| TPO-requests-verification-06 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-09 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-10 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-12 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-14 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-15 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-17 | S3 | COPY | OPEN |
| TPO-requests-verification-25 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-27 | S3 | COPY | OPEN |
| TPO-requests-verification-28 | S3 | COPY | OPEN |
| TPO-requests-verification-29 | S3 | MISSING-FIELD | UNCONFIRMED |
| TPO-requests-verification-30 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-32 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-R01 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-R03 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-16 | S4 | PERFORMANCE | OPEN |
| TPO-requests-verification-18 | S4 | STATE | OPEN |
| TPO-requests-verification-21 | S4 | PERMISSION | OPEN |

## Notes (blockers, one line each)

## Needs shell (chat-9 only)

