# Gap closure queue: chat-3

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-3-b`. 194 gaps on 8 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/drives (53: OPEN 25, WRONG 1, FIXED-ON-MAIN 24, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/drives.md` (and `drives-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-drives-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-drives-01 | S2 | MISSING-PAGE | OPEN |
| TPO-drives-03 | S2 | MISSING-TAB | WRONG |
| TPO-drives-05 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-06 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-07 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-09 | S2 | COPY | OPEN |
| TPO-drives-10 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-drives-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-14 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-drives-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-17 | S2 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-drives-21 | S2 | COPY | FIXED-ON-MAIN |
| TPO-drives-22 | S2 | COPY | OPEN |
| TPO-drives-23 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drives-24 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-drives-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
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
| TPO-drives-04 | S3 | STATE | OPEN |
| TPO-drives-08 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drives-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-drives-12 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-16 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-18 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-drives-19 | S3 | STATE | FIXED-ON-MAIN |
| TPO-drives-20 | S3 | PERMISSION | FIXED-ON-MAIN |
| TPO-drives-25 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-27 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-29 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-30 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-35 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-37 | S3 | VALIDATION | OPEN |
| TPO-drives-38 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-39 | S3 | MISSING-FIELD | OPEN |
| TPO-drives-41 | S3 | STATE | OPEN |
| TPO-drives-44 | S3 | COPY | OPEN |
| TPO-drives-45 | S3 | VALIDATION | OPEN |
| TPO-drives-49 | S3 | STATE | OPEN |
| TPO-drives-50 | S3 | PERMISSION | OPEN |
| TPO-drives-51 | S3 | PERMISSION | UNCONFIRMED |
| TPO-drives-R03 | S3 | VALIDATION | OPEN |
| TPO-drives-R05 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-drives-R06 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
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
| LEARNER-learning-misc-10 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-11 | S3 | MISSING-FIELD | OPEN |
| LEARNER-learning-misc-14 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-15 | S3 | PERFORMANCE | OPEN |
| LEARNER-learning-misc-16 | S3 | MISSING-COLUMN | OPEN |
| LEARNER-learning-misc-17 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-18 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-19 | S3 | STATE | OPEN |
| LEARNER-learning-misc-20 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| LEARNER-learning-misc-21 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-22 | S3 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-learning-misc-24 | S3 | MISSING-FIELD | OPEN |
| LEARNER-learning-misc-25 | S3 | MISSING-FIELD | UNCONFIRMED |
| LEARNER-learning-misc-27 | S3 | SIDE-EFFECT | OPEN |
| LEARNER-learning-misc-30 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-learning-misc-33 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-34 | S3 | PERFORMANCE | OPEN |
| LEARNER-learning-misc-36 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| LEARNER-learning-misc-38 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-39 | S3 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-12 | S4 | MISSING-ACTION | OPEN |
| LEARNER-learning-misc-13 | S4 | COPY | OPEN |
| LEARNER-learning-misc-28 | S4 | COPY | OPEN |
| LEARNER-learning-misc-29 | S4 | COPY | OPEN |
| LEARNER-learning-misc-31 | S4 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-learning-misc-32 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-35 | S4 | RESPONSIVE | FIXED-ON-MAIN |
| LEARNER-learning-misc-37 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-40 | S4 | COPY | FIXED-ON-MAIN |
| LEARNER-learning-misc-41 | S4 | MISSING-PAGE | UNCONFIRMED |

## college/people (27: FIXED-ON-MAIN 19, UNCONFIRMED 3, OPEN 5)

Audit: `docs/audit/pages/college/people.md` (and `people-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-people-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-people-01 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-people-02 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-03 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-05 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-people-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-17 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| COL-people-20 | S2 | PERMISSION | UNCONFIRMED |
| COL-people-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-people-22 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-people-23 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| COL-people-06 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-10 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-11 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-people-13 | S3 | COPY | OPEN |
| COL-people-14 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-people-15 | S3 | COPY | OPEN |
| COL-people-16 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| COL-people-18 | S3 | PERMISSION | FIXED-ON-MAIN |
| COL-people-19 | S3 | COPY | OPEN |
| COL-people-24 | S3 | COPY | OPEN |
| COL-people-25 | S3 | VALIDATION | FIXED-ON-MAIN |
| COL-people-09 | S4 | MISSING-ACTION | OPEN |
| COL-people-12 | S4 | MISSING-ACTION | UNCONFIRMED |
| COL-people-26 | S4 | A11Y | FIXED-ON-MAIN |
| COL-people-27 | S4 | RESPONSIVE | UNCONFIRMED |

## public/auth-public-2-links-marketing (25: FIXED-ON-MAIN 13, OPEN 10, UNCONFIRMED 2)

Audit: `docs/audit/pages/public/auth-public-2-links-marketing.md` (and `auth-public-2-links-marketing-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/public-auth-public-2-links-marketing-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| PUB-auth-public-44 | S2 | VALIDATION | FIXED-ON-MAIN |
| PUB-auth-public-45 | S2 | STATE | FIXED-ON-MAIN |
| PUB-auth-public-46 | S2 | STATE | OPEN |
| PUB-auth-public-47 | S2 | COPY | OPEN |
| PUB-auth-public-50 | S2 | PERMISSION | OPEN |
| PUB-auth-public-51 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| PUB-auth-public-52 | S2 | SIDE-EFFECT | OPEN |
| PUB-auth-public-53 | S2 | MISSING-COLUMN | OPEN |
| PUB-auth-public-55 | S2 | MISSING-EXPORT | OPEN |
| PUB-auth-public-56 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| PUB-auth-public-59 | S2 | COPY | FIXED-ON-MAIN |
| PUB-auth-public-67 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-68 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-48 | S3 | COPY | OPEN |
| PUB-auth-public-49 | S3 | SIDE-EFFECT | UNCONFIRMED |
| PUB-auth-public-54 | S3 | MISSING-EXPORT | OPEN |
| PUB-auth-public-57 | S3 | MISSING-FIELD | OPEN |
| PUB-auth-public-60 | S3 | SIDE-EFFECT | UNCONFIRMED |
| PUB-auth-public-58 | S4 | MISSING-FIELD | FIXED-ON-MAIN |
| PUB-auth-public-61 | S4 | MISSING-PAGE | OPEN |
| PUB-auth-public-62 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-63 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-64 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-65 | S4 | MISSING-PAGE | FIXED-ON-MAIN |
| PUB-auth-public-66 | S4 | MISSING-PAGE | FIXED-ON-MAIN |

## superadmin/tenants-modules (21: OPEN 12, FIXED-ON-MAIN 9)

Audit: `docs/audit/pages/superadmin/tenants-modules.md` (and `tenants-modules-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/superadmin-tenants-modules-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| SA-tenants-modules-10 | S2 | VALIDATION | OPEN |
| SA-tenants-modules-12 | S2 | VALIDATION | OPEN |
| SA-tenants-modules-18 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-21 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-03 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| SA-tenants-modules-04 | S3 | COPY | OPEN |
| SA-tenants-modules-06 | S3 | MISSING-TAB | OPEN |
| SA-tenants-modules-07 | S3 | COPY | OPEN |
| SA-tenants-modules-08 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-11 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-13 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| SA-tenants-modules-14 | S3 | COPY | OPEN |
| SA-tenants-modules-16 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| SA-tenants-modules-17 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| SA-tenants-modules-19 | S3 | MISSING-TAB | OPEN |
| SA-tenants-modules-23 | S3 | STATE | OPEN |
| SA-tenants-modules-R02 | S3 | MISSING-ACTION | OPEN |
| SA-tenants-modules-05 | S4 | A11Y | FIXED-ON-MAIN |
| SA-tenants-modules-09 | S4 | STATE | OPEN |
| SA-tenants-modules-R01 | S4 | MISSING-FIELD | OPEN |
| SA-tenants-modules-R03 | S4 | PERMISSION | OPEN |

## college/courses-content (14: FIXED-ON-MAIN 8, UNCONFIRMED 2, OPEN 4)

Audit: `docs/audit/pages/college/courses-content.md` (and `courses-content-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-courses-content-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-courses-content-01 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-courses-content-02 | S2 | MISSING-FIELD | UNCONFIRMED |
| COL-courses-content-03 | S2 | MISSING-ACTION | OPEN |
| COL-courses-content-07 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-courses-content-08 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| COL-courses-content-09 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-courses-content-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-courses-content-04 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-courses-content-05 | S3 | MISSING-COLUMN | OPEN |
| COL-courses-content-10 | S3 | STATE | OPEN |
| COL-courses-content-12 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| COL-courses-content-14 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| COL-courses-content-16 | S4 | MISSING-PAGE | UNCONFIRMED |
| COL-courses-content-17 | S4 | STATE | OPEN |

## college/attendance (13: OPEN 11, UNCONFIRMED 2)

Audit: `docs/audit/pages/college/attendance.md` (and `attendance-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/college-attendance-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| COL-attendance-03 | S3 | MISSING-COLUMN | OPEN |
| COL-attendance-04 | S3 | MISSING-FIELD | OPEN |
| COL-attendance-05 | S3 | STATE | OPEN |
| COL-attendance-06 | S3 | STATE | OPEN |
| COL-attendance-07 | S3 | VALIDATION | UNCONFIRMED |
| COL-attendance-09 | S3 | COPY | UNCONFIRMED |
| COL-attendance-11 | S3 | STATE | OPEN |
| COL-attendance-16 | S3 | PERMISSION | OPEN |
| COL-attendance-10 | S4 | COPY | OPEN |
| COL-attendance-12 | S4 | MISSING-EXPORT | OPEN |
| COL-attendance-14 | S4 | MISSING-FIELD | OPEN |
| COL-attendance-15 | S4 | MISSING-FILTER | OPEN |
| COL-attendance-17 | S4 | A11Y | OPEN |

## learner/profile-learning (5: OPEN 2, FIXED-ON-MAIN 3)

Audit: `docs/audit/pages/learner/profile-learning.md` (and `profile-learning-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/learner-profile-learning-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| LEARNER-learning-misc-R01 | S2 | SIDE-EFFECT | OPEN |
| LEARNER-profile-misc-R01 | S3 | MISSING-MODAL / STATE | OPEN |
| LEARNER-profile-misc-R02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| LEARNER-profile-misc-R04 | S3 | VALIDATION | FIXED-ON-MAIN |
| LEARNER-profile-misc-R05 | S4 | COPY / STATE | FIXED-ON-MAIN |

## Notes (blockers, one line each)

## Needs shell (chat-9 only)

