# Unit test failures, latest (CI 698eb9dd) (cloud CI 698eb9dd)

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
  - Public unsubscribe confirmations > TPO-campaigns-public-16 shows a retryable inline error, not raw JSON form navigation
- tests/unit/tpo-notice-safe-links-chat2.test.ts
  - TPO notice link rendering > TPO-inbox-team-49 never turns escaped or syntactically invalid URLs into outbound buttons
- tests/unit/UX-attendance-calendar-scroll-01.test.ts
  - UX-attendance-calendar-scroll-01 large variable-width attendance calendar > admin-attendance-workspace preserves learner/day/mark grid with 
- tests/unit/UX-college-college-batches-cohort-id-students-01.test.ts
  - UX-college-college-batches-cohort-id-students-01 provides keyboard-scrolling wide roster with fixed identity
- tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts
  - UX-college-college-electives-slot-id-allocate-01 provides keyboard-scrolling wide roster with fixed identity
- tests/unit/UX-college-overlays-01.test.ts
  - UX-college-overlays-01 college dialog behavior > use-college-confirmation delegates destructive confirmation to shared ConfirmDialog
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
- tests/unit/college-recurring-preview.test.ts
  - College recurring preview is IST-safe and bounded > truncates displayed error payloads
- tests/unit/faculty-attendance-source-round5.test.ts
  - chat-11 faculty attendance gap closure verification > FAC-attendance-grades-02 guards all attendance dirty-mode, date, session and unload ch

## chat-4
- tests/unit/chat4-college-academic-people-gap-closure.test.ts
  - chat-4 College academic and people gap closure > COL-academic-setup-R03 links the required academic-period setup from guides and empty state
- tests/unit/chat4-college-course-tabs-gap-closure.test.ts
  - chat-4 College Course Tabs gap closure > COL-course-tabs-17 permits only metadata in authorized admin content preview
  - chat-4 College Course Tabs gap closure > COL-course-tabs-27 shows Lessons, Progress, Assignments and Quizzes as mobile cards
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
- tests/unit/PROJ-BREAK-chat6-state-security.test.ts
  - IIT Dharwad Projects breaker ? state, access, integrity, deadlines and files > PROJ-BREAK-file-01 uploading cannot succeed from transfer pro
- tests/unit/chat6-college-placements-round3-ui.test.ts
  - College Admin drive UI and graceful failure > COL-placements-25 renders selectable action-capable mobile application and drive cards
- tests/unit/chat6-faculty-assessment-parity-batch.test.ts
  - Faculty assessment legacy parity follow-up > FAC-assessments-14 saves routine drafts without redundant checkbox and confirm dialog
- tests/unit/chat6-faculty-quiz-report-header-r06.test.ts
  - Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metr
- tests/unit/chat6-faculty-schedule-and-tracker-evidence-round17.test.ts
  - chat-6 source-evidence gaps > SA-placements-projects-102 mounts authenticated Alt+B report drawer with captured page/browser/viewport contex
- tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts
  - Final sprint recruiter applicant review accessibility > REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before r
- tests/unit/chat6-independent-finding-actions-round10.test.ts
  - Independent audit finding action workflow > SA-placements-projects-121 records version-checked finding edits and reason-required terminal st
- tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts
  - Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile wid
- tests/unit/chat6-recruiter-lifecycle-round3.test.ts
  - Super Admin recruiter legacy lifecycle > SA-academics-people-109 offers suspend and reactivate with confirmation and session-safe archive
  - Super Admin recruiter legacy lifecycle > SA-academics-people-114 restores recruiter accounts page search and college access copy
- tests/unit/chat6-superadmin-course-catalogue-round4.test.ts
  - chat-6 Super Admin selected-college course directory parity > SA-academics-people-62 shows scoped student visibility and lesson ordering wit
- tests/unit/chat6-superadmin-course-entrypoints.test.ts
  - Super Admin course in-tab entry points > SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-college-project-legacy-one-tab.test.ts
  - College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading
- tests/unit/chat7-round3-mentor-basics.test.ts
  - chat-7 round 3 mentor access and state > MEN-projects-meetings-02 mentor workspace advertises pending loading
- tests/unit/learner-placements-chat7-schedule-surface.test.ts
  - Chat-7 schedule parity > LEARNER-placements-41 exposes online assessments without pretending schedule is attendance
- tests/unit/recruiter-home-drives-chat7-acceptance.test.ts
  - Recruiter Home Drives source contracts > REC-home-drives-42 uses the native modal drawer for URL-selected applicant review

## chat-9
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-23 uses responsive wrappers but retains browser width acceptance as open
- tests/unit/chat9-final-SA-placements-projects-102.test.ts
  - chat9 final quick-report launcher > SA-placements-projects-102 exposes the existing issue launcher in every authenticated shell without a ne
- tests/unit/chat9-round6-project-risk-audit.test.ts
  - College Projects risk and activity acceptance > COL-projects-23 ensures ten-tab workspace navigation is keyboard-scrollable at narrow widths
- tests/unit/chat9-round9-recruiter-settings.test.ts
  - chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-54 requires a same-origin authenticated write and never treats d
- tests/unit/chat9-tpo-settings-source-closure.test.ts
  - TPO settings audited source features > TPO-settings-audit-59 verifies partial implementation in src/components/placements/tpo-recruiter-gran
- tests/unit/chat9-unknown-report-recovery.test.ts
  - TPO report unknown-route recovery > TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton
- tests/unit/proj-break-chat9-models.test.ts
  - IIT Dharwad Projects adversarial admin/college models > PROJ-BREAK-exports-02 quoted commas, quotes and multiline fields do not create a new
- tests/unit/proj-break-chat9-services.test.ts
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-races-05 version publish serializes concurrent archives and reassi
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins
  - IIT Dharwad Projects adversarial service and route contracts > PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/de
- tests/unit/ux-admin-chat9-coverage-closure.test.ts
  - chat-9 route coverage and native DataTable closure > UX-admin-route-coverage-04 every /admin last-third route has a named source contract an
- tests/unit/ux-admin-chat9-scroll-motion.test.ts
  - chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-04 /admin/projects workspace table has 
  - chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-05 /admin/projects/templates/[templateI
  - chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-06 /admin/projects/submissions unsubmit

## chat-11
- tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts
  - Drive workspace S2 source-to-UI contracts > TPO-drive-workspace-27 provides an authorized modal and per-selection review queue
- tests/unit/tpo-inbox-team-round2.test.ts
  - Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-13 provides phone-friendly conversation cards and All conversations bac
  - Chat-2 TPO Inbox + Team legacy verification round 2 > TPO-inbox-team-49 displays a scoped notice CTA only when it is a safe HTTPS link
- tests/unit/tpo-notice-round4-verification.test.ts
  - TPO placement announcement round-4 evidence > TPO-inbox-team-49 renders a safe button for notices with HTTPS destinations
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
- tests/unit/chat13-placement-access-trace-gap31.test.ts
  - SA-tenants-modules-31 in-page learner explanation > SA-tenants-modules-31 offers college-scoped autocomplete with an accessible closeable dr
- tests/unit/chat13-super-admin-academic-copy.test.ts
  - Super Admin Academic Setup legacy copy and defaults > SA-academics-people-36 formats persisted status enums as legacy-readable names

## chat-14
- tests/unit/ux-chat14-high-risk-contracts.test.ts
  - chat-14 mentor and HR UX critical page contracts > UX-hr-company-reports-02 preserves phone cards and accessible desktop data reports
  - chat-14 mentor and HR UX critical page contracts > UX-hr-profile-02 preserves recruiter profile mutations and read-only college access
- tests/unit/ux-chat14-hr-01.test.ts
  - chat-14 HR UX rollout batch 01 > UX-hr-hr-company-reports-01 retains recruiter UX and safe markup contracts
- tests/unit/ux-chat14-hr-03.test.ts
  - chat-14 HR UX rollout batch 03 > UX-hr-hr-profile-01 protects responsive route semantics
- tests/unit/projects-phase2-exact-tabs.test.ts
  - Phase2 exact legacy Projects labels + single tab strip > keeps exact Mentor labels and drops obsolete unassigned-task warning
- tests/unit/projects-phase2-legacy-labels.test.ts
  - exact legacy Mentor Projects copy > preserves exact legacy project tabs from the source catalogue

## chat-15
- tests/unit/chat15-assessment-submission-deadline.test.ts
  - learner vendor assessment deadline source of truth > LEARNER-placements-37 and LEARNER-placements-41 expose safe test links with no inferred
- tests/unit/chat15-offer-letter-and-placement.test.ts
  - chat-15 learner offers and internship truth > LEARNER-placements-45 only reveals persisted safe HTTPS employer letters
- tests/unit/chat15-quiz-table-legacy.test.ts
  - Chat-15 learner quizzes table parity > LEARNER-learning-misc-16 presents the seven legacy quiz table columns and honest grade disclosure
- tests/unit/learner-attendance-parity.test.ts
  - learner attendance parity surface > keeps server-loaded course identity and explicit loading/error recovery
- tests/unit/learner-learning-misc-gap-closure.test.ts
  - Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-36 attendance report restores legacy four column labels

## chat-16
- tests/unit/chat16-final-sa-tenants-modules-25.test.ts
  - SA-tenants-modules-25 inline college feature controls > SA-tenants-modules-25 renders independent college x module editors with explicit inh
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
  - College cross-audit fixes (independent chat-19) > COL-XA-03 faculty/[membershipId] retains a scrollable sticky identity column
  - College cross-audit fixes (independent chat-19) > COL-XA-03 index retains a scrollable sticky identity column

