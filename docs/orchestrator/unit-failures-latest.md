# Unit test failures, latest (CI 372038db) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-company-memory-gap-parity.test.ts
  - TPO Company Memory legacy parity > TPO-companies-21 never exposes DB migration identifiers or raw not-found jargon
- tests/unit/chat2-company-trust-and-navigation.test.ts
  - Chat-2 Company relationship and legacy Companies navigation > TPO-companies-29 offers a non-scrolling mobile directory with per-company data
- tests/unit/chat2-engage-open-gap-decisions.test.ts
  - Engage remaining safe and reachable controls > TPO-recruiters-36 has horizontally reachable stages and keyboard-trapped edit dialogs while r
- tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts
  - Final sprint recruiter profile/company verification > REC-calendar-messages-profile-35 distinguishes verified report status buckets and neve
  - Final sprint recruiter profile/company verification > REC-calendar-messages-profile-41 keeps verified invite email read-only and discloses p
- tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts
  - TPO-campaigns-public-12 / T-S2-04 campaign safety ledger > validates controlled draft template and renders plain-text placeholders
- tests/unit/chat2-ledger-round-import-and-scheduling.test.ts
  - TPO-drive-workspace-40/44 round import and scheduling ledger > rejects same-meaning duplicate CSV headers and malformed blank data rows
- tests/unit/chat2-tpo-lead-modal-source.test.ts
  - TPO recruiter contact modal and source parity > TPO-recruiters-36 traps Tab and supports Escape inside editable recruiter dialogs
- tests/unit/chat2-tpo-recruiter-leads-copy.test.ts
  - TPO recruiter leads visible legacy parity > TPO-recruiters-40 restores edit-action heading and legacy Save label
- tests/unit/chat2-unsubscribe-graceful.test.ts
  - Public unsubscribe confirmations > TPO-campaigns-public-16 uses the same success response for used or unknown tokens
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
- tests/unit/PROJ-BREAK-LEARNER-ROUTES-01.test.ts
  - PROJ-BREAK-LEARNER-ROUTES-01 actual Next.js Learner task route actions > maps simulated expired/stale/cross-tenant backlog pull failure to f
  - PROJ-BREAK-LEARNER-ROUTES-01 actual Next.js Learner task route actions > maps simulated expired/stale/cross-tenant own-task deletion failure
  - PROJ-BREAK-LEARNER-ROUTES-01 actual Next.js Learner task route actions > maps simulated expired/stale/cross-tenant task progress failure to 
  - PROJ-BREAK-LEARNER-ROUTES-01 actual Next.js Learner task route actions > maps simulated expired/stale/cross-tenant task status failure to fr
- tests/unit/PROJ-BREAK-SA-security-and-resilience.test.ts
  - Super Admin Projects adversarial controls > PROJ-BREAK-SA-03 denies lock/review transitions for archived or locked projects and stale submis
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
- tests/unit/UX-teacher-notifications-coverage-01.test.ts
  - UX-teacher-notifications-01 /teacher/notifications keeps access and honest feedback
- tests/unit/UX-teacher-profile-coverage-01.test.ts
  - UX-teacher-profile-01 /teacher/profile keeps access and honest feedback
- tests/unit/UX-teacher-scroll-motion-pass.test.ts
  - Faculty scroll and motion cues > UX-teacher-scroll-motion-02 cues horizontal attendance and retains sticky learner column
  - Faculty scroll and motion cues > UX-teacher-scroll-motion-03 cues desktop roster scrolling while retaining phone cards
- tests/unit/UX-teacher-shared-surfaces.test.ts
  - Faculty shared surface mobile and focus rollout > UX-teacher-reports-shared-02 uses both phone cards and desktop report rows with 44px pagin
- tests/unit/inbound-mail-admin-service.test.ts
  - Super Admin inbound mail authorization > rejects wrong role before touching storage and ignores selected tenant scope
- tests/unit/mentor-final-delivery-decision-model.test.ts
  - Mentor final review constraints > does not re-review resolved or archived deliveries
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
- tests/unit/chat3-final-sprint-companies-round14.test.ts
  - chat-3 final sprint TPO Companies > TPO-companies-26 create-company confirmation provides dialog Escape and keyboard focus trap
  - chat-3 final sprint TPO Companies > TPO-companies-28 canonical hiring cards never display candidate names in company summary
- tests/unit/chat3-final-sprint-company-accessibility.test.ts
  - chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-26 preserves scoped company UI and privacy guarantees
  - chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-28 preserves scoped company UI and privacy guarantees
- tests/unit/chat3-final-sprint-company-memory.test.ts
  - chat-3 final sprint TPO Companies company memory > TPO-companies-08 preserves the persisted legacy company memory contract
- tests/unit/chat3-learner-round12-parity-contracts.test.ts
  - chat-3 learner misc second-source verification > LEARNER-learning-misc-36 attendance table retains explicit date and start-time headings
- tests/unit/chat3-round9-origin-and-portal-regression.test.ts
  - Chat-3 Round 9 restored contracts > TPO-drives-29/30/38 external employer portal uses noopener noreferrer
- tests/unit/chat3-tpo-supplemental-round14.test.ts
  - TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB
- tests/unit/tpo-drives-chat-3-round4.test.ts
  - chat-3 Drives round 4 > TPO-drives-45 automatically applies 11:59 PM IST once, then preserves user edits and restored drafts
  - chat-3 Drives round 4 > TPO-drives-49 closed drive has immutable explanation, clone path and retriable read boundary
  - chat-3 Drives round 4 > TPO-drives-51 college administrator has a real separate create flow
- tests/unit/college-admin-final-delivery-review.test.ts
  - COL-projects-01 final delivery settlement > restricts decisions to submitted, and lock to submitted/approved
- tests/unit/college-admin-read-first-boundaries.test.ts
  - College Admin read-first page boundaries > quizzes retains a page, loading and retry-capable error boundary
  - College Admin read-first page boundaries > resources retains a page, loading and retry-capable error boundary
  - College Admin read-first page boundaries > semester-courses retains a page, loading and retry-capable error boundary
  - College Admin read-first page boundaries > semesters retains a page, loading and retry-capable error boundary
  - College Admin read-first page boundaries > students retains a page, loading and retry-capable error boundary
  - College Admin read-first page boundaries > videos retains a page, loading and retry-capable error boundary
- tests/unit/college-faculty-round6-gap-verification.test.ts
  - chat-11 College roster and Faculty attendance source parity > COL-academic-setup-28 verifies batch roster, search and class-move entry
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes
  - College People legacy audited page contracts > COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy
  - College People legacy audited page contracts > COL-people-27 Faculty and Learner use responsive cards and bounded desktop table
- tests/unit/college-project-delivery-review.test.ts
  - COL-projects-14 workspace Delivery review > supports Accept/Request changes only from submitted and Lock from submitted or accepted
- tests/unit/college-recurring-preview.test.ts
  - College recurring preview is IST-safe and bounded > truncates displayed error payloads
- tests/unit/faculty-attendance-source-round5.test.ts
  - chat-11 faculty attendance gap closure verification > FAC-attendance-grades-02 guards all attendance dirty-mode, date, session and unload ch

## chat-4
- tests/unit/chat4-college-course-tabs-gap-closure.test.ts
  - chat-4 College Course Tabs gap closure > COL-course-tabs-17 permits only metadata in authorized admin content preview
  - chat-4 College Course Tabs gap closure > COL-course-tabs-27 shows Lessons, Progress, Assignments and Quizzes as mobile cards
- tests/unit/chat4-college-ux-round3.test.ts
  - Chat-4 college UX round 3 > UX-college-batches-cohortId-students-01 adds safe narrow-screen affordances
- tests/unit/chat4-college-ux-round5.test.ts
  - Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narro
- tests/unit/chat4-final-fac-courses-28.test.ts
  - FAC-courses-28 roster parity with secure image fallback > FAC-courses-28 makes a keyboard-operable, namespaced avatar preview and always-vis
- tests/unit/chat4-final-sprint-tpo-recruiters-a.test.ts
  - chat-4 final sprint TPO recruiter gaps A > TPO-recruiters-21 has company-required add, future follow-up and dirty-draft confirmation
- tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts
  - chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-29 renders safe missing-record responses, recovery and loading surfaces
  - chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-37 provides keyboard equivalents for inaccessible board dragging and focus-managed
- tests/unit/chat4-learner-home-courses-gap-closure.test.ts
  - chat-4 learner Home and Courses gap closure > LEARNER-home-courses-19 uses an in-page Delete this message dialog
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page si
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-63 retains the verified Projects behavior
- tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts
  - chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-55 preserves the audited admin workflow
- tests/unit/chat4-tpo-home-gap-closure.test.ts
  - chat-4 verified TPO Home gap coverage > TPO-home-20 verified legacy and graceful behavior

## chat-5
- tests/unit/chat5-final-faculty-courses-a.test.ts
  - chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-28 renders contacts and missing-roll copy, sorted roster, an
- tests/unit/chat5-final-faculty-discussion.test.ts
  - chat-5 final sprint: Faculty course discussions > FAC-courses-R05 protects unsent drafts on browser reload and same-origin course navigation
- tests/unit/chat5-ux-cross-tpo-last.test.ts
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-students-membershipid-history-02 includes a new per-page finding, state and 
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-students-membershipid-history-09 preserves legacy page wording while enforci
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-students-membershipid-participation-02 includes a new per-page finding, stat
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-students-membershipid-participation-09 preserves legacy page wording while e
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-team-threadid-02 includes a new per-page finding, state and test trail
  - Chat-5 UX CROSS AUDIT: /tpo LAST THIRD (routes 85?126) > UX-tpo-team-threadid-09 preserves legacy page wording while enforcing authenticated
- tests/unit/chat5-ux-tpo-middle-third.test.ts
  - chat-5 UX /tpo middle-third route coverage (43?84) > UX-tpo-reports-after-college-02 keeps six report columns on phone and explicit filtered
- tests/unit/tpo-batches-40-chat5.test.ts
  - TPO batch eligibility import presentation > TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers
- tests/unit/tpo-batches-43-chat5.test.ts
  - TPO learner override parity > TPO-batches-43 shows the exact six private ineligibility reasons and guarded Undo
- tests/unit/tpo-batches-chat5-next-round.test.ts
  - TPO Batches next-round source and behavioral gap closure > TPO-batches-43 keeps the ineligible reason and client draft when an API write fai
- tests/unit/tpo-batches-chat5-round3.test.ts
  - TPO batches chat-5 verified source and behavior > TPO-batches-30: verifies persisted batch workflow contract
- tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts
  - chat-5 OPEN gap regression baselines > TPO-drive-workspace-27 partial baseline ? further implementation required

## chat-6
- tests/unit/PROJ-BREAK-chat6-role-journeys.test.ts
  - Projects IIT Dharwad ? cross-account navigation and denial breaker > PROJ-BREAK-pages-02 College Admin without an active selected membership
- tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts
  - Final sprint recruiter applicant review accessibility > REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before r
- tests/unit/chat6-independent-finding-actions-round10.test.ts
  - Independent audit finding action workflow > SA-placements-projects-121 records version-checked finding edits and reason-required terminal st
- tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts
  - Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile wid
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-college-assessment-export-service-weak.test.ts
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > cannot silently export more than 1000 rows, labels truncated set and ne
  - COURSES-WEAK-EXPORT-SERVICE-01 account-scoped export query and cap > reads paginated results using the same current context/kind, returns qu
- tests/unit/chat7-college-project-legacy-one-tab.test.ts
  - College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading
- tests/unit/chat7-course-delivery-roster-weak.test.ts
  - COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > source query guards both paths by persisted ACTIVE use
- tests/unit/chat7-course-resource-materials-weak.test.ts
  - COURSES-WEAK-RESOURCE-MATERIALS-01 real resource lifecycle validation > permits only titled, credential-free HTTPS resources without fragmen
- tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts
  - Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names
- tests/unit/chat7-round3-mentor-basics.test.ts
  - chat-7 round 3 mentor access and state > MEN-projects-meetings-02 mentor workspace advertises pending loading
- tests/unit/learner-placements-chat7-schedule-surface.test.ts
  - Chat-7 schedule parity > LEARNER-placements-41 exposes online assessments without pretending schedule is attendance
- tests/unit/recruiter-home-drives-chat7-acceptance.test.ts
  - Recruiter Home Drives source contracts > REC-home-drives-42 uses the native modal drawer for URL-selected applicant review

## chat-9
- tests/unit/PROJ-BREAK-chat9-admin-role-journeys.test.ts
  - IIT Dharwad Projects: College Admin access and lifecycle breaker > PROJ-BREAK-state-20 no review or lock can revive completed or archived pr
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-01 allows only valid final submission review and lock transitions
- tests/unit/chat9-college-projects-template-catalogue.test.ts
  - chat-9 College Projects template catalogue > COL-projects-08 renders template tags in both list and cards without introducing a new status
- tests/unit/chat9-phase2-college-group-tabs.test.ts
  - college group tabs exact legacy navigation labels > COL-academic-setup-13 keeps the academic-period overview reachable without inventing a l
  - college group tabs exact legacy navigation labels > renders academic section labels in exact dev-legacy order
- tests/unit/chat9-round9-recruiter-settings.test.ts
  - chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-54 requires a same-origin authenticated write and never treats d
- tests/unit/chat9-super-admin-navigation-reachability.test.ts
  - Super Admin 13-row sidebar grouped page reachability > every grouped tab is a real vNext Super Admin page with unique active state
- tests/unit/chat9-tpo-settings-source-closure.test.ts
  - TPO settings audited source features > TPO-settings-audit-59 verifies partial implementation in src/components/placements/tpo-recruiter-gran
- tests/unit/chat9-unknown-report-recovery.test.ts
  - TPO report unknown-route recovery > TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton
- tests/unit/proj-break-chat9-models.test.ts
  - IIT Dharwad Projects adversarial admin/college models > PROJ-BREAK-state-03 approval/review/lock cannot mutate archived, locked or draft sub
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/de
- tests/unit/ux-admin-chat9-batch-01.test.ts
  - chat-9 last-third admin UX rollout, batch 01 > UX-admin-projects-01 preserves authorized route and accessible UX surface
- tests/unit/ux-admin-chat9-coverage-closure.test.ts
  - chat-9 route coverage and native DataTable closure > UX-admin-route-coverage-04 every /admin last-third route has a named source contract an
- tests/unit/ux-admin-chat9-round9-legacy.test.ts
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-legacy-academic-01 keeps only ten academic tabs and routes the overview through 
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recover

## chat-11
- tests/unit/tpo-company-memory-effect-retry.test.ts
  - TPO Company Memory fetch lifecycle > clears previous data explicitly for a user-triggered retry
- tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts
  - Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-27 provides an authorized modal and per-selection review queue
- tests/unit/tpo-inbox-team-round2.test.ts
  - Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-13 provides phone-friendly conversation cards and All conversations bac
- tests/unit/tpo-notice-round4-verification.test.ts
  - TPO placement announcement round-4 evidence > TPO-inbox-team-50 has the legacy modal and paired optional button input
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations
- tests/unit/tpo-student-quick-panel.test.ts
  - TPO-students-02 roster student deep link and drawer > renders five panel tabs with safe detailed navigation

## chat-12
- tests/unit/chat12-filter-chips-mobile-round5.test.ts
  - chat12 mobile filters and chips > TPO-students-51 exposes an accessible mobile filter disclosure and bottom sheet
- tests/unit/chat12-round19-roster-responsive-counts.test.ts
  - TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and colla

## chat-13
- tests/unit/chat13-academic-existing-routes.test.ts
  - Chat13 Academic existing route and mutation contracts > SA-academics-people-39 academic tables have narrow screen horizontal scrolling
- tests/unit/chat13-academic-graduation-capacity.test.ts
  - Super Admin graduation and class capacity > SA-academics-people-41 labels full classes and blocks full-class moves before the request
- tests/unit/chat13-admin-first-third-audit.test.ts
  - chat-13 Super Admin /admin first-third route source audit > SA-ADMIN-FIRST-08 retains exact academic lifecycle labels, including archived ba
- tests/unit/chat13-placement-access-trace-gap31.test.ts
  - SA-tenants-modules-31 in-page learner explanation > SA-tenants-modules-31 offers college-scoped autocomplete with an accessible closeable dr
- tests/unit/chat13-super-admin-academic-copy.test.ts
  - Super Admin Academic Setup legacy copy and defaults > SA-academics-people-36 formats persisted status enums as legacy-readable names

## chat-14
- tests/unit/recruiter-chat14-resume-access.test.ts
  - REC-home-drives-38 employer-shared private resume grants > REC-home-drives-38 avoids server-rendering object keys and requests signed link o
- tests/unit/recruiter-chat14-round3.test.ts
  - chat-14 recruiter reassigned batch 3 > REC-home-drives-50 uses readable, scoped offer columns and employment outcomes
- tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts
  - chat-14 recruiter ownership and private review gap closure > REC-home-drives-38 never exposes roll number or email without an active relatio
  - chat-14 recruiter ownership and private review gap closure > REC-home-drives-38 only projects verified college-authorized academic marks
  - chat-14 recruiter ownership and private review gap closure > REC-home-drives-38 shares enrolled branch/phone only when college columns allow
- tests/unit/ux-chat14-high-risk-contracts.test.ts
  - chat-14 mentor and HR UX critical page contracts > UX-hr-placements-jobs-jobId-02 distinguishes authorized applicant review, selection and o
- tests/unit/ux-chat14-hr-02.test.ts
  - chat-14 HR UX rollout batch 02 > UX-hr-hr-placements-jobs-jobId-01 guards recruiter responsive page source
- tests/unit/UX-college-projects-create-01.test.ts
  - UX-college-projects-create-01 /college/projects/create > keeps college membership scope before fetching assigned templates or showing creati
- tests/unit/w03-project-admin-surfaces.test.ts
  - W03 project admin daily-use surface parity > keeps workspace search, status and pagination on both admin accounts

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

## chat-17
- tests/unit/UX-learning-cross-audit-chat17.test.ts
  - chat-17 learning cross-audit: inventory and all 84 authored route shells > UX-learn-/learn/my-placements/announcements-01 never reintroduces

## chat-19
- tests/unit/UX-college-cross-audit-chat19.test.ts
  - College cross-audit fixes (independent chat-19) > COL-XA-03 activity retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 attendance/corrections retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 batch-promotion retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 batches/[cohortId]/students retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 electives/[slotId]/allocate retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 electives/[slotId]/offerings/[offeringId]/roster retains a scrollable sticky ide
  - College cross-audit fixes (independent chat-19) > COL-XA-03 faculty-assignment retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 faculty/[membershipId] retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 index retains a scrollable sticky identity column
- tests/unit/chat19-college-cross-audit.test.ts
  - chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail
- tests/unit/chat19-college-source-coverage.test.ts
  - chat-19 all /college route entry point source coverage > UX-college-source-coverage-02 verifies links into Projects are always scoped to /co

