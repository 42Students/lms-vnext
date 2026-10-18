# Unit test failures, latest (CI ff6819dd) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts
  - TPO-campaigns-public-12 / T-S2-04 campaign safety ledger > dispatch service requires verified provider and never reclaims an already-started
- tests/unit/chat2-tpo-round-contracts-break-11.test.ts
  - TPO-BREAK-round-contracts-11 validation and state evidence, no tenant or rank guessing > single result requires an explicit confirm, current
- tests/unit/HR-BREAK-authorization-01.test.ts
  - HR-BREAK-authorization-01: revoked grants, private candidates, cross-tenant IDOR > grants alone never disclose a job without central live pe
  - HR-BREAK-authorization-01: revoked grants, private candidates, cross-tenant IDOR > wrong college, wrong relationship, or absent recruiter ca
- tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts
  - Super Admin Projects and Placements page routes ? independent security and UX audit > PROJ-BREAK-SA-16 delegates dynamic project IDs to pers
- tests/unit/PROJ-BREAK-SA-state-matrix-and-queries.test.ts
  - Super Admin Projects: hostile state, URL, and concurrency contracts > PROJ-BREAK-SA-19 refuses duplicate query keys instead of silently choo
- tests/unit/PROJ-BREAK-SA-unsubmitted-search.test.ts
  - Super Admin not-submitted Projects directory abuse > PROJ-BREAK-SA-26 applies literal ILIKE escaping to all three Super Admin project list v
- tests/unit/PROJ-BREAK-TPO-01.test.ts
  - PROJ-BREAK-TPO-02 truthful self-reported portfolio counts > separates learner-owned profile entries from canonical Projects grading and work
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
- tests/unit/chat3-final-sprint-company-team-and-review.test.ts
  - Chat-3 final sprint team and review contracts > TPO-companies-05 company messages are bound to a real college relationship and active placem
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-college-faculty-schedule-hardening.test.ts
  - College faculty schedule reassignment break-it workflows > COL-faculty-reassign-03 locks persisted actor and faculty before writes, retries 
- tests/unit/chat4-college-section-workspace-tenant.test.ts
  - College Admin class operations workspace isolation and composite data > COL-classes-tenant-02 composes only selected section's data and all 
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page si
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-71 offers guarded page CSV export and review evidence fields

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
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-college-assessment-export-service-weak.test.ts
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and ne
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns qu
- tests/unit/chat7-course-delivery-roster-weak.test.ts
  - COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > source query guards both paths by persisted ACTIVE use
- tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts
  - Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names

## chat-9
- tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts
  - IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested 
- tests/unit/PROJ-BREAK-chat9-admin-unsubmitted-service.test.ts
  - IIT Dharwad Projects Admin unsubmitted workspaces service permissions and pagination > PROJ-BREAK-archive-03 scoped list excludes archived a
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
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/de
- tests/unit/ux-admin-chat9-round9-legacy.test.ts
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recover
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab

## chat-11
- tests/unit/chat11-super-admin-signin-readiness.test.ts
  - SA-tenants-modules-LOGIN-01: per-college sign-in policy safety > requires origin, matching URL/body college, persisted role, active college 
- tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts
  - TPO-settings-audit-OUTCOME-CAS-01 custom outcome label retries > checks live actor permissions before the locked read and all CAS/audit writ
- tests/unit/chat11-tpo-trusted-domain-validation.test.ts
  - TPO-settings-audit-TRUST-02 college-scoped company domain validation > rejects DNS labels with trailing hyphens, invalid separators, 64-byte

## chat-12
- tests/unit/chat12-requests-grid-round6.test.ts
  - TPO request grid and controls > TPO-requests-verification-13 restricts future bulk selection to authorized page rows
- tests/unit/chat12-round10-requests-state-contracts.test.ts
  - chat-12 requests and verification queue residual contracts > TPO-requests-verification-16 keeps page-selected requests scoped to visible row
- tests/unit/chat12-round27-request-grid.test.ts
  - TPO Requests grid and 500 row parity > TPO-requests-verification-16 provides 500-row server paging, column selection, sticky students, selec

## chat-13
- tests/unit/chat13-superadmin-student-lookup.test.ts
  - Super Admin placement lookup > SA-placements-projects-09 supports tenant-scoped name, roll, email search and application outcomes
- tests/unit/chat13-ux-cross-audit-tpo-loading.test.ts
  - UX-cross-tpo-second-C13-026-22 slow loading and recovery

## chat-14
- tests/unit/PROJ-BREAK-chat14-mentor-notes-service.test.ts
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-16 verifies project and meeting row locks before acc
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-17 prohibits all non-active project and non-complete
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-18 enforces expectedUpdatedAt and never records an a
  - PROJ-BREAK-MENTOR meeting notes service transactional authorization > PROJ-BREAK-MENTOR-20 rejects forged cross-project/invalid meeting IDs 
- tests/unit/projects-mentor-service-guards-chat14.test.ts
  - chat-14 mentor project service boundaries (source compliance) > final delivery mentor decision preserves version, project scope, and assigne
- tests/unit/w03-project-admin-audit.test.ts
  - W03 project admin audit parity contract > reads only PROJECTS activity and preserves legacy-style audit filters

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi
- tests/unit/recruiter-drive-request-runtime-model.test.ts
  - REC-home-drives-21 registered formal recruiter request contract > separates in-review edits and sent-back resubmission

## chat-17
- tests/unit/chat17-managed-domains-model.test.ts
  - WEAK-tenant-managed-20..25 wildcard and primary domain integrity > WEAK-tenant-managed-20 managed wildcard requires verified TLS flag and ca

## chat-19
- tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx
  - PROJ-BREAK-EXPORT-02: project export UI only permits authorized visible rows > enables an exported page without any all-tenants lookup or hi
- tests/unit/chat19-college-cross-audit.test.ts
  - chat-19 college UX cross-audit > COL-XA-14 keeps faculty assignment detail and history accessible without a wide table

