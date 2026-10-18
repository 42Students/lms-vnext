# Unit test failures, latest (CI ff6819dd) (cloud CI 698eb9dd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-ledger-round-import-and-scheduling.test.ts
  - TPO-drive-workspace-40/44 round import and scheduling ledger > rejects same-meaning duplicate CSV headers and malformed blank data rows
- tests/unit/chat2-public-join-disabled.test.ts
  - TPO-campaigns-public-21 opt-in link gate > refuses forged company and college scopes
- tests/unit/chat2-tpo-public-link-settings.test.ts
  - TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation
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
  - HR-BREAK-tracker-pages-01: reporter-owned routes and recovery > malformed or other reporter's IDs cannot fetch report detail by guessing URL
- tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts
  - Super Admin Projects and Placements page routes ? independent security and UX audit > PROJ-BREAK-SA-16 delegates dynamic project IDs to pers
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
- tests/unit/tpo-drives-chat-3-round4.test.ts
  - chat-3 Drives round 4 > TPO-drives-51 college administrator has a real separate create flow
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes
  - College People legacy audited page contracts > COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy

## chat-4
- tests/unit/chat4-college-ux-round3.test.ts
  - Chat-4 college UX round 3 > UX-college-batches-cohortId-students-01 adds safe narrow-screen affordances
- tests/unit/chat4-college-ux-round5.test.ts
  - Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-electives-slotId-offerings-offeringId-roster-01 makes the layout or actions more readable on narro
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page si

## chat-5
- tests/unit/chat5-delegated-policy-decisions.test.ts
  - Chat-5 delegated decisions: safe behavior and remaining boundaries > TPO-campaigns-public-25 keeps public join links explicitly revocable in

## chat-6
- tests/unit/PROJ-BREAK-chat6-role-journeys.test.ts
  - Projects IIT Dharwad ? cross-account navigation and denial breaker > PROJ-BREAK-pages-02 College Admin without an active selected membership
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
- tests/unit/chat7-course-delivery-roster-weak.test.ts
  - COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > source query guards both paths by persisted ACTIVE use
- tests/unit/chat7-course-resource-materials-weak.test.ts
  - COURSES-WEAK-RESOURCE-MATERIALS-01 real resource lifecycle validation > permits only titled, credential-free HTTPS resources without fragmen
- tests/unit/learner-placements-chat7-notice-actions.test.ts
  - Chat-7 learner notice action and audience parity > LEARNER-placements-47 renders only safe persisted TPO action links

## chat-9
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels
- tests/unit/chat9-college-projects-template-catalogue.test.ts
  - chat-9 College Projects template catalogue > COL-projects-08 renders template tags in both list and cards without introducing a new status
- tests/unit/chat9-phase2-college-group-tabs.test.ts
  - college group tabs exact legacy navigation labels > COL-academic-setup-13 keeps the academic-period overview reachable without inventing a l
  - college group tabs exact legacy navigation labels > renders academic section labels in exact dev-legacy order
- tests/unit/chat9-round6-calendar-settings.test.ts
  - chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation
- tests/unit/chat9-round6-college-projects-parity.test.ts
  - College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy ris
- tests/unit/chat9-super-admin-navigation-reachability.test.ts
  - Super Admin 13-row sidebar grouped page reachability > every grouped tab is a real vNext Super Admin page with unique active state
- tests/unit/chat9-tpo-settings-legacy-graceful.test.ts
  - TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-04 admin status edits serialize stale tabs before changing a
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-resilience-01 object-store cleanup failure cannot reverse committe
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/de
- tests/unit/ux-admin-chat9-coverage-closure.test.ts
  - chat-9 route coverage and native DataTable closure > UX-admin-route-coverage-04 every /admin last-third route has a named source contract an
- tests/unit/ux-admin-chat9-round9-legacy.test.ts
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-legacy-academic-01 keeps only ten academic tabs and routes the overview through 
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recover
  - chat-9 Round 9: legacy labels survive UX rollout > UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab

## chat-11
- tests/unit/tpo-student-quick-panel.test.ts
  - TPO-students-02 roster student deep link and drawer > renders five panel tabs with safe detailed navigation

## chat-12
- tests/unit/chat12-round41-undo-guarded.test.ts
  - TPO-students-16 Undo action is not rejected by its own guarded-action lock

## chat-13
- tests/unit/chat13-platform-placement-policy-adversarial.test.ts
  - Super Admin placement policy adversarial boundaries > SA-PLACEMENT-POLICY-03 rejects NaN, infinite or fractional-integer values for every gl
- tests/unit/chat13-ux-cross-audit-tpo-loading.test.ts
  - UX-cross-tpo-second-C13-026-22 slow loading and recovery

## chat-14
- tests/unit/projects-phase2-file-visibility-guard.test.ts
  - PR-S2-11 no private resource file downloads > restricts list and direct signed grants independently

## chat-15
- tests/unit/learner-assessment-state-filter-model.test.ts
  - learner assessment state filters > distinguishes submission from published feedback

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

## chat-17
- tests/unit/UX-kit-role-and-overlay-chat17.test.tsx
  - UX-kit-HARDEN-23 authorization boundaries and WebView history > UX-kit-HARDEN-27 table cells render once per row and redacts unsafe rowHref

## chat-19
- tests/unit/chat19-college-cross-audit.test.ts
  - chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail
- tests/unit/chat19-college-source-coverage.test.ts
  - chat-19 all /college route entry point source coverage > UX-college-source-coverage-02 verifies links into Projects are always scoped to /co

