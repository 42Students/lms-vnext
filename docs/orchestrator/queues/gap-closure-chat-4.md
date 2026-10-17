# Gap closure queue: chat-4

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-4-b`. 194 gaps on 8 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## superadmin/placements-projects-b-projects (41: OPEN 15, FIXED-ON-MAIN 22, UNCONFIRMED 4)

Audit: `docs/audit/pages/superadmin/placements-projects-b-projects.md` (and `placements-projects-b-projects-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-placements-projects-b-projects-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-placements-projects-51 | S2 | MISSING-PAGE | OPEN |
| SA-placements-projects-56 | S2 | MISSING-ACTION | OPEN |
| SA-placements-projects-60 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-62 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-64 | S2 | MISSING-FIELD | OPEN |
| SA-placements-projects-65 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-69 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| SA-placements-projects-70 | S2 | STATE | FIXED-ON-MAIN |
| SA-placements-projects-77 | S2 | SIDE-EFFECT | UNCONFIRMED |
| SA-placements-projects-81 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-82 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-85 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| SA-placements-projects-88 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-89 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-90 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-91 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-52 | S3 | COPY | OPEN |
| SA-placements-projects-53 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-54 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-57 | S3 | COPY | OPEN |
| SA-placements-projects-58 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-placements-projects-59 | S3 | MISSING-FILTER | OPEN |
| SA-placements-projects-61 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-63 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-66 | S3 | MISSING-COLUMN | OPEN |
| SA-placements-projects-67 | S3 | STATE | OPEN |
| SA-placements-projects-68 | S3 | STATE | UNCONFIRMED |
| SA-placements-projects-71 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-placements-projects-72 | S3 | MISSING-ACTION | UNCONFIRMED |
| SA-placements-projects-73 | S3 | COPY | OPEN |
| SA-placements-projects-74 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-placements-projects-75 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-placements-projects-76 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| SA-placements-projects-78 | S3 | COPY | OPEN |
| SA-placements-projects-79 | S3 | COPY | OPEN |
| SA-placements-projects-80 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-86 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-placements-projects-87 | S3 | MISSING-ACTION | OPEN |
| SA-placements-projects-92 | S3 | STATE | OPEN |
| SA-placements-projects-55 | S4 | MISSING-FILTER | OPEN |
| SA-placements-projects-93 | S4 | MISSING-ACTION | OPEN |

## tpo/home (39: OPEN 18, FIXED-ON-MAIN 18, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/home.md` (and `home-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-home-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-home-01 | S2 | COPY | OPEN |
| TPO-home-04 | S2 | MISSING-FIELD | OPEN |
| TPO-home-05 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-06 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-07 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-08 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-09 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-13 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-26 | S2 | STATE | UNCONFIRMED |
| TPO-home-27 | S2 | PERMISSION | UNCONFIRMED |
| TPO-home-28 | S2 | MISSING-MODAL | OPEN |
| TPO-home-42 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-43 | S2 | RESPONSIVE | FIXED-ON-MAIN |
| TPO-home-10 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-17 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-home-18 | S3 | RESPONSIVE | OPEN |
| TPO-home-19 | S3 | STATE | OPEN |
| TPO-home-20 | S3 | STATE | OPEN |
| TPO-home-21 | S3 | COPY | OPEN |
| TPO-home-23 | S3 | COPY | OPEN |
| TPO-home-25 | S3 | PERMISSION | UNCONFIRMED |
| TPO-home-29 | S3 | COPY | OPEN |
| TPO-home-30 | S3 | COPY | OPEN |
| TPO-home-32 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-home-34 | S3 | STATE | OPEN |
| TPO-home-36 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-37 | S3 | STATE | OPEN |
| TPO-home-39 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-home-40 | S3 | COPY | OPEN |
| TPO-home-41 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-home-R04 | S3 | STATE | FIXED-ON-MAIN |
| TPO-home-R05 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-R06 | S3 | COPY | OPEN |
| TPO-home-R07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-home-R08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-home-22 | S4 | STATE | OPEN |
| TPO-home-24 | S4 | COPY | OPEN |
| TPO-home-38 | S4 | COPY | OPEN |
| TPO-home-44 | S4 | RESPONSIVE | OPEN |

## superadmin/tenants-modules-3 (28: OPEN 11, FIXED-ON-MAIN 14, UNCONFIRMED 3)

Audit: `docs/audit/pages/superadmin/tenants-modules-3.md` (and `tenants-modules-3-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-tenants-modules-3-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-tenants-modules-46 | S2 | MISSING-ACTION | OPEN |
| SA-tenants-modules-47 | S2 | MISSING-ACTION | OPEN |
| SA-tenants-modules-51 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-54 | S2 | SIDE-EFFECT | UNCONFIRMED |
| SA-tenants-modules-57 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-63 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-65 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-41 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-42 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-43 | S3 | COPY | OPEN |
| SA-tenants-modules-44 | S3 | STATE | OPEN |
| SA-tenants-modules-48 | S3 | MISSING-FILTER | OPEN |
| SA-tenants-modules-52 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-53 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-tenants-modules-55 | S3 | PERMISSION | FIXED-ON-MAIN |
| SA-tenants-modules-58 | S3 | MISSING-FIELD | OPEN |
| SA-tenants-modules-59 | S3 | MISSING-COLUMN | OPEN |
| SA-tenants-modules-60 | S3 | STATE | UNCONFIRMED |
| SA-tenants-modules-62 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| SA-tenants-modules-64 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| SA-tenants-modules-66 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-67 | S3 | COPY | OPEN |
| SA-tenants-modules-68 | S3 | MISSING-FIELD | UNCONFIRMED |
| SA-tenants-modules-45 | S4 | STATE | OPEN |
| SA-tenants-modules-49 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-50 | S4 | MISSING-FILTER | OPEN |
| SA-tenants-modules-56 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-61 | S4 | VALIDATION | OPEN |

## learner/home-courses (27: FIXED-ON-MAIN 14, UNCONFIRMED 2, OPEN 11)

Audit: `docs/audit/pages/learner/home-courses.md` (and `home-courses-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-home-courses-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-course-detail-R02 | S2 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-home-courses-01 | S2 | COPY / MISSING-PAGE (landing) | UNCONFIRMED |
| LEARNER-home-courses-14 | S2 | MISSING-FIELD / SIDE-EFFECT | UNCONFIRMED |
| LEARNER-course-detail-R01 | S3 | STATE / VALIDATION | OPEN |
| LEARNER-course-detail-R03 | S3 | STATE / MISSING-ACTION | OPEN |
| LEARNER-course-detail-R04 | S3 | PERFORMANCE | OPEN |
| LEARNER-home-courses-02 | S3 | MISSING-FILTER | OPEN |
| LEARNER-home-courses-03 | S3 | STATE / COPY | OPEN |
| LEARNER-home-courses-04 | S3 | MISSING-FIELD / COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-05 | S3 | COPY / MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-home-courses-08 | S3 | PERFORMANCE | FIXED-ON-MAIN |
| LEARNER-home-courses-09 | S3 | COPY / STATE | FIXED-ON-MAIN |
| LEARNER-home-courses-12 | S3 | COPY | OPEN |
| LEARNER-home-courses-16 | S3 | COPY | OPEN |
| LEARNER-home-courses-19 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-21 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-home-courses-R01 | S3 | STATE | FIXED-ON-MAIN |
| LEARNER-home-courses-06 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-07 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| LEARNER-home-courses-10 | S4 | STATE | OPEN |
| LEARNER-home-courses-11 | S4 | STATE | FIXED-ON-MAIN |
| LEARNER-home-courses-13 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-home-courses-15 | S4 | COPY / MISSING-ACTION | FIXED-ON-MAIN |
| LEARNER-home-courses-18 | S4 | PERFORMANCE | OPEN |
| LEARNER-home-courses-20 | S4 | MISSING-FIELD / PERMISSION | FIXED-ON-MAIN |
| LEARNER-home-courses-22 | S4 | PERFORMANCE | OPEN |
| LEARNER-home-courses-23 | S4 | COPY | OPEN |

## college/course-tabs (23: FIXED-ON-MAIN 16, OPEN 4, UNCONFIRMED 3)

Audit: `docs/audit/pages/college/course-tabs.md` (and `course-tabs-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-course-tabs-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-course-tabs-03 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-04 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-05 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-06 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-08 | S1 | MISSING-TAB | FIXED-ON-MAIN |
| COL-course-tabs-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-09 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-10 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-course-tabs-11 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-course-tabs-12 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-16 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-17 | S2 | MISSING-ACTION | OPEN |
| COL-course-tabs-14 | S3 | MISSING-ACTION | OPEN |
| COL-course-tabs-15 | S3 | STATE | UNCONFIRMED |
| COL-course-tabs-18 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-19 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-course-tabs-22 | S3 | STATE | OPEN |
| COL-course-tabs-23 | S3 | STATE | UNCONFIRMED |
| COL-course-tabs-26 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-course-tabs-24 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-course-tabs-25 | S4 | PERMISSION | UNCONFIRMED |
| COL-course-tabs-27 | S4 | RESPONSIVE | OPEN |

## college/verification-misc (20: FIXED-ON-MAIN 12, OPEN 8)

Audit: `docs/audit/pages/college/verification-misc.md` (and `verification-misc-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-verification-misc-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-verification-misc-01 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-verification-misc-03 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-verification-misc-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-verification-misc-05 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-verification-misc-07 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| COL-verification-misc-10 | S2 | STATE | OPEN |
| COL-verification-misc-11 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-verification-misc-17 | S2 | PERMISSION | OPEN |
| COL-verification-misc-02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-verification-misc-06 | S3 | COPY | OPEN |
| COL-verification-misc-08 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| COL-verification-misc-12 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-verification-misc-13 | S3 | STATE | FIXED-ON-MAIN |
| COL-verification-misc-15 | S3 | STATE | FIXED-ON-MAIN |
| COL-verification-misc-16 | S3 | PERMISSION | OPEN |
| COL-verification-misc-18 | S3 | PERMISSION | OPEN |
| COL-verification-misc-19 | S3 | STATE | OPEN |
| COL-verification-misc-09 | S4 | COPY | OPEN |
| COL-verification-misc-14 | S4 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-verification-misc-20 | S4 | STATE | OPEN |

## college/academic-people (9: OPEN 9)

Audit: `docs/audit/pages/college/academic-people.md` (and `academic-people-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-academic-people-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-academic-setup-R02 | S2 | STATE | OPEN |
| COL-academic-setup-R03 | S2 | MISSING-ACTION | OPEN |
| COL-academic-setup-R04 | S2 | VALIDATION | OPEN |
| COL-people-R01 | S2 | VALIDATION | OPEN |
| COL-people-R02 | S2 | PERMISSION | OPEN |
| COL-academic-setup-R01 | S3 | STATE | OPEN |
| COL-people-R03 | S3 | VALIDATION | OPEN |
| COL-academic-setup-R05 | S4 | VALIDATION | OPEN |
| COL-courses-content-R01 | S4 | STATE | OPEN |

## college/operations (7: OPEN 7)

Audit: `docs/audit/pages/college/operations.md` (and `operations-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-operations-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-attendance-R01 | S2 | VALIDATION | OPEN |
| COL-attendance-R02 | S3 | SIDE-EFFECT | OPEN |
| COL-attendance-R03 | S3 | PERMISSION | OPEN |
| COL-course-tabs-R01 | S3 | MISSING-FIELD | OPEN |
| COL-placements-R01 | S3 | MISSING-EXPORT | OPEN |
| COL-projects-R02 | S3 | MISSING-FIELD | OPEN |
| COL-placements-R02 | S4 | MISSING-FIELD | OPEN |

## Notes (blockers, one line each)

## Needs shell (chat-9 only)

