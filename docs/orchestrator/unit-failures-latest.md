# Unit test failures, latest (CI ff6819dd) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-UX-tpo-scroll-motion-01.test.ts
  - UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-02 built-in job types have mobile priori
- tests/unit/chat2-interview-reschedule-security.test.ts
  - TPO-drive-workspace-44 interview scheduling and rescheduling security > TPO-drive-workspace-44 accepts only secure, credential-free virtual 
- tests/unit/chat2-tpo-public-link-settings.test.ts
  - TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation
- tests/unit/chat2-tpo-reports-server-page-states.test.ts
  - UX-tpo-LAST-THIRD-01 branch and CTC reports server-page guard and state > UX-tpo-LAST-THIRD-01 passes trusted college and filters to branch 
- tests/unit/chat2-tpo-round-route-journeys-break-04.test.ts
  - TPO-BREAK-round-route-04 actual handlers: hostile origins, spoofed identities and stale tabs > denies forged cross-origin interview reschedu
- tests/unit/HR-BREAK-messaging-01.test.ts
  - HR-BREAK-messaging-01: drive conversations, IDOR and expired-session journeys > fetches only after authorized workspace lookup, then filters
- tests/unit/HR-BREAK-today-service-01.test.ts
  - HR-BREAK-today-service-01: college-scoped dashboard query branches > Today interview slots exclude already offered/booked rounds and preserv
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

## chat-3
- tests/unit/chat3-faculty-gradebook-http-route.test.ts
  - FAC-GRADE-HTTP-01 Faculty published gradebook CSV endpoint > returns a BOM, safe formula values and published Section grades, never learner
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-admin-colleges-organizations-directory.test.ts
  - Super Admin colleges and organizations directory contracts (chat-4) > SA-colleges-directory-06 checks the Super Admin permission before even
- tests/unit/chat4-admin-history-export-route.test.ts
  - SA-colleges-admins-R02 administrator history export isolation > exports the authorized page with a BOM, safe headers, and the scoped context
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page si

## chat-6
- tests/unit/PROJ-BREAK-chat6-draft-revision-race.test.ts
  - PROJ-BREAK-submissions-10 concurrent learner draft revisions > PROJ-BREAK-submissions-11 final submit rejects old/missing revision and forge
- tests/unit/chat6-admin-write-safety-guards.test.ts
  - GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network f
- tests/unit/chat6-faculty-quiz-report-header-r06.test.ts
  - Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metr
- tests/unit/chat6-superadmin-content-verified-exports.test.ts
  - Super Admin content CSV parity > SA-academics-people-69 exposes four selected-college bounded CSV endpoints
- tests/unit/chat6-superadmin-course-catalogue-round4.test.ts
  - chat-6 Super Admin selected-college course directory parity > SA-academics-people-62 shows scoped student visibility and lesson ordering wit
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components
- tests/unit/public-auth-links-gap-closure.test.ts
  - Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-63 platform overview describes talent and workforce development

## chat-7
- tests/unit/chat7-college-assessment-export-service-weak.test.ts
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and ne
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns qu
- tests/unit/chat7-course-delivery-roster-weak.test.ts
  - COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > source query guards both paths by persisted ACTIVE use
- tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts
  - Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted reco
  - Super Admin assessment export service scoped pagination > SA-academics-people-64 passes the acting session and selected assignment filters t
  - Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

## chat-9
- tests/unit/PROJ-BREAK-chat9-admin-csv-security.test.ts
  - IIT Dharwad Projects admin exports: spreadsheet injection resilience > PROJ-BREAK-exports-12/13/14/15 all six client exports use the tested 
- tests/unit/PROJ-BREAK-chat9-admin-filters.test.ts
  - IIT Dharwad Projects: Super Admin URL and pagination resilience > PROJ-BREAK-ux-12 array-valued URL params never bypass the same validation
- tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts
  - Super Admin last-third student lookup: tenant-safe application joins > SA-placements-student-lookup-05 job and company-relationship joins sh
- tests/unit/chat9-tpo-settings-legacy-graceful.test.ts
  - TPO Settings legacy copy and graceful editing > TPO-settings-audit-06 protects edited readiness choices against accidental navigation
- tests/unit/chat9-unknown-report-recovery.test.ts
  - TPO report unknown-route recovery > TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton
- tests/unit/ux-admin-chat9-scroll-motion.test.ts
  - chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-03 /admin/students import history dialo

## chat-11
- tests/unit/chat11-college-projects-role-journeys.test.ts
  - IIT Dharwad College Admin Projects role journeys > PROJ-COL-QUERY-02 retains valid filters and pagination across navigation
  - IIT Dharwad College Admin Projects role journeys > PROJ-COL-SCOPE-01 never substitutes a foreign college from a forged URL
- tests/unit/chat11-super-admin-readiness-revocation.test.ts
  - SA-tenants-modules-READY-03 tenant readiness security > rechecks persisted permission after count queries but before returning tenant eviden
- tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts
  - TPO-settings-audit-OUTCOME-CAS-01 custom outcome label retries > checks live actor permissions before the locked read and all CAS/audit writ
- tests/unit/chat11-tpo-private-notifications-revocation.test.ts
  - TPO-settings-audit-NOTIFY-READ-05 private inbox data after role revocation > revalidates persisted TPO role after private notification and p
- tests/unit/tpo-drive-offer-register.test.ts
  - offer register > counts versions, filters status and avoids invented joining
- tests/unit/tpo-recruiters-08-stage-fallback.test.ts
  - TPO-recruiters-08 legacy inferred execution stages > includes every same-company drive even when legacy names map to multiple relationships
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

## chat-12
- tests/unit/chat12-admin-first-third-cross-audit.test.ts
  - UX-admin-first-third-chat12 independent source cross-audit > UX-admin-features-collegeId-01 refuses malformed tenant ID and duplicate scope 
- tests/unit/chat12-round21-verification-history.test.ts
  - TPO-requests-verification-29 returns the latest 50 named audit events and full private review facts

## chat-13
- tests/unit/chat13-cohort-creation-outcomes-gap56.test.ts
  - SA-placements-projects-56 truthful per-student creation results > SA-placements-projects-56 exposes a per-learner table and exports all conf
- tests/unit/chat13-placements-admin-coverage-registry.test.ts
  - SA-ADMIN-LEDGER-01 every dedicated placement-admin/report module has an explicit coverage record > also keeps the 37 first-third /admin and 
  - SA-ADMIN-LEDGER-01 every dedicated placement-admin/report module has an explicit coverage record > enumerates every admin, Super Admin, repo
- tests/unit/chat13-student-placement-lookup-cap.test.ts
  - SA-STUDENT-LOOKUP-CAP-01 truthful supervised placement lookup paging > probes an additional authorized database row and does not disclose it
- tests/unit/chat13-superadmin-interview-operations.test.ts
  - Super Admin placement interview operations > GR-39 long names remain inside a horizontally scrollable table

## chat-14
- tests/unit/projects-mentor-service-guards-chat14.test.ts
  - chat-14 mentor project service boundaries (source compliance) > final delivery mentor decision preserves version, project scope, and assigne
- tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts
  - REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 uses safe send, never OTP template, a
- tests/unit/mentor-project-card-progress.test.ts
  - Mentor project card progress > clamps corrupt counters safely

## chat-15
- tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts
  - HR-REPORT-ARCHIVE-31 published/closed company report portfolio parity > HR-REPORT-MEMBER-42 counts only shortlisted ACTIVE college members w
- tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts
  - HR-PORTFOLIO-OWNER-24 no unauthorized employer portfolio enumeration > HR-PORTFOLIO-ARCHIVE-36 excludes archived and unpublished drives befo
- tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-40.test.tsx
  - HR-CHANGE-REQUESTS-PAGE-40 protected recruiter drive page rendering > uses authenticated context and scoped job ID before showing company ch

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

## chat-17
- tests/unit/UX-coverage-closure-leftovers-chat17.test.ts
  - UX-coverage-closure-leftovers-chat17 ? legacy boundaries and private data > UX-/tpo/verification-coverage-02 preserves its permission, routi

## chat-19
- tests/unit/PROJ-BREAK-chat19-project-workspace-csv.test.ts
  - PROJ-BREAK-EXPORT-01: Project workspace visible-page CSV safety and scope > preserves numeric negative or zero values without turning them i
- tests/unit/chat19-college-cross-audit.test.ts
  - chat-19 college UX cross-audit > COL-XA-08 accepts defaults and bounded, user-visible URL filters
- tests/unit/chat19-invisible-mark-export-matrix.test.ts
  - HR/PROJ-CSV-UNICODE-03: combining-mark prefix is unsafe across every exported screen > preserves ordinary negative numeric totals and litera

