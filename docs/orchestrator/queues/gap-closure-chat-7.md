# Gap closure queue: chat-7

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-7-b`. 224 gaps on 4 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## learner/placements (65: FIXED-ON-MAIN 28, OPEN 30, UNCONFIRMED 6, WRONG 1)

Audit: `docs/audit/pages/learner/placements.md` (and `placements-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-placements-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-placements-04 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-06 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-13 | S2 | MISSING-ACTION | OPEN |
| LEARNER-placements-20 | S2 | MISSING-FIELD | OPEN |
| LEARNER-placements-21 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-24 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-27 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-28 | S2 | MISSING-MODAL | OPEN |
| LEARNER-placements-29 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-31 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-placements-37 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-45 | S2 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-47 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-49 | S2 | SIDE-EFFECT | UNCONFIRMED |
| LEARNER-placements-51 | S2 | MISSING-FIELD | OPEN |
| LEARNER-placements-52 | S2 | MISSING-ACTION | OPEN |
| LEARNER-placements-53 | S2 | MISSING-FIELD | OPEN |
| LEARNER-placements-R01 | S2 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-R02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-R03 | S2 | SIDE-EFFECT | OPEN |
| LEARNER-placements-R04 | S2 | SIDE-EFFECT | OPEN |
| LEARNER-placements-R05 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-placements-01 | S3 | MISSING-FIELD | OPEN |
| LEARNER-placements-03 | S3 | COPY | OPEN |
| LEARNER-placements-05 | S3 | COPY | OPEN |
| LEARNER-placements-08 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-09 | S3 | STATE | OPEN |
| LEARNER-placements-11 | S3 | COPY | OPEN |
| LEARNER-placements-12 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-14 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-15 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-17 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-22 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-25 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-26 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-30 | S3 | STATE | OPEN |
| LEARNER-placements-32 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-34 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-36 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-placements-38 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-39 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-40 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-placements-41 | S3 | MISSING-FIELD | OPEN |
| LEARNER-placements-42 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-43 | S3 | STATE | OPEN |
| LEARNER-placements-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-placements-46 | S3 | MISSING-TAB | OPEN |
| LEARNER-placements-48 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-placements-54 | S3 | COPY | OPEN |
| LEARNER-placements-55 | S3 | COPY | OPEN |
| LEARNER-placements-R06 | S3 | MISSING-FIELD | OPEN |
| LEARNER-placements-R07 | S3 | STATE | OPEN |
| LEARNER-placements-02 | S4 | RESPONSIVE | OPEN |
| LEARNER-placements-10 | S4 | COPY | OPEN |
| LEARNER-placements-16 | S4 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-placements-18 | S4 | COPY | OPEN |
| LEARNER-placements-19 | S4 | PERFORMANCE | WRONG |
| LEARNER-placements-23 | S4 | VALIDATION | OPEN |
| LEARNER-placements-33 | S4 | COPY | OPEN |
| LEARNER-placements-56 | S4 | VALIDATION | OPEN |
| LEARNER-placements-57 | S4 | MISSING-PAGE | OPEN |
| LEARNER-placements-58 | S4 | MISSING-PAGE | OPEN |
| LEARNER-placements-R08 | S4 | STATE | OPEN |

## mentor/projects-meetings (58: FIXED-ON-MAIN 28, OPEN 30)

Audit: `docs/audit/pages/mentor/projects-meetings.md` (and `projects-meetings-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/mentor-projects-meetings-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| MEN-projects-meetings-11 | S2 | PERMISSION | FIXED-ON-MAIN |
| MEN-projects-meetings-12 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-31 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| MEN-projects-meetings-32 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-34 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-36 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-39 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-42 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| MEN-projects-meetings-50 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| MEN-projects-meetings-01 | S3 | STATE | OPEN |
| MEN-projects-meetings-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-04 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-05 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-06 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-08 | S3 | STATE | OPEN |
| MEN-projects-meetings-14 | S3 | COPY | OPEN |
| MEN-projects-meetings-15 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-18 | S3 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-19 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-21 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-23 | S3 | COPY | OPEN |
| MEN-projects-meetings-26 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-27 | S3 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-28 | S3 | COPY | OPEN |
| MEN-projects-meetings-30 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-33 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-35 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-37 | S3 | COPY | OPEN |
| MEN-projects-meetings-38 | S3 | COPY | OPEN |
| MEN-projects-meetings-40 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| MEN-projects-meetings-43 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-46 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-47 | S3 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-48 | S3 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-49 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| MEN-projects-meetings-51 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| MEN-projects-meetings-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| MEN-projects-meetings-R02 | S3 | VALIDATION | OPEN |
| MEN-projects-meetings-R03 | S3 | VALIDATION | OPEN |
| MEN-projects-meetings-R04 | S3 | STATE | OPEN |
| MEN-projects-meetings-R05 | S3 | STATE | OPEN |
| MEN-projects-meetings-R06 | S3 | STATE | OPEN |
| MEN-projects-meetings-R07 | S3 | VALIDATION | OPEN |
| MEN-projects-meetings-R08 | S3 | VALIDATION | OPEN |
| MEN-projects-meetings-02 | S4 | COPY | OPEN |
| MEN-projects-meetings-07 | S4 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-09 | S4 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-10 | S4 | PERFORMANCE | OPEN |
| MEN-projects-meetings-13 | S4 | STATE | FIXED-ON-MAIN |
| MEN-projects-meetings-24 | S4 | COPY | FIXED-ON-MAIN |
| MEN-projects-meetings-25 | S4 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-29 | S4 | VALIDATION | OPEN |
| MEN-projects-meetings-R09 | S4 | MISSING-FIELD | OPEN |
| MEN-projects-meetings-R10 | S4 | STATE | OPEN |
| MEN-projects-meetings-R11 | S4 | STATE | OPEN |

## recruiter/home-drives (58: OPEN 22, FIXED-ON-MAIN 32, UNCONFIRMED 4)

Audit: `docs/audit/pages/recruiter/home-drives.md` (and `home-drives-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/recruiter-home-drives-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| REC-home-drives-38 | S1 | MISSING-COLUMN | OPEN |
| REC-home-drives-14 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-24 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-25 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-26 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-33 | S2 | SIDE-EFFECT | OPEN |
| REC-home-drives-35 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-39 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| REC-home-drives-42 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-43 | S2 | MISSING-EXPORT | OPEN |
| REC-home-drives-48 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-49 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-R01 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| REC-home-drives-02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-04 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-05 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-06 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-08 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-10 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-15 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-16 | S3 | MISSING-FIELD | OPEN |
| REC-home-drives-17 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-18 | S3 | COPY | FIXED-ON-MAIN |
| REC-home-drives-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-23 | S3 | MISSING-FIELD | OPEN |
| REC-home-drives-27 | S3 | VALIDATION | OPEN |
| REC-home-drives-28 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-29 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-30 | S3 | STATE | OPEN |
| REC-home-drives-31 | S3 | COPY | OPEN |
| REC-home-drives-34 | S3 | COPY | OPEN |
| REC-home-drives-36 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-37 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-home-drives-40 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| REC-home-drives-41 | S3 | PERMISSION | OPEN |
| REC-home-drives-44 | S3 | MISSING-EXPORT | UNCONFIRMED |
| REC-home-drives-45 | S3 | STATE | OPEN |
| REC-home-drives-46 | S3 | COPY | OPEN |
| REC-home-drives-47 | S3 | STATE | OPEN |
| REC-home-drives-50 | S3 | COPY | OPEN |
| REC-home-drives-55 | S3 | COPY | OPEN |
| REC-home-drives-R02 | S3 | SIDE-EFFECT | UNCONFIRMED |
| REC-home-drives-R03 | S3 | PERMISSION | OPEN |
| REC-home-drives-R04 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-R05 | S3 | A11Y | FIXED-ON-MAIN |
| REC-home-drives-R06 | S3 | STATE | FIXED-ON-MAIN |
| REC-home-drives-09 | S4 | MISSING-ACTION | UNCONFIRMED |
| REC-home-drives-11 | S4 | COPY | OPEN |
| REC-home-drives-19 | S4 | PERMISSION | UNCONFIRMED |
| REC-home-drives-32 | S4 | STATE | OPEN |
| REC-home-drives-52 | S4 | MISSING-COLUMN | OPEN |
| REC-home-drives-53 | S4 | STATE | OPEN |
| REC-home-drives-54 | S4 | COPY | OPEN |
| REC-home-drives-56 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-home-drives-R07 | S4 | COPY | OPEN |
| REC-home-drives-R08 | S4 | PERFORMANCE | FIXED-ON-MAIN |

## faculty/courses (43: FIXED-ON-MAIN 33, OPEN 8, WRONG 2)

Audit: `docs/audit/pages/faculty/courses.md` (and `courses-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/faculty-courses-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| FAC-courses-14 | S1 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-10 | S2 | STATE | FIXED-ON-MAIN |
| FAC-courses-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-16 | S2 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-18 | S2 | STATE | FIXED-ON-MAIN |
| FAC-courses-01 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-04 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-05 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-08 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-09 | S3 | PERFORMANCE | OPEN |
| FAC-courses-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| FAC-courses-12 | S3 | MISSING-PAGE | FIXED-ON-MAIN |
| FAC-courses-15 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-20 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-22 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-23 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-24 | S3 | STATE | FIXED-ON-MAIN |
| FAC-courses-25 | S3 | STATE | FIXED-ON-MAIN |
| FAC-courses-26 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-27 | S3 | STATE | OPEN |
| FAC-courses-31 | S3 | COPY | OPEN |
| FAC-courses-34 | S3 | RESPONSIVE | FIXED-ON-MAIN |
| FAC-courses-R01 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| FAC-courses-R04 | S3 | COPY | FIXED-ON-MAIN |
| FAC-courses-R07 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-R08 | S3 | VALIDATION | FIXED-ON-MAIN |
| FAC-courses-06 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| FAC-courses-07 | S4 | COPY | FIXED-ON-MAIN |
| FAC-courses-17 | S4 | COPY | WRONG |
| FAC-courses-19 | S4 | MISSING-FIELD | OPEN |
| FAC-courses-21 | S4 | MISSING-ACTION | OPEN |
| FAC-courses-28 | S4 | MISSING-FIELD | WRONG |
| FAC-courses-29 | S4 | COPY | OPEN |
| FAC-courses-30 | S4 | COPY | FIXED-ON-MAIN |
| FAC-courses-32 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| FAC-courses-33 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| FAC-courses-35 | S4 | A11Y | FIXED-ON-MAIN |
| FAC-courses-R05 | S4 | STATE | OPEN |
| FAC-courses-R06 | S4 | STATE | OPEN |

## Notes (blockers, one line each)
- LEARNER-placements-20 BLOCKED: secure resume upload, preview and attachment receipts await private bucket and malware scanning.
- REC-home-drives-23 BLOCKED: secure PDF/Word job-description upload requires private storage and malware scanning.
- REC-home-drives-43 BLOCKED: resume ZIP with protected source documents requires the private scanned object store.
- FAC-courses-14 BLOCKED: lesson material uploads depend on a private object-store bucket and malware-scanning pipeline.
- GR-30/GR-70 adoption pending: shared friendly error and guarded-action helpers were not yet on main at the start of round 3; revisit all four pages after chat-14 merges.

- LEARNER-placements-20 BLOCKED: profile resume attachment and preview require an authenticated private object-storage bucket and malware-scanning service.

## Needs shell (chat-9 only)

