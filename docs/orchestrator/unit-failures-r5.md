# Unit test failures, round 5 (cloud CI 49eddef7)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-3
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
  - College People legacy audited page contracts > COL-people-24 mentor reassignment preserves selection and uses explicit confirmed legacy copy

## chat-6
- tests/unit/chat6-faculty-quiz-report-header-r06.test.ts
  - Faculty quiz report legacy header > FAC-assessments-R06 shows the legacy Back link and Submitted, Average score, Questions and Due date metr
- tests/unit/chat6-recruiter-lifecycle-round3.test.ts
  - Super Admin recruiter legacy lifecycle > SA-academics-people-114 restores recruiter accounts page search and college access copy
- tests/unit/chat6-superadmin-course-entrypoints.test.ts
  - Super Admin course in-tab entry points > SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-9
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels
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

## chat-11
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

## chat-14
- tests/unit/recruiter-chat14-round1.test.ts
  - chat-14 recruiter reassigned exact-parity round 1 > REC-home-drives-31 keeps exact legacy round preset labels
- tests/unit/w03-mentor-attention.test.ts
  - W03 mentor notification attention parity > avoids stalled alerts for missing genuine activity or nonactive projects

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

