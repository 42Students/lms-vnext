# Unit test failures, latest (CI ff6819dd) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-ledger-round-import-and-scheduling.test.ts
  - TPO-drive-workspace-40/44 round import and scheduling ledger > rejects spreadsheet-notated or out-of-range waitlist ranks without silently n
- tests/unit/chat2-tpo-last-third-route-matrix.test.ts
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/by-branch has a named server page, 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/by-branch reads an authenticated re
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/by-company has a named server page,
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/by-company reads an authenticated r
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/ctc has a named server page, inheri
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/ctc reads an authenticated report i
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/failure-reasons has a named server 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/failure-reasons reads an authentica
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/intelligence has a named server pag
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/intelligence reads an authenticated
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/joining-followups has a named serve
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/joining-followups reads an authenti
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/joining-status has a named server p
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/joining-status reads an authenticat
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/leads has a named server page, inhe
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/leads reads an authenticated report
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/offers-acceptance has a named serve
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/offers-acceptance reads an authenti
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/offers-expiry has a named server pa
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/offers-expiry reads an authenticate
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/placed-branch has a named server pa
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/placed-branch reads an authenticate
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/placement-summary has a named serve
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/placement-summary reads an authenti
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/season-pipeline has a named server 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/season-pipeline reads an authentica
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/unplaced has a named server page, i
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/reports/unplaced reads an authenticated rep
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/requests has a named server page, inherited
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings has a named server page, inherited
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/after-college has a named server p
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/after-college retains a navigable 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/blocked-dates has a named server p
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/blocked-dates retains a navigable 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/branding has a named server page, 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/branding retains a navigable setti
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/job-types has a named server page,
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/job-types retains a navigable sett
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/notices has a named server page, i
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/notices retains a navigable settin
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/notifications has a named server p
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/notifications retains a navigable 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/prep-readiness has a named server 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/prep-readiness retains a navigable
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/public-link has a named server pag
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/public-link retains a navigable se
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/public-page has a named server pag
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/public-page retains a navigable se
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/recruiters has a named server page
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/recruiters retains a navigable set
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/rules has a named server page, inh
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/rules retains a navigable settings
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/season has a named server page, in
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/season retains a navigable setting
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/see has a named server page, inher
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/see retains a navigable settings s
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/team has a named server page, inhe
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/team retains a navigable settings 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/templates has a named server page,
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/templates retains a navigable sett
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/trusted has a named server page, i
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/settings/trusted retains a navigable settin
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students has a named server page, inherited
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students/[membershipId]/history has a named
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students/[membershipId]/participation has a
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students/preparation-plan has a named serve
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students/preparation-prep has a named serve
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/students/requests has a named server page, 
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/team has a named server page, inherited ten
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/team/[threadId] has a named server page, in
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/team/everyone has a named server page, inhe
  - UX-tpo-LAST-THIRD-01: route-level security and resilient rendering > UX-tpo-LAST-THIRD-01 / /tpo/verification has a named server page, inher
- tests/unit/chat2-tpo-public-link-settings.test.ts
  - TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation
- tests/unit/HR-BREAK-company-reports-page-01.test.ts
  - HR-BREAK-company-reports-page-01: unauthorized, invalid, multiple college and retry > invalid college, stage or page params produce friendly
- tests/unit/HR-BREAK-drives-01.test.ts
  - HR-BREAK-drives-01: recruiter requests, retries and stale tabs > validates stale-state token and exact draft identity on recruiter request c
- tests/unit/HR-BREAK-profile-01.test.ts
  - HR-BREAK-profile-01: employer profile, grants and wrong-tenant visibility > fails closed on malformed phone, stale timestamp, invalid names 
- tests/unit/HR-BREAK-round-results-page-01.test.ts
  - HR-BREAK-round-results-page-01 recruiter job and shared candidate privacy > invalid job/round/outcome filter renders reset instead of issuin
- tests/unit/HR-BREAK-tracker-pages-01.test.ts
  - HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > detail view shows own report, non-secret severity and return path
  - HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > malformed or other reporter's IDs cannot fetch report detail by guessing URL
- tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts
  - Super Admin Projects and Placements page routes ? independent security and UX audit > PROJ-BREAK-SA-16 delegates dynamic project IDs to pers
- tests/unit/PROJ-BREAK-TPO-01.test.ts
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > PROJ-BREAK-TPO-02 denies projects and placement data from any w
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > PROJ-BREAK-TPO-03 suspended, disabled or missing memberships ca
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > TPO student-directory permission does not expose unassigned pro
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > a forged membership claim for mentor role cannot bypass persist
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > foreign college and foreign organization cannot infer assigned 
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > rejects non-UUID and nonexistent IDs without granting a guessed
  - PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone > repeated stale-tab lifecycle and manage mutations are refused r
- tests/unit/UX-attendance-calendar-scroll-01.test.ts
  - UX-attendance-calendar-scroll-01 large variable-width attendance calendar > admin-attendance-workspace preserves learner/day/mark grid with 
- tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts
  - UX-college-college-batches-cohort-id-students-01 provides keyboard-scrolling wide roster with fixed identity
- tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts
  - UX-college-college-electives-slot-id-allocate-01 provides keyboard-scrolling wide roster with fixed identity
- tests/unit/UX-college-college-electives-slot-id-offerings-offering-id-roster-01.test.ts
  - UX-college-college-electives-slot-id-offerings-offering-id-roster-01 provides keyboard-scrolling wide roster with fixed identity
- tests/unit/UX-college-overlays-01.test.ts
  - UX-college-overlays-01 college dialog behavior > use-college-confirmation delegates destructive confirmation to shared ConfirmDialog
- tests/unit/UX-college-roster-data-tables-01.test.ts
  - UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/batches/[cohortId]/students keeps enrollment move actions o
  - UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/electives/[slotId]/allocate retains checked learner IDs ins
  - UX-college-roster-data-tables-01 responsive roster and faculty detail > /college/faculty/[membershipId] retains every course and assignment 
- tests/unit/UX-courses-attendance-overlays-01.test.ts
  - UX-courses-attendance-overlay-foundation-01 > shared modal enforces Escape/backdrop policy, focus restoration, scroll cues and accessible ti
- tests/unit/UX-teach-courses-coverage-01.test.ts
  - UX-teach-courses-01 /teach/courses keeps report scope and state contracts
- tests/unit/UX-teacher-courses-deliveryid-discussions-coverage-01.test.ts
  - UX-teacher-courses-deliveryid-discussions-01 /teacher/courses/[deliveryId]/discussions enforces page access and feedback contracts
- tests/unit/UX-teacher-courses-deliveryid-students-coverage-01.test.ts
  - UX-teacher-courses-deliveryid-students-01 /teacher/courses/[deliveryId]/students keeps page scope and true states
- tests/unit/UX-teacher-native-controls-round5.test.ts
  - Faculty native control UX > UX-teacher-courses-deliveryId-gradebook-02 keeps readable phone fields and visible link focus
- tests/unit/UX-teacher-notifications-coverage-01.test.ts
  - UX-teacher-notifications-01 /teacher/notifications keeps access and honest feedback
- tests/unit/UX-teacher-profile-coverage-01.test.ts
  - UX-teacher-profile-01 /teacher/profile keeps access and honest feedback
- tests/unit/UX-teacher-scroll-motion-pass.test.ts
  - Faculty scroll and motion cues > UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column
  - Faculty scroll and motion cues > UX-teacher-scroll-motion-03 cues desktop roster scrolling while retaining phone cards
- tests/unit/UX-teacher-shared-surfaces.test.ts
  - Faculty shared surface mobile and focus rollout > UX-teacher-reports-shared-02 uses both phone cards and desktop report rows with 44px pagin
- tests/unit/mentor-task-transition-model.test.ts
  - Mentor Board transitions > validates mandatory confirmation, ISO token and strict path
- tests/unit/super-admin-colleges-empty-state.test.ts
  - Super Admin college empty state > uses the authorized collection rather than a global unscoped count
- tests/unit/super-admin-colleges-navigation-parity.test.ts
  - College setup links across responsive views > has both branding and readiness in mobile cards
  - College setup links across responsive views > renders scoped tenant setup links in desktop and mobile
- tests/unit/ux-admin-first-third.test.ts
  - Super Admin UX first-third rollout > UX-admin-features-collegeId-trace-02 exposes learner actions on phones and keeps resolution level visib

## chat-3
- tests/unit/tpo-drives-chat-3-round4.test.ts
  - chat-3 Drives round 4 > TPO-drives-51 college administrator has a real separate create flow
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-college-academic-people-gap-closure.test.ts
  - chat-4 College academic and people gap closure > COL-academic-setup-R03 links the required academic-period setup from guides and empty state
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

## chat-6
- tests/unit/chat6-college-placements-round2-verified.test.ts
  - College placement verified operational parity > COL-placements-11 retention report and college student placement lookup are accessible
- tests/unit/chat6-faculty-quiz-report-header-r06.test.ts
  - Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metr
- tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts
  - Final sprint recruiter applicant review accessibility > REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before r
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-college-assessment-export-service-weak.test.ts
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and ne
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns qu
- tests/unit/chat7-college-project-legacy-one-tab.test.ts
  - College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading
- tests/unit/chat7-course-resource-materials-weak.test.ts
  - COURSES-WEAK-RESOURCE-MATERIALS-01 real resource lifecycle validation > permits only titled, credential-free HTTPS resources without fragmen
- tests/unit/chat7-learner-results-service-scoping.test.ts
  - COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity > reveals score and correctness only after CLOSED plu

## chat-9
- tests/unit/PROJ-BREAK-chat9-admin-filters.test.ts
  - IIT Dharwad Projects: Super Admin URL and pagination resilience > PROJ-BREAK-ux-12 array-valued URL params never bypass the same validation
- tests/unit/PROJ-BREAK-chat9-service-bounds.test.ts
  - IIT Dharwad Projects: hostile pagination never triggers an unbounded database offset > PROJ-BREAK-scale-21 service entrypoints enforce bound
- tests/unit/chat9-round9-public-audit.test.ts
  - chat9 public page, signature and audit evidence > TPO-settings-audit-76 bounds stored email signature and keeps preview distinct from actual
- tests/unit/chat9-round9-recruiter-settings.test.ts
  - chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-70 validates and saves optional-SMS monthly limit without claimi
- tests/unit/chat9-unknown-report-recovery.test.ts
  - TPO report unknown-route recovery > TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-performance-01 admin pages bound list size and publish authoring h
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins

## chat-11
- tests/unit/tpo-drive-close-preview-model.test.ts
  - TPO drive close preview > permits confirmed published active-season closure only against the same counts
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

## chat-14
- tests/unit/PROJ-BREAK-chat14-mentor-review-pages.test.tsx
  - PROJ-BREAK-MENTOR-83..90 rendered review inbox parity and role journeys > PROJ-BREAK-MENTOR-83 invalid and duplicated filters do not query s
- tests/unit/projects-mentor-route-guards-chat14.test.ts
  - chat-14 mentor route guards and friendly API error handling > guards meetings/[meetingId]/mentor-decision/route.ts before decoding writes an
  - chat-14 mentor route guards and friendly API error handling > guards meetings/[meetingId]/mentor-reschedule/route.ts before decoding writes 
  - chat-14 mentor route guards and friendly API error handling > guards sprints/[sprintId]/mentor-transition/route.ts before decoding writes an
  - chat-14 mentor route guards and friendly API error handling > guards tasks/[taskId]/mentor-transition/route.ts before decoding writes and de
- tests/unit/learner-projects-gap-verification.test.ts
  - learner/projects verified gap closure > LEARNER-projects-40 checks team confirmation and summary plus evidence
- tests/unit/w03-project-admin-audit.test.ts
  - W03 project admin audit parity contract > reads only PROJECTS activity and preserves legacy-style audit filters
  - W03 project admin audit parity contract > requires an explicit college scope for the super-admin audit surface

## chat-15
- tests/unit/chat15-missed-quiz-release.test.ts
  - chat-15 learner missed quiz, release, and progress parity > LEARNER-course-detail-17 released missed quiz answer key is read-only
- tests/unit/learner-assessment-state-filter-model.test.ts
  - learner assessment state filters > distinguishes submission from published feedback

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

## chat-19
- tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts
  - HR-BREAK-chat19-calendar-company: account-deny and stable navigation > malformed calendar day, view and category use bounded fallback rather
- tests/unit/HR-BREAK-chat19-conversation-page.test.ts
  - HR-BREAK-chat19-conversation-page: actual async role, IDOR and recovery boundary > turns revoked college access into safe recovery, not priv
- tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts
  - HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > invalid hiring query {"applicant":"not-a-uuid"} gets inline recovery, 
  - HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > invalid hiring query {"offerPage":"-3"} gets inline recovery, not a ra
  - HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > invalid hiring query {"offerState":"private"} gets inline recovery, no
  - HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > invalid hiring query {"page":"0"} gets inline recovery, not a raw Zod 
  - HR-BREAK-chat19-legacy-navigation-job-page: authorize then redirect > invalid hiring query {"stage":"SUPER_ADMIN"} gets inline recovery, not

