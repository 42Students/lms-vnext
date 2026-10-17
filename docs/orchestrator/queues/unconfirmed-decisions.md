# UNCONFIRMED gaps: owner decision (2026-10-17)

The owner delegated these to the orchestrator: no live check on the old LMS is needed. For each gap below, decide the best behaviour for vNext yourself:

1. If the old LMS behaviour is clearly correct and safe, match it (exact legacy wording stays).
2. If the old LMS behaviour is ambiguous, unsafe, inconsistent or plainly wrong, implement the better, safer, more future-proof behaviour. Examples: count only active learners, never leak data across colleges, fail closed on permissions, validate input, make exports consistent and well-formed.
3. Write the decision in one or two sentences in the page acceptance file docs/audit/acceptance/<account>-<page>-verification.md citing the gap ID (so the tracker marks it VERIFIED), implement it if code is needed, and add a test named with the gap ID.

Owner: "no need to follow the old lms if things are wrong there".

## chat-11 (9)

- COL-academic-setup-41 [college/academic-setup] Mentioned in docs/audit/acceptance/college-academic-setup-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-course-tabs-15 [college/course-tabs] Mentioned in docs/audit/acceptance/college-course-tabs-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-course-tabs-23 [college/course-tabs] Mentioned in docs/audit/acceptance/college-course-tabs-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-course-tabs-25 [college/course-tabs] 
- COL-dashboard-17 [college/dashboard] Mentioned in docs/audit/acceptance/college-dashboard-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-people-12 [college/people] Mentioned in docs/audit/acceptance/college-people-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-people-20 [college/people] Mentioned in docs/audit/acceptance/college-people-verification.md but not cited by a commit on main; not marked VERIFIED.
- COL-placements-03 [college/placements] 
- COL-placements-15 [college/placements] 

## chat-14 (5)

- REC-calendar-messages-profile-46 [recruiter/calendar-messages-profile] 
- REC-home-drives-09 [recruiter/home-drives] 
- REC-home-drives-19 [recruiter/home-drives] 
- REC-home-drives-44 [recruiter/home-drives] 
- REC-home-drives-R02 [recruiter/home-drives] 

## chat-15 (9)

- LEARNER-course-detail-10 [learner/course-detail] 
- LEARNER-course-detail-18 [learner/course-detail] 
- LEARNER-home-courses-01 [learner/home-courses] Mentioned in docs/audit/acceptance/learner-home-courses-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-home-courses-14 [learner/home-courses] Mentioned in docs/audit/acceptance/learner-home-courses-verification.md but not cited by a commit on main; not marked VERIFIED.
- LEARNER-learning-misc-25 [learner/learning-misc] 
- LEARNER-learning-misc-41 [learner/learning-misc] 
- LEARNER-placements-16 [learner/placements] 
- LEARNER-placements-39 [learner/placements] 
- LEARNER-placements-45 [learner/placements] 

## chat-3 (1)

- MEN-projects-meetings-71 [mentor/projects-meetings-part2] 

## chat-5 (22)

- TPO-batches-64 [tpo/batches] 
- TPO-calendar-reports-23 [tpo/calendar-reports] Mentioned in docs/audit/acceptance/tpo-calendar-reports-verification.md but not cited by a commit on main; not marked VERIFIED.
- TPO-campaigns-public-17 [tpo/campaigns-public] 
- TPO-campaigns-public-25 [tpo/campaigns-public] 
- TPO-campaigns-public-R08 [tpo/campaigns-public] 
- TPO-companies-04 [tpo/companies] 
- TPO-companies-25 [tpo/companies] 
- TPO-companies-R03 [tpo/companies] 
- TPO-drive-workspace-51 [tpo/drive-workspace] 
- TPO-drives-28 [tpo/drives] 
- TPO-drives-34 [tpo/drives] 
- TPO-drives-51 [tpo/drives] 
- TPO-home-25 [tpo/home] 
- TPO-home-26 [tpo/home] 
- TPO-home-27 [tpo/home] 
- TPO-inbox-team-08 [tpo/inbox-team] Mentioned in docs/audit/acceptance/tpo-inbox-team-verification.md but not cited by a commit on main; not marked VERIFIED.
- TPO-inbox-team-35 [tpo/inbox-team] 
- TPO-recruiters-34 [tpo/recruiters] 
- TPO-settings-audit-05 [tpo/settings-audit] 
- TPO-settings-audit-12 [tpo/settings-audit] 
- TPO-settings-audit-81 [tpo/settings-audit] 
- TPO-settings-audit-R03 [tpo/settings-audit] 

## chat-6 (18)

- SA-academics-people-R04 [superadmin/academics-people-1-academic-setup] 
- SA-academics-people-49 [superadmin/academics-people-2-courses-content] 
- SA-academics-people-75 [superadmin/academics-people-2-courses-content] 
- SA-academics-people-111 [superadmin/academics-people-3-people-recruiters] 
- SA-placements-projects-14 [superadmin/placements-projects-a-placements] 
- SA-placements-projects-37 [superadmin/placements-projects-a-placements] 
- SA-placements-projects-39 [superadmin/placements-projects-a-placements] 
- SA-placements-projects-58 [superadmin/placements-projects-b-projects] 
- SA-placements-projects-68 [superadmin/placements-projects-b-projects] 
- SA-placements-projects-72 [superadmin/placements-projects-b-projects] 
- SA-placements-projects-77 [superadmin/placements-projects-b-projects] 
- SA-placements-projects-115 [superadmin/placements-projects-c-tracker] 
- SA-tenants-modules-30 [superadmin/tenants-modules-2] 
- SA-tenants-modules-31 [superadmin/tenants-modules-2] 
- SA-tenants-modules-38 [superadmin/tenants-modules-2] 
- SA-tenants-modules-54 [superadmin/tenants-modules-3] Mentioned in docs/audit/acceptance/superadmin-tenants-modules-3-verification.md but not cited by a commit on main; not marked VERIFIED.
- SA-tenants-modules-60 [superadmin/tenants-modules-3] Mentioned in docs/audit/acceptance/superadmin-tenants-modules-3-verification.md but not cited by a commit on main; not marked VERIFIED.
- SA-tenants-modules-68 [superadmin/tenants-modules-3] Mentioned in docs/audit/acceptance/superadmin-tenants-modules-3-verification.md but not cited by a commit on main; not marked VERIFIED.

## chat-9 (7)

- PUB-auth-public-23 [public/auth-public-1-login-session] Mentioned in docs/audit/acceptance/public-auth-public-1-login-session-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-26 [public/auth-public-1-login-session] Mentioned in docs/audit/acceptance/public-auth-public-1-login-session-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-30 [public/auth-public-1-login-session] Mentioned in docs/audit/acceptance/public-auth-public-1-login-session-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-35 [public/auth-public-1-login-session] Mentioned in docs/audit/acceptance/public-auth-public-1-login-session-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-36 [public/auth-public-1-login-session] Mentioned in docs/audit/acceptance/public-auth-public-1-login-session-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-49 [public/auth-public-2-links-marketing] Mentioned in docs/audit/acceptance/public-auth-public-2-links-marketing-verification.md but not cited by a commit on main; not marked VERIFIED.
- PUB-auth-public-60 [public/auth-public-2-links-marketing] Mentioned in docs/audit/acceptance/public-auth-public-2-links-marketing-verification.md but not cited by a commit on main; not marked VERIFIED.

