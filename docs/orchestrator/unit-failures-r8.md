# Unit test failures, round 8 (cloud CI 0841a1bd)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-3
- tests/unit/chat3-tpo-supplemental-round14.test.ts
  - TPO supplemental job metadata > TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB
- tests/unit/tpo-drives-chat-3-round4.test.ts
  - chat-3 Drives round 4 > TPO-drives-45 automatically applies 11:59 PM IST once, then preserves user edits and restored drafts
  - chat-3 Drives round 4 > TPO-drives-51 college administrator has a real separate create flow
- tests/unit/api-origin-guard.test.ts
  - state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin
- tests/unit/college-people-gap-closure.test.ts
  - College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

## chat-4
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

## chat-6
- tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts
  - Final sprint recruiter applicant review accessibility > REC-home-drives-R05 focused applicant review traps Tab and restores keyboard focus
- tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts
  - Chat-6 recruiter login and mobile layout safety > SA-academics-people-75 keeps create controls and scrolling course tables within mobile wid
- tests/unit/graceful-raw-error-scan.test.ts
  - new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages
  - new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

## chat-7
- tests/unit/chat7-final-sprint-superadmin-courses-content.test.ts
  - chat-7 final sprint Super Admin courses and content > SA-academics-people-56 can edit archive reorder and open offering creation from the le
  - chat-7 final sprint Super Admin courses and content > SA-academics-people-64 connects assignments to publish archive and existing builder
- tests/unit/chat7-legacy-faculty-quiz-report-copy.test.ts
  - Faculty QuizReportContent.jsx dev legacy headings and empty states > preserves dynamic report title and exact legacy section names

## chat-9
- tests/unit/chat9-college-projects-round4-evidence.test.ts
  - College Projects gap closure round 4 > COL-projects-19 restores workspace, submissions and template page labels
- tests/unit/chat9-phase2-college-group-tabs.test.ts
  - college group tabs exact legacy navigation labels > COL-academic-setup-13 keeps the academic-period overview reachable without inventing a l
  - college group tabs exact legacy navigation labels > renders academic section labels in exact dev-legacy order
- tests/unit/chat9-round6-college-projects-parity.test.ts
  - College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy ris
- tests/unit/chat9-super-admin-exact-page-copy.test.ts
  - Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > Recruiter accounts editor heading exactly matches its Placements tab
- tests/unit/chat9-super-admin-navigation-reachability.test.ts
  - Super Admin 13-row sidebar grouped page reachability > every grouped tab is a real vNext Super Admin page with unique active state
- tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts
  - Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Acti

## chat-11
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

## chat-12
- tests/unit/chat12-company-depth-round6.test.ts
  - Chat12 company depth and URL filters > TPO-students-51 retains mobile card actions
- tests/unit/chat12-grid-columns-round3.test.ts
  - chat-12 Students responsive grid and column preference > TPO-students-51 mobile rows collapse the action picker instead of stacking buttons 
- tests/unit/chat12-round7-students-open-facets.test.ts
  - chat-12 reopened Students URL facets and UI contracts > TPO-students-51 collapses mobile row actions without hiding filters

## chat-14
- tests/unit/recruiter-chat14-round1.test.ts
  - chat-14 recruiter reassigned exact-parity round 1 > REC-home-drives-31 keeps exact legacy round preset labels

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi

