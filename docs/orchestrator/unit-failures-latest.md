# Unit test failures, latest (CI ff6819dd) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-UX-tpo-scroll-motion-01.test.ts
  - UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-02 built-in job types have mobile priori
- tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts
  - TPO-campaigns-public-12 / T-S2-04 campaign safety ledger > dispatch service requires verified provider and never reclaims an already-started
- tests/unit/chat2-tpo-round-contracts-break-11.test.ts
  - TPO-BREAK-round-contracts-11 validation and state evidence, no tenant or rank guessing > single result requires an explicit confirm, current
- tests/unit/HR-BREAK-authorization-01.test.ts
  - HR-BREAK-authorization-01: revoked grants, private candidates, cross-tenant IDOR > grants alone never disclose a job without central live pe
  - HR-BREAK-authorization-01: revoked grants, private candidates, cross-tenant IDOR > wrong college, wrong relationship, or absent recruiter ca
- tests/unit/HR-BREAK-messaging-01.test.ts
  - HR-BREAK-messaging-01: drive conversations, IDOR and expired-session journeys > fetches only after authorized workspace lookup, then filters
- tests/unit/HR-BREAK-weak-services-01.test.ts
  - HR-BREAK-weak-services-01: actual service branches with mocked persistence > portfolio counters refuse revoked/missing grants and no-ID port
- tests/unit/PROJ-BREAK-FACULTY-02.test.ts
  - PROJ-BREAK-FACULTY-02 assigned faculty: access and stale-session breaker > PROJ-BREAK-FACULTY-02-01 Faculty-only display role cannot become 
  - PROJ-BREAK-FACULTY-02 assigned faculty: access and stale-session breaker > PROJ-BREAK-FACULTY-02-04 suspended/removed or expired principal c
- tests/unit/PROJ-BREAK-HR-01.test.ts
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > PROJ-BREAK-HR-ORG-02 denies mismatched organizatio
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > denies a TPO account with no assigned project memb
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > denies a recruiter with an active hiring grant but
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > denies inactive or removed college memberships bef
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > denies wrong-tenant membership before querying pro
  - PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data > does not let an HR recruiter grant become a projec
- tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts
  - Super Admin Projects and Placements page routes ? independent security and UX audit > PROJ-BREAK-SA-16 delegates dynamic project IDs to pers
- tests/unit/PROJ-BREAK-SA-unsubmitted-search.test.ts
  - Super Admin not-submitted Projects directory abuse > PROJ-BREAK-SA-26 applies literal ILIKE escaping to all three Super Admin project list v
- tests/unit/UX-college-roster-data-tables-01.test.ts
  - UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/faculty/[membershipId] retains every course and assignment 
- tests/unit/UX-teach-courses-coverage-01.test.ts
  - UX-teach-courses-01 /teach/courses keeps report scope and state contracts
- tests/unit/UX-teacher-courses-deliveryid-discussions-coverage-01.test.ts
  - UX-teacher-courses-deliveryid-discussions-01 /teacher/courses/[deliveryId]/discussions enforces page access and feedback contracts
- tests/unit/UX-teacher-courses-deliveryid-students-coverage-01.test.ts
  - UX-teacher-courses-deliveryid-students-01 /teacher/courses/[deliveryId]/students keeps page scope and true states
- tests/unit/UX-teacher-notifications-coverage-01.test.ts
  - UX-teacher-notifications-01 /teacher/notifications keeps access and honest feedback
- tests/unit/UX-teacher-profile-coverage-01.test.ts
  - UX-teacher-profile-01 /teacher/profile keeps access and honest feedback
- tests/unit/ux-admin-first-third.test.ts
  - Super Admin UX first-third rollout > UX-admin-colleges-02 renders one responsive college directory with labelled actions and pagination

## chat-3
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-admin-colleges-organizations-directory.test.ts
  - Super Admin colleges and organizations directory contracts (chat-4) > SA-colleges-directory-06 checks the Super Admin permission before even

## chat-5
- tests/unit/chat5-placements-scroll-motion-surfaces.test.ts
  - chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-06 cues every newly audited scroll container in tpo-roun
  - chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-06 preserves semantic drive-day table headers and keyboa
  - chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-11 cues every newly audited scroll container in placemen
  - chat-5 placements scroll and motion surface contracts > UX-placements-scroll-motion-11 retains candidate as a sticky, labeled row identifier

## chat-6
- tests/unit/PROJ-BREAK-chat6-draft-revision-race.test.ts
  - PROJ-BREAK-submissions-10 concurrent learner draft revisions > PROJ-BREAK-submissions-11 final submit rejects old/missing revision and forge
- tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts
  - IIT Dharwad learner final-delivery concurrency and unsaved-input breaker > PROJ-BREAK-submissions-08/09 coordinates manual save, autosave an
- tests/unit/chat6-admin-write-safety-guards.test.ts
  - GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network f
- tests/unit/chat6-faculty-quiz-report-header-r06.test.ts
  - Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metr
- tests/unit/chat6-superadmin-course-catalogue-round4.test.ts
  - chat-6 Super Admin selected-college course directory parity > SA-academics-people-62 shows scoped student visibility and lesson ordering wit
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-course-delivery-roster-weak.test.ts
  - COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > source query guards both paths by persisted ACTIVE use

## chat-9
- tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts
  - IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested 
- tests/unit/PROJ-BREAK-chat9-admin-filters.test.ts
  - IIT Dharwad Projects: Super Admin URL and pagination resilience > PROJ-BREAK-ux-12 array-valued URL params never bypass the same validation
- tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts
  - Super Admin last-third student lookup: tenant-safe application joins > SA-placements-student-lookup-05 job and company-relationship joins sh
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-08 exports the scoped visible workspace page with safe CSV and list sizing
  - College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels
- tests/unit/chat9-college-workspace-status-label.test.ts
  - College Admin legacy workspace listing parity > COL-projects-08 keeps filtered page CSV, 10/20/50/100 choices, template tag and table/list
- tests/unit/chat9-round6-calendar-settings.test.ts
  - chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation
- tests/unit/chat9-round6-college-projects-parity.test.ts
  - College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy ris
- tests/unit/chat9-tpo-settings-legacy-graceful.test.ts
  - TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names
- tests/unit/chat9-unknown-report-recovery.test.ts
  - TPO report unknown-route recovery > TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/de
- tests/unit/ux-admin-chat9-round9-legacy.test.ts
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recover
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab
- tests/unit/ux-admin-chat9-scroll-motion.test.ts
  - chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-03 /admin/students import history dialo

## chat-11
- tests/unit/chat11-college-projects-role-journeys.test.ts
  - IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-02 retains valid filters and pagination across navigation
  - IIT Dharwad College Admin Projects role journeys > PROJ-COL-SCOPE-01 never substitutes a foreign college from a forged URL
- tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts
  - TPO-settings-audit-OUTCOME-CAS-01 custom outcome label retries > checks live actor permissions before the locked read and all CAS/audit writ

## chat-12
- tests/unit/chat12-round21-verification-history.test.ts
  - TPO-requests-verification-29 returns the latest 50 named audit events and full private review facts

## chat-13
- tests/unit/chat13-cohort-creation-outcomes-gap56.test.ts
  - SA-placements-projects-56 truthful per-student creation results > SA-placements-projects-56 exposes a per-learner table and exports all conf
- tests/unit/chat13-student-placement-lookup-cap.test.ts
  - SA-STUDENT-LOOKUP-CAP-01 truthful supervised placement lookup paging > probes an additional authorized database row and does not disclose it
- tests/unit/chat13-superadmin-interview-operations.test.ts
  - Super Admin placement interview operations > GR-39 long names remain inside a horizontally scrollable table

## chat-14
- tests/unit/PROJ-BREAK-chat14-mentor-notes-service.test.ts
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-16 verifies project and meeting row locks before acc
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-17 prohibits all non-active project and non-complete
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-18 enforces expectedUpdatedAt and never records an a
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-20 rejects forged cross-project/invalid meeting IDs 
- tests/unit/projects-mentor-service-guards-chat14.test.ts
  - chat-14 mentor project service boundaries (source compliance) > final delivery mentor decision preserves version, project scope, and assigne
- tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts
  - REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 uses safe send, never OTP template, a
- tests/unit/mentor-project-card-progress.test.ts
  - Mentor project card progress > clamps corrupt counters safely
- tests/unit/w03-project-admin-audit.test.ts
  - W03 project admin audit parity contract > reads only PROJECTS activity and preserves legacy-style audit filters

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

## chat-17
- tests/unit/UX-coverage-closure-leftovers-chat17.test.ts
  - UX-coverage-closure-leftovers-chat17 ? legacy boundaries and private data > UX-/tpo/verification-coverage-02 preserves its permission, routi
- tests/unit/chat17-managed-domains-model.test.ts
  - WEAK-tenant-managed-20..25 wildcard and primary domain integrity > WEAK-tenant-managed-20 managed wildcard requires verified TLS flag and ca

## chat-19
- tests/unit/chat19-college-cross-audit.test.ts
  - chat-19 college UX cross-audit > COL-XA-08 accepts defaults and bounded, user-visible URL filters

