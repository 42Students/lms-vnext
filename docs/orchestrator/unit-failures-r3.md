# Unit test failures, round 3 (cloud CI 9b1e78bd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-LEARNER-course-detail-R03-live-session-policy.test.ts
  - LEARNER-course-detail-R03 ? scheduled live class Join/Copy > LEARNER-course-detail-R03 applies release policy inside the learner authorizati
- tests/unit/chat2-recruiter-draft-discard.test.ts
  - Recruiter Messages draft protection > REC-calendar-messages-profile-12 warns before closing a nonempty reply
- tests/unit/chat2-tpo-unowned-work-parity.test.ts
  - TPO unowned work assignment safety > TPO-inbox-team-33 exposes a guarded, accessible assigner only when the schema is ready
- tests/unit/chat2-unconfirmed-inbox-decisions.test.ts
  - TPO inbox ambiguous legacy behaviours resolved by safer policy > TPO-inbox-team-08 does not claim provider email delivery without an active
- tests/unit/mentor-resource-list-round5.test.ts
  - mentor resource list parity > MEN-projects-meetings-57 lists human-facing resource labels, last update, state and safe links

## chat-3
- tests/unit/chat3-closure-round13-six.test.ts
  - chat-3 final six round13 audited functional closures > LEARNER-learning-misc-33 distinguishes unassigned, empty week and retriable error
- tests/unit/chat3-final-sprint-company-team-and-review.test.ts
  - Chat-3 final sprint team and review contracts > TPO-companies-05 uses proposed schema, bounded messages and truthful unavailable migration s
- tests/unit/tpo-drives-chat-3-round4.test.ts
  - chat-3 Drives round 4 > TPO-drives-45 automatically applies 11:59 PM IST once, then preserves user edits and restored drafts
  - chat-3 Drives round 4 > TPO-drives-51 college administrator has a real separate create flow
- tests/unit/api-origin-guard.test.ts
  - state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin
- tests/unit/college-mentor-round7-gap-verification.test.ts
  - chat-11 college and mentor interaction contracts > MEN-projects-meetings-57 shows Open link and guards invalid or blocked resource windows
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

## chat-5
- tests/unit/chat5-delegated-policy-decisions.test.ts
  - Chat-5 delegated decisions: safe behavior and remaining boundaries > TPO-inbox-team-08 never fabricates email relay or inbound-email deliver
- tests/unit/chat5-final-faculty-discussion.test.ts
  - chat-5 final sprint: Faculty course discussions > FAC-courses-R06 preserves latest successfully fetched discussion messages and exposes retr
- tests/unit/tpo-batches-chat5-next-round.test.ts
  - TPO Batches next-round source and behavioral gap closure > TPO-batches-40 uses the expected legacy import heading and confirm button
- tests/unit/tpo-drive-applicant-partials-chat5.test.ts
  - TPO drive applicant partial parity and query safety > TPO-drive-workspace-72 collapses mobile actions and filters
- tests/unit/tpo-drive-workspace-72-chat5.test.ts
  - TPO drive mobile action layout > TPO-drive-workspace-72 renders collapsed mobile Actions and responsive applicant cards
- tests/unit/tpo-drive-workspace-chat5-round6.test.ts
  - chat-5 Drive Workspace next 25+ OPEN gap evidence > TPO-drive-workspace-57 partial or implemented scope is recorded without inferring unsupp
- tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts
  - TPO drive workspace S3 and S4 verified contracts > TPO-drive-workspace-57: validates the scoped drive-workspace behavior

## chat-6
- tests/unit/chat6-faculty-zero-point-assignment-r08.test.ts
  - Faculty zero-point participation assignments > FAC-assessments-R08 permits zero-point participation assignments without allowing negative or
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts
  - chat-7 final sprint Super Admin courses and content > SA-academics-people-50 validates short title, optional official code and colour indepe
  - chat-7 final sprint Super Admin courses and content > SA-academics-people-56 can edit archive reorder and open offering creation from the le
  - chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder
- tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts
  - Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names
- tests/unit/learner-placements-chat7-queue-review.test.ts
  - chat-7 learner placements queued closure audit > LEARNER-placements-41 shows scheduled online assessments without inventing result confirmat
- tests/unit/learner-placements-chat7-round5-contracts.test.ts
  - Learner Placements chat-7 round-5 grouped source contracts > LEARNER-placements-37 retains the reviewed learner journey behavior
- tests/unit/learner-placements-chat7-schedule-surface.test.ts
  - Chat-7 schedule parity > LEARNER-placements-41 exposes online assessments without pretending schedule is attendance

## chat-9
- tests/unit/chat9-calendar-event-legend.test.ts
  - TPO Calendar kind legend > TPO-calendar-reports-11 renders counted color chips and supports multi-kind selection
- tests/unit/chat9-college-projects-contracts-round8.test.ts
  - chat9 college projects scope and persistence contracts > COL-projects-06 previews per-learner cohort creation and confirms exact count befor
- tests/unit/chat9-college-projects-s2-closure.test.ts
  - College Admin Projects S2 legacy gap closure > COL-projects-03 confirms admin Overview and Resources editors but leaves Sprint/Task plan par
- tests/unit/chat9-phase2-college-company-query.test.ts
  - college company search and pagination > counts and pages in SQL after the persisted college role check
  - college company search and pagination > validates a strict bounded URL and protects literal wildcard searches
- tests/unit/chat9-phase2-college-group-tabs.test.ts
  - college group tabs exact legacy navigation labels > renders academic section labels in exact dev-legacy order
- tests/unit/chat9-round6-college-projects-parity.test.ts
  - College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy ris
- tests/unit/chat9-round9-recruiter-settings.test.ts
  - chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-70 validates and saves optional-SMS monthly limit without claimi
- tests/unit/chat9-safe-policy-decisions-round7.test.ts
  - chat9 safer gap decisions > TPO-settings-audit-05 keeps settings writes restricted to persisted active TPO memberships and centralized place
- tests/unit/chat9-super-admin-exact-page-copy.test.ts
  - Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > Recruiter accounts editor heading exactly matches its Placements tab
- tests/unit/chat9-super-admin-navigation-reachability.test.ts
  - Super Admin 13-row sidebar grouped page reachability > every grouped tab is a real vNext Super Admin page with unique active state
- tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts
  - Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-16 links a missing active season to the mana
  - Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Acti
- tests/unit/chat9-tpo-job-type-policy-round8.test.ts
  - chat9 TPO job-type and drive-approval verification > TPO-settings-audit-50 retains human approval for recruiter drive requests regardless of
- tests/unit/chat9-tpo-settings-legacy-graceful.test.ts
  - TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names

## chat-11
- tests/unit/chat11-mentor-delivery-decision-round3.test.ts
  - mentor review parity > MEN-projects-meetings-65 preserves feedback and shows safe stale-review guidance
- tests/unit/tpo-drive-cancel-model.test.ts
  - TPO drive cancellation > TPO-drives-16 allows only published active-season drives against an unchanged impact

## chat-12
- tests/unit/chat12-0134-schema-parity-r60.test.ts
  - chat-12 migration 0134 effective schema fidelity > TPO-requests-verification-01 uses five registered kinds and guards the sixth separately
- tests/unit/chat12-general-request-scope-r61.test.ts
  - chat-12 request admission and duplicate replay invariants > TPO-requests-verification-01 records the source of the sixth-kind migration inco

## chat-13
- tests/unit/chat13-final-sprint-learner-35.test.ts
  - LEARNER-placements-35 booked-round attendance confirmation > LEARNER-placements-35 preserves TPO booking time separately from learner consen
- tests/unit/chat13-placement-create-safety.test.ts
  - Super Admin create and edit drive safety > SA-placements-projects-16 renders a concrete season recovery link and keeps creation disabled wit
- tests/unit/chat13-tenant-settings-runtime-gap37.test.ts
  - SA-tenants-modules-37 saved course settings are honored > SA-tenants-modules-37 uses editor-compatible validated save intervals

## chat-14
- tests/unit/chat14-final-tpo-drives-31.test.ts
  - chat-14 final sprint > TPO-drives-31 keeps college-scoped parent and learner foreign keys
- tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts
  - REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 proposed SQL mirrors the Drizzle repl
  - REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 safeguards inbound email persistence 
- tests/unit/recruiter-chat14-round1.test.ts
  - chat-14 recruiter reassigned exact-parity round 1 > REC-calendar-messages-profile-27 saves name designation and mobile atomically and warns 
  - chat-14 recruiter reassigned exact-parity round 1 > REC-home-drives-31 keeps exact legacy round preset labels
- tests/unit/learner-projects-round2-gap-closure.test.ts
  - learner/projects round-two gap verification > LEARNER-projects-34 distinguishes no resource, malformed address and popup failures
- tests/unit/mentor-project-list-query.test.ts
  - Mentor Project list URL > rejects forged scope and unknown selector
- tests/unit/projects-phase2-readiness-ui.test.ts
  - PR-S2-05 legacy College Admin override interface > replaces the disabled placeholder and wires manager action
- tests/unit/w03-archived-project-readonly.test.ts
  - W03 archived project read-only UI contract > hides delivery, resource and meeting mutation controls while retaining history sections
- tests/unit/w03-mentor-attention.test.ts
  - W03 mentor notification attention parity > avoids stalled alerts for missing genuine activity or nonactive projects
- tests/unit/w03-mentor-project-tabs.test.ts
  - W03 mentor project detail legacy tab contract > maps legacy route keys onto normalized vNext workspace sections
  - W03 mentor project detail legacy tab contract > serves real persisted task assignees without the pre-migration placeholder
- tests/unit/w03-project-admin-audit.test.ts
  - W03 project admin audit parity contract > requires an explicit college scope for the super-admin audit surface

## chat-15
- tests/unit/chat15-assessment-submission-deadline.test.ts
  - learner vendor assessment deadline source of truth > LEARNER-placements-37 and LEARNER-placements-41 expose safe test links with no inferred
  - learner vendor assessment deadline source of truth > LEARNER-placements-41 never presents a results deadline as a submission cutoff
- tests/unit/chat15-final-sprint-col-attendance-r02.test.ts
  - COL-attendance-R02 verified parent absence/correction SMS > COL-attendance-R02 exposes only College Admin same-origin verified-contact regis
- tests/unit/learner-course-page-parity.test.ts
  - learner Course page parity contract > keeps legacy Learning Path filters, lesson expansion and deep-link focus
- tests/unit/learner-learning-misc-gap-closure.test.ts
  - Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-20 leaving an attempt asks for confirmation
  - Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-33 route-level network failures and week emptiness have safe, distinct leg
- tests/unit/learner-placements-37-schedule.test.ts
  - LEARNER-placements-37 schedule details > LEARNER-placements-37 exposes persisted join and test URLs only after HTTPS checks
- tests/unit/learner-placements-round2-source-contracts.test.ts
  - Chat-7 learner placement verified-closure source contracts > LEARNER-placements-37 source behavior or reviewed disposition

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/rec-notification-bell.test.ts
  - REC-calendar-messages-profile-21 recruiter notification bell > polls every 30 s, and scopes mark-read to caller and employer grants

