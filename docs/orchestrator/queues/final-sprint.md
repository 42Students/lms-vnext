# FINAL SPRINT: every remaining item, split across all lanes (2026-10-18)

Each lane owns a non-overlapping list. For every ID: if OPEN, implement it (exact legacy wording; where legacy is wrong decide the better behaviour); if FIXED-ON-MAIN, add the missing test and an acceptance note citing the ID; if WRONG, correct the row in the page acceptance file and fix the code if needed; if UNCONFIRMED, decide the better behaviour and record it. Cite the gap ID in the commit, a test and the acceptance file docs/audit/acceptance/<account>-<page>-verification.md. Look each ID up in docs/audit/gap-register.md. Push to your chatgpt/chat-N-b every ~5 items. Reply only when your whole list is done and list anything you could not finish with the reason.

## chat-2 (22)

- REC-calendar-messages-profile-03 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-05 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-06 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-07 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-09 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-10 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-11 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-13 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-14 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-15 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-18 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-20 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-26 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-29 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-30 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-32 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-33 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-34 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-35 [IN-BRANCH] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-36 [IN-BRANCH] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-41 [FIXED-ON-MAIN] recruiter/calendar-messages-profile
- REC-calendar-messages-profile-R02 [FIXED-ON-MAIN] recruiter/calendar-messages-profile

## chat-3 (18)

- TPO-companies-05 [OPEN] tpo/companies
- TPO-companies-07 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-08 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-10 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-11 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-12 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-13 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-14 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-15 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-16 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-17 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-18 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-24 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-26 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-27 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-28 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-R02 [FIXED-ON-MAIN] tpo/companies
- TPO-companies-R05 [FIXED-ON-MAIN] tpo/companies

## chat-4 (18)

- TPO-recruiters-05 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-06 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-10 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-11 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-15 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-16 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-18 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-20 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-21 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-25 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-26 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-27 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-28 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-29 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-31 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-32 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-33 [FIXED-ON-MAIN] tpo/recruiters
- TPO-recruiters-37 [FIXED-ON-MAIN] tpo/recruiters


### chat-4 source closeout (18/18; branch chatgpt/chat-4-b)

All 18 `TPO-recruiters` IDs above have ID-named cases in
`tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts` (9) and
`tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts` (9), plus individual
`DONE` records and owner decisions in
`docs/audit/acceptance/tpo-recruiters-verification.md`.
The final sprint commits cite each five-item batch. The deliberate safer
differences are recorded for manual-only board changes, explicit actions
instead of a hidden More menu, direct non-mutating duplicate navigation,
and refusal to infer verification from invitation history.
Functional draft navigation and keyboard Escape/focus gaps were also repaired.
Source contracts were checked against the branch (107 literal source assertions);
the test suite, typecheck, database integrations, and browser accessibility
were **not run**. Acceptance therefore means source-verified, not CI-green.
No page UI/UX restyling was introduced.

## chat-5 (15)

- FAC-courses-02 [BLOCKED] faculty/courses (bundled fallback DONE; private scanned image storage needed for authored thumbnails)
- FAC-courses-07 [DONE] faculty/courses
- FAC-courses-10 [DONE] faculty/courses
- FAC-courses-17 [NOT-A-GAP] faculty/courses
- FAC-courses-28 [NOT-A-GAP] faculty/courses
- FAC-courses-30 [DONE] faculty/courses
- FAC-courses-32 [DONE] faculty/courses
- FAC-courses-33 [DONE] faculty/courses
- FAC-courses-35 [DONE] faculty/courses
- FAC-courses-R03 [DONE] faculty/courses
- FAC-courses-R04 [DONE] faculty/courses
- FAC-courses-R05 [DONE] faculty/courses
- FAC-courses-R06 [DONE] faculty/courses
- FAC-courses-R07 [DONE] faculty/courses
- FAC-courses-R08 [DONE] faculty/courses

## chat-6 (11)

- REC-home-drives-04 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-05 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-06 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-07 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-08 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-10 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-37 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-R04 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-R05 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-R06 [FIXED-ON-MAIN] recruiter/home-drives
- REC-home-drives-R07 [NOT-A-GAP] recruiter/home-drives — owner requires IST everywhere; existing acceptance and named test: tests/unit/recruiter-home-drives-chat7-r7.test.ts

### chat-6 source closure (11/11; branch chatgpt/chat-6-b)

All ten `FIXED-ON-MAIN` recruiter/home-drives IDs above have existing individual gap-named tests `tests/unit/chat6-final-sprint-rec-home-drives-{04,05,06,07,08,10,37,r04,r05,r06}.test.ts` and evidence rows in `docs/audit/acceptance/recruiter-home-drives-verification.md`. The eleventh, `REC-home-drives-R07`, is independently covered by `tests/unit/chat6-final-sprint-rec-home-drives-r07.test.ts` and intentionally NOT-A-GAP because the owner requires IST everywhere. Reviewed the corresponding tests and acceptance rows again. Status is **source-verified; cloud CI and browser/DB verification still pending**. No duplicate tests or UI copy changes were introduced in this follow-up.

## chat-7 (11)

- SA-academics-people-50 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-52 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-53 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-56 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-60 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-64 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-65 [OPEN] superadmin/academics-people-2-courses-content
- SA-academics-people-67 [OPEN] superadmin/academics-people-2-courses-content
- TPO-calendar-reports-45 [FIXED-ON-MAIN] tpo/calendar-reports
- TPO-calendar-reports-52 [FIXED-ON-MAIN] tpo/calendar-reports
- TPO-calendar-reports-R07 [FIXED-ON-MAIN] tpo/calendar-reports

## chat-9 (11)

- TPO-campaigns-public-03 [DONE] tpo/campaigns-public
- TPO-campaigns-public-05 [DONE] tpo/campaigns-public
- TPO-campaigns-public-06 [DONE] tpo/campaigns-public
- TPO-campaigns-public-08 [DONE] tpo/campaigns-public
- TPO-campaigns-public-11 [DONE] tpo/campaigns-public
- TPO-campaigns-public-14 [DONE] tpo/campaigns-public
- TPO-campaigns-public-27 [DONE] tpo/campaigns-public
- TPO-campaigns-public-28 [DONE] tpo/campaigns-public
- LEARNER-course-detail-07 [DONE] learner/course-detail
- LEARNER-course-detail-18 [NOT-A-GAP] learner/course-detail
- SA-placements-projects-102 [DONE] superadmin/placements-projects-c-tracker

Chat-9 source closure: all 11 gap IDs have dedicated `tests/unit/chat9-final-<GAP-ID>.test.ts` evidence (already committed on main). Campaign acceptance: `docs/audit/acceptance/tpo-campaigns-public-verification.md`; learner: `docs/audit/acceptance/learner-course-detail-verification.md`; tracker: `docs/audit/acceptance/superadmin-placements-projects-c-tracker-verification.md`. LEARNER-course-detail-18 is NOT-A-GAP for nonexistent authored prerequisite locks; the real stale/invalid deep-link handling is DONE. LEARNER-course-detail-07 safely retains authorized multi-link materials and explicitly blocks private file downloads until signed scanned storage is ready. No test execution claimed in this lane.

## chat-11 (11) — source verification: DONE 8, NOT-A-GAP 1, BLOCKED 1, OPEN 1

- TPO-settings-audit-07 [DONE] tpo/settings-audit
- TPO-settings-audit-11 [DONE] tpo/settings-audit
- TPO-settings-audit-23 [OPEN] tpo/settings-audit
- TPO-settings-audit-41 [DONE] tpo/settings-audit
- TPO-settings-audit-60 [DONE] tpo/settings-audit
- TPO-settings-audit-80 [NOT-A-GAP] tpo/settings-audit
- TPO-settings-audit-95 [DONE] tpo/settings-audit
- TPO-settings-audit-R04 [DONE] tpo/settings-audit
- LEARNER-profile-misc-02 [BLOCKED] learner/profile-misc
- LEARNER-profile-misc-18 [DONE] learner/profile-misc
- SA-tenants-modules-R01 [DONE] superadmin/tenants-modules

> chat-11 source evidence (2026-10-18): `TPO-settings-audit-07/11/41/60/95`, `LEARNER-profile-misc-18`, and `SA-tenants-modules-R01` have named tests and page acceptance entries; `TPO-settings-audit-80` is NOT-A-GAP because legacy dev UI has no toggles. `LEARNER-profile-misc-02` is BLOCKED on private scanned object storage and is not replaced by unsafe public uploads. `TPO-settings-audit-23` stays OPEN until job type settings feed drive forms/filters/reports and history. `TPO-settings-audit-R04` now persists AUDIT views in the existing owner/college table with cross-device GET/POST, current-role/tenant checks, CAS revisions and 12/5 limits; named tests are in `chat11-final-TPO-settings-audit-R04.test.ts` and `chat11-tpo-audit-saved-view-route.test.ts`. These are source-level dispositions, not Vitest/TypeScript/DB/browser execution.

## chat-12 (11)

- LEARNER-home-courses-01 [NOT-A-GAP] learner/home-courses
- LEARNER-home-courses-02 [DONE] learner/home-courses
- LEARNER-home-courses-14 [DONE] learner/home-courses
- LEARNER-course-detail-R02 [DONE] learner/home-courses
- LEARNER-course-detail-R03 [DONE] learner/home-courses
- FAC-attendance-grades-18 [NOT-A-GAP] faculty/attendance-grades
- FAC-attendance-grades-19 [DONE] faculty/attendance-grades
- FAC-attendance-grades-22 [DONE] faculty/attendance-grades
- MEN-projects-meetings-20 [DONE] mentor/projects-meetings
- MEN-projects-meetings-48 [DONE] mentor/projects-meetings
- TPO-drive-workspace-66 [DONE] tpo/drive-workspace

> chat-12 verified-closure evidence: named final-sprint tests under `tests/unit/chat12-final-*` and per-page acceptance documents for learner/home-courses, faculty/attendance-grades, mentor/projects-meetings and tpo/drive-workspace. Tests authored, not executed; orchestrator runtime verification pending.

## chat-13 (11)

- PUB-auth-public-50 [DONE] public/auth-public-2-links-marketing
- PUB-auth-public-52 [DONE] public/auth-public-2-links-marketing
- PUB-auth-public-53 [DONE] public/auth-public-2-links-marketing
- PUB-auth-public-55 [DONE] public/auth-public-2-links-marketing
- PUB-auth-public-57 [DONE] public/auth-public-2-links-marketing
- LEARNER-placements-19 [NOT-A-GAP] learner/placements
- LEARNER-placements-24 [DONE] learner/placements
- LEARNER-placements-35 [DONE] learner/placements
- SA-academics-people-92 [DONE] superadmin/academics-people-3-people-recruiters
- SA-academics-people-94 [DONE] superadmin/academics-people-3-people-recruiters
- TPO-home-R08 [DONE] tpo/home

> chat-13 recheck (2026-10-18): 10 DONE and 1 NOT-A-GAP in source; every listed ID has gap-named unit and acceptance evidence under `docs/audit/acceptance/`. `SA-academics-people-92` now additionally checks Super Admin registration reachability. No browser, DB or Vitest run was performed by this lane; orchestrator execution remains the verification gate.

## chat-14 (11)

- TPO-drives-03 [NOT-A-GAP] tpo/drives
- TPO-drives-13 [DONE] tpo/drives
- TPO-drives-31 [DONE] tpo/drives
- TPO-drives-48 [DONE] tpo/drives
- TPO-drives-52 [DONE] tpo/drives
- PUB-auth-public-29 [DONE] public/auth-public-1-login-session
- PUB-auth-public-31 [DONE] public/auth-public-1-login-session
- PUB-auth-public-38 [DONE] public/auth-public-1-login-session
- COL-academic-setup-21 [NOT-A-GAP] college/academic-setup
- COL-verification-misc-13 [DONE] college/verification-misc
- TPO-inbox-team-12 [DONE] tpo/inbox-team

## chat-15 (10)

- FAC-assessments-15 [WRONG] faculty/assessments
- FAC-assessments-25 [WRONG] faculty/assessments
- FAC-assessments-26 [WRONG] faculty/assessments
- FAC-assessments-28 [WRONG] faculty/assessments
- TPO-batches-11 [OPEN] tpo/batches
- TPO-batches-44 [OPEN] tpo/batches
- TPO-batches-46 [OPEN] tpo/batches
- TPO-batches-65 [OPEN] tpo/batches
- COL-attendance-R02 [OPEN] college/operations
- SA-placements-projects-91 [FIXED-ON-MAIN] superadmin/placements-projects-b-projects

## chat-16 (10)

- LEARNER-learning-misc-01 [OPEN] learner/learning-misc
- LEARNER-learning-misc-07 [OPEN] learner/learning-misc
- LEARNER-learning-misc-12 [OPEN] learner/learning-misc
- LEARNER-learning-misc-25 [UNCONFIRMED] learner/learning-misc
- COL-placements-02 [FIXED-ON-MAIN] college/placements
- COL-placements-10 [FIXED-ON-MAIN] college/placements
- COL-placements-12 [OPEN] college/placements
- SA-tenants-modules-25 [FIXED-ON-MAIN] superadmin/tenants-modules-2
- SA-tenants-modules-29 [FIXED-ON-MAIN] superadmin/tenants-modules-2
- SA-tenants-modules-35 [FIXED-ON-MAIN] superadmin/tenants-modules-2

