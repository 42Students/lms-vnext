# Gap closure queue: chat-2

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-2-b`. 198 gaps on 5 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/inbox-team (69: OPEN 45, FIXED-ON-MAIN 21, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/inbox-team.md` (and `inbox-team-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-inbox-team-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-inbox-team-15 | S1 | MISSING-ACTION | IN-BRANCH |
| TPO-inbox-team-04 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-inbox-team-05 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-06 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-inbox-team-07 | S2 | MISSING-TAB | OPEN |
| TPO-inbox-team-08 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-inbox-team-10 | S2 | COPY | IN-BRANCH |
| TPO-inbox-team-16 | S2 | MISSING-TAB | OPEN |
| TPO-inbox-team-17 | S2 | MISSING-FIELD | OPEN |
| TPO-inbox-team-18 | S2 | MISSING-COLUMN | OPEN |
| TPO-inbox-team-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-20 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-22 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-24 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-28 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-31 | S2 | MISSING-COLUMN | OPEN |
| TPO-inbox-team-33 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-35 | S2 | MISSING-ACTION | UNCONFIRMED |
| TPO-inbox-team-36 | S2 | MISSING-ACTION | OPEN |
| TPO-inbox-team-39 | S2 | STATE | IN-BRANCH |
| TPO-inbox-team-44 | S2 | MISSING-FIELD | OPEN |
| TPO-inbox-team-45 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-46 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-47 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-inbox-team-48 | S2 | STATE | FIXED-ON-MAIN |
| TPO-inbox-team-54 | S2 | MISSING-FIELD | OPEN |
| TPO-inbox-team-55 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-inbox-team-60 | S2 | SIDE-EFFECT | OPEN |
| TPO-inbox-team-63 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-09 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-11 | S3 | STATE | UNCONFIRMED |
| TPO-inbox-team-13 | S3 | RESPONSIVE | IN-BRANCH |
| TPO-inbox-team-14 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-23 | S3 | MISSING-ACTION | OPEN |
| TPO-inbox-team-25 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-26 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-27 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-29 | S3 | SIDE-EFFECT | OPEN |
| TPO-inbox-team-30 | S3 | STATE | OPEN |
| TPO-inbox-team-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-inbox-team-34 | S3 | MISSING-ACTION | OPEN |
| TPO-inbox-team-37 | S3 | COPY | OPEN |
| TPO-inbox-team-38 | S3 | PERMISSION | OPEN |
| TPO-inbox-team-40 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-49 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-inbox-team-50 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-inbox-team-51 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-52 | S3 | STATE | OPEN |
| TPO-inbox-team-53 | S3 | STATE | FIXED-ON-MAIN |
| TPO-inbox-team-56 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-57 | S3 | PERMISSION | IN-BRANCH |
| TPO-inbox-team-59 | S3 | MISSING-FIELD | OPEN |
| TPO-inbox-team-64 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-65 | S3 | COPY | IN-BRANCH |
| TPO-inbox-team-R01 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-inbox-team-R02 | S3 | PERMISSION | OPEN |
| TPO-inbox-team-R03 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-R05 | S3 | STATE | IN-BRANCH |
| TPO-inbox-team-12 | S4 | PERFORMANCE | FIXED-ON-MAIN |
| TPO-inbox-team-41 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-42 | S4 | RESPONSIVE | OPEN |
| TPO-inbox-team-58 | S4 | VALIDATION | IN-BRANCH |
| TPO-inbox-team-66 | S4 | A11Y | FIXED-ON-MAIN |
| TPO-inbox-team-67 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-68 | S4 | STATE | IN-BRANCH |
| TPO-inbox-team-R04 | S4 | STATE | OPEN |
| TPO-inbox-team-R06 | S4 | STATE | OPEN |
| TPO-inbox-team-R07 | S4 | A11Y | FIXED-ON-MAIN |

## recruiter/calendar-messages-profile (36: OPEN 13, UNCONFIRMED 1, FIXED-ON-MAIN 20, IN-BRANCH 2)

Audit: `docs/audit/pages/recruiter/calendar-messages-profile.md` (and `calendar-messages-profile-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| REC-calendar-messages-profile-25 | S2 | MISSING-FIELD | OPEN |
| REC-calendar-messages-profile-46 | S2 | MISSING-ACTION | UNCONFIRMED |
| REC-calendar-messages-profile-R01 | S2 | SIDE-EFFECT | OPEN |
| REC-calendar-messages-profile-03 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-05 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-06 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-09 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-10 | S3 | COPY | FIXED-ON-MAIN |
| REC-calendar-messages-profile-11 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-12 | S3 | STATE | OPEN |
| REC-calendar-messages-profile-13 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| REC-calendar-messages-profile-14 | S3 | STATE | FIXED-ON-MAIN |
| REC-calendar-messages-profile-15 | S3 | VALIDATION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-16 | S3 | STATE | OPEN |
| REC-calendar-messages-profile-18 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-23 | S3 | STATE | OPEN |
| REC-calendar-messages-profile-24 | S3 | MISSING-FIELD | OPEN |
| REC-calendar-messages-profile-26 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-27 | S3 | VALIDATION | OPEN |
| REC-calendar-messages-profile-28 | S3 | COPY | OPEN |
| REC-calendar-messages-profile-29 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-30 | S3 | PERMISSION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-32 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-34 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| REC-calendar-messages-profile-35 | S3 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-36 | S3 | COPY | IN-BRANCH |
| REC-calendar-messages-profile-41 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-R02 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| REC-calendar-messages-profile-R03 | S3 | COPY | OPEN |
| REC-calendar-messages-profile-07 | S4 | STATE | FIXED-ON-MAIN |
| REC-calendar-messages-profile-20 | S4 | A11Y | FIXED-ON-MAIN |
| REC-calendar-messages-profile-33 | S4 | PERMISSION | FIXED-ON-MAIN |
| REC-calendar-messages-profile-37 | S4 | STATE | OPEN |
| REC-calendar-messages-profile-42 | S4 | COPY | OPEN |
| REC-calendar-messages-profile-47 | S4 | STATE | OPEN |
| REC-calendar-messages-profile-48 | S4 | COPY | OPEN |

## tpo/recruiters (34: FIXED-ON-MAIN 18, OPEN 15, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/recruiters.md` (and `recruiters-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-recruiters-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-recruiters-05 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-06 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-recruiters-07 | S2 | COPY | OPEN |
| TPO-recruiters-10 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-recruiters-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-16 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-17 | S2 | SIDE-EFFECT | OPEN |
| TPO-recruiters-18 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-recruiters-21 | S2 | VALIDATION | FIXED-ON-MAIN |
| TPO-recruiters-25 | S2 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-recruiters-33 | S2 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-R01 | S2 | MISSING-FIELD | OPEN |
| TPO-recruiters-22 | S3 | VALIDATION | OPEN |
| TPO-recruiters-24 | S3 | COPY | OPEN |
| TPO-recruiters-27 | S3 | COPY | FIXED-ON-MAIN |
| TPO-recruiters-28 | S3 | COPY | FIXED-ON-MAIN |
| TPO-recruiters-29 | S3 | STATE | FIXED-ON-MAIN |
| TPO-recruiters-30 | S3 | VALIDATION | OPEN |
| TPO-recruiters-31 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-recruiters-32 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-recruiters-34 | S3 | PERMISSION | UNCONFIRMED |
| TPO-recruiters-36 | S3 | RESPONSIVE | OPEN |
| TPO-recruiters-37 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-recruiters-38 | S3 | VALIDATION | OPEN |
| TPO-recruiters-39 | S3 | COPY | OPEN |
| TPO-recruiters-40 | S3 | COPY | OPEN |
| TPO-recruiters-41 | S3 | MISSING-ACTION | OPEN |
| TPO-recruiters-R05 | S3 | SIDE-EFFECT | OPEN |
| TPO-recruiters-42 | S4 | STATE | OPEN |
| TPO-recruiters-43 | S4 | COPY | OPEN |
| TPO-recruiters-R06 | S4 | COPY | OPEN |

## tpo/companies (30: UNCONFIRMED 3, OPEN 10, FIXED-ON-MAIN 17)

Audit: `docs/audit/pages/tpo/companies.md` (and `companies-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-companies-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-companies-04 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-companies-05 | S2 | MISSING-TAB | OPEN |
| TPO-companies-06 | S2 | MISSING-FIELD | OPEN |
| TPO-companies-08 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-companies-10 | S2 | MISSING-PAGE | FIXED-ON-MAIN |
| TPO-companies-11 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-12 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-13 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-15 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-16 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-companies-17 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-companies-19 | S2 | STATE | OPEN |
| TPO-companies-25 | S2 | STATE | UNCONFIRMED |
| TPO-companies-03 | S3 | COPY | OPEN |
| TPO-companies-07 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-companies-09 | S3 | COPY | OPEN |
| TPO-companies-18 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-companies-20 | S3 | STATE | OPEN |
| TPO-companies-21 | S3 | COPY | OPEN |
| TPO-companies-22 | S3 | COPY | OPEN |
| TPO-companies-24 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-companies-26 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-companies-27 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-companies-R02 | S3 | COPY | FIXED-ON-MAIN |
| TPO-companies-R03 | S3 | PERMISSION | UNCONFIRMED |
| TPO-companies-R05 | S3 | STATE | FIXED-ON-MAIN |
| TPO-companies-14 | S4 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-companies-23 | S4 | COPY | OPEN |
| TPO-companies-28 | S4 | PERMISSION | FIXED-ON-MAIN |
| TPO-companies-29 | S4 | RESPONSIVE | OPEN |

## tpo/campaigns-public (29: FIXED-ON-MAIN 9, OPEN 17, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/campaigns-public.md` (and `campaigns-public-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-campaigns-public-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-campaigns-public-03 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-campaigns-public-04 | S2 | STATE | OPEN |
| TPO-campaigns-public-05 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-campaigns-public-06 | S2 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-campaigns-public-07 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-campaigns-public-14 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-campaigns-public-16 | S2 | STATE | OPEN |
| TPO-campaigns-public-17 | S2 | VALIDATION | UNCONFIRMED |
| TPO-campaigns-public-22 | S2 | VALIDATION | OPEN |
| TPO-campaigns-public-23 | S2 | SIDE-EFFECT | OPEN |
| TPO-campaigns-public-33 | S2 | MISSING-FIELD | OPEN |
| TPO-campaigns-public-34 | S2 | MISSING-FIELD | OPEN |
| TPO-campaigns-public-35 | S2 | STATE | OPEN |
| TPO-campaigns-public-R08 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-campaigns-public-08 | S3 | STATE | FIXED-ON-MAIN |
| TPO-campaigns-public-09 | S3 | STATE | OPEN |
| TPO-campaigns-public-10 | S3 | COPY | OPEN |
| TPO-campaigns-public-24 | S3 | COPY | OPEN |
| TPO-campaigns-public-25 | S3 | STATE | UNCONFIRMED |
| TPO-campaigns-public-27 | S3 | VALIDATION | FIXED-ON-MAIN |
| TPO-campaigns-public-28 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-campaigns-public-30 | S3 | COPY | OPEN |
| TPO-campaigns-public-36 | S3 | COPY | OPEN |
| TPO-campaigns-public-37 | S3 | STATE | OPEN |
| TPO-campaigns-public-R04 | S3 | MISSING-FIELD | OPEN |
| TPO-campaigns-public-R09 | S3 | STATE | OPEN |
| TPO-campaigns-public-11 | S4 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-campaigns-public-12 | S4 | MISSING-FIELD | OPEN |
| TPO-campaigns-public-R10 | S4 | PERFORMANCE | OPEN |

## Notes (blockers, one line each)
- TPO-inbox-team-08 BLOCKED: recruiter email relay and reply-by-email need verified provider credentials plus registered inbound webhook; no live email delivery attempted.


## Needs shell (chat-9 only)
- TPO-inbox-team-28 / TPO-inbox-team-63: chat-9 owns `src/components/shell`; add scoped Team, Messages and Announcements unread counters to TPO navigation (chat-2 cannot edit shell).



## Chat-2 current-round status (2026-10-17)
- This round verified and pushed source-backed fixes to `chatgpt/chat-2-b`; IN-BRANCH means named tests are written but not executed, and unregistered proposed migrations still require orchestrator registration.
- First 25 initially OPEN entries under tpo/inbox-team: 7 have source-level DONE evidence, 8 have partial progress, 10 remain open with substantial missing workflows. See `docs/audit/acceptance/tpo-inbox-team-verification.md` for evidence; do not treat partial or unrun PostgreSQL cases as runtime certified.
- Other OPEN items with source-level closure on branch are marked IN-BRANCH above. No source-only claim is upgraded to production verified.

## Chat-2 round 5 review — 27 remaining inbox-team OPEN entries
- Read and assessed all 27 rows in the acceptance file above (25 requested plus two); 19 have a source-level partial improvement or verified core behavior and 8 still require larger workflows. OPEN statuses are intentionally retained for incomplete legacy parity.
- Authenticated thread correction, optimistic decisions, away-until, From 42 global unread, Team pagination and drive Discussion were pushed with gap-named unit tests, not executed. The orchestrator must register `docs/proposed-migrations/tpo-inbox-team-away-until.sql`.
- TPO-settings-audit-01/55, T-S2-08, TPO-inbox-team-R05 and TPO-inbox-team-07 unit-failures-r1 regressions were addressed on branch. Verification is pending the orchestrator test run.
- Next work: object Team conversations and asks, role policy (R02/38), workload assignment/handover, delivery producers and student-facing notice consequences. Do not move any partial item to DONE without full tests.
