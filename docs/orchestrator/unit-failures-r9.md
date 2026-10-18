# Unit test failures, round 9 (cloud CI 856af7b7)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-tpo-public-link-settings.test.ts
  - TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation

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
- tests/unit/chat4-college-ux-round1.test.ts
  - Chat-4 College UX round one > UX-college-01 preserves narrow-screen content and 44px navigation targets
  - Chat-4 College UX round one > UX-college-academics-01 preserves narrow-screen content and 44px navigation targets
  - Chat-4 College UX round one > UX-college-activity-01 preserves narrow-screen content and 44px navigation targets
  - Chat-4 College UX round one > UX-college-activity-eventId-01 preserves narrow-screen content and 44px navigation targets
  - Chat-4 College UX round one > UX-college-announcements-01 preserves narrow-screen content and 44px navigation targets
- tests/unit/chat4-college-ux-round2.test.ts
  - Chat-4 college UX round 2 source contracts > UX-college-assignments-01 prevents width overflow and preserves accessible controls
  - Chat-4 college UX round 2 source contracts > UX-college-attendance-01 prevents width overflow and preserves accessible controls
  - Chat-4 college UX round 2 source contracts > UX-college-attendance-corrections-01 prevents width overflow and preserves accessible controls
  - Chat-4 college UX round 2 source contracts > UX-college-attendance-departments-01 prevents width overflow and preserves accessible controls
  - Chat-4 college UX round 2 source contracts > UX-college-attendance-settings-01 prevents width overflow and preserves accessible controls
  - Chat-4 college UX round 2 source contracts > UX-college-batch-promotion-01 prevents width overflow and preserves accessible controls
- tests/unit/chat4-college-ux-round3.test.ts
  - Chat-4 college UX round 3 > UX-college-batches-01 adds safe narrow-screen affordances
  - Chat-4 college UX round 3 > UX-college-branding-01 adds safe narrow-screen affordances
  - Chat-4 college UX round 3 > UX-college-classes-01 adds safe narrow-screen affordances
  - Chat-4 college UX round 3 > UX-college-classes-recurring-preview-01 adds safe narrow-screen affordances
  - Chat-4 college UX round 3 > UX-college-college-profile-01 adds safe narrow-screen affordances
- tests/unit/chat4-college-ux-round4.test.ts
  - Chat-4 College UX round 4 > UX-college-course-progress-01 protects action size or responsive width
  - Chat-4 College UX round 4 > UX-college-courses-01 protects action size or responsive width
- tests/unit/chat4-college-ux-round5.test.ts
  - Chat-4 college UX round five > UX-college-departments-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-domains-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-electives-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-electives-slotId-allocate-01 makes the layout or actions more readable on narrow screens
  - Chat-4 college UX round five > UX-college-faculty-assignment-01 makes the layout or actions more readable on narrow screens
- tests/unit/chat4-college-ux-round6.test.ts
  - Chat-4 College UX round six > UX-college-faculty-import-01 keeps narrow-screen routes usable
  - Chat-4 College UX round six > UX-college-faculty-membershipId-01 keeps narrow-screen routes usable
  - Chat-4 College UX round six > UX-college-groups-01 keeps narrow-screen routes usable
  - Chat-4 College UX round six > UX-college-groups-groupId-01 keeps narrow-screen routes usable
  - Chat-4 College UX round six > UX-college-groups-groupId-import-preview-01 keeps narrow-screen routes usable
  - Chat-4 College UX round six > UX-college-groups-groupId-rule-preview-01 keeps narrow-screen routes usable
- tests/unit/chat4-college-ux-round7.test.ts
  - Chat-4 college UX round seven > UX-college-lecture-halls-01 supports accessible narrow-screen presentation
  - Chat-4 college UX round seven > UX-college-lecture-halls-hallId-01 supports accessible narrow-screen presentation
  - Chat-4 college UX round seven > UX-college-lessons-01 supports accessible narrow-screen presentation
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-58 shows average-based mentor overload, not a fixed cap

## chat-5
- tests/unit/chat5-ux-tpo-middle-third.test.ts
  - chat-5 UX /tpo middle-third route coverage (43?84) > UX-tpo-recruiters-campaigns-batchid-01 keeps the original route while applying safe res
  - chat-5 UX /tpo middle-third route coverage (43?84) > UX-tpo-recruiters-campaigns-drafts-campaignid-01 keeps the original route while applyin
  - chat-5 UX /tpo middle-third route coverage (43?84) > UX-tpo-recruiters-leadid-01 keeps the original route while applying safe responsive con
- tests/unit/tpo-drive-discussion-chat5.test.ts
  - TPO drive discussion parity > GR-90 and GR-91 keep the Discussion list navigable without a fragile modal

## chat-6
- tests/unit/chat6-college-placements-read-parity.test.ts
  - College Admin placement register and drive parity > COL-placements-08 College drive table has legacy columns mobile cards bulk lifecycle and
- tests/unit/chat6-college-placements-round3-ui.test.ts
  - College Admin drive UI and graceful failure > COL-placements-25 renders selectable action-capable mobile application and drive cards
- tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts
  - Final sprint recruiter applicant review accessibility > REC-home-drives-R05 keeps next and previous applicant shortcuts inside the selected 
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
- tests/unit/chat9-round6-calendar-settings.test.ts
  - chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation
- tests/unit/chat9-round6-college-projects-parity.test.ts
  - College Admin Projects round 6 > COL-projects-19 displays the exact Workspaces, Templates, Submission and Audit headings plus the legacy ris
- tests/unit/chat9-super-admin-exact-page-copy.test.ts
  - Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > Recruiter accounts editor heading exactly matches its Placements tab
- tests/unit/chat9-super-admin-navigation-reachability.test.ts
  - Super Admin 13-row sidebar grouped page reachability > every grouped tab is a real vNext Super Admin page with unique active state
- tests/unit/chat9-super-admin-placement-source-reconciliation.test.ts
  - Super Admin Placements documented parity and owner-accepted navigation > SA-placements-projects-36 uses recruiter accounts and readable Acti
- tests/unit/chat9-tpo-settings-legacy-graceful.test.ts
  - TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names

## chat-11
- tests/unit/company-share-mobile-cards.test.ts
  - renders equivalent three-field mobile cards and desktop tables

## chat-13
- tests/unit/chat13-final-sprint-public-share.test.ts
  - chat-13 final sprint public company share > PUB-auth-public-53 filters every selected column and never exports an unselected phone or URL
- tests/unit/chat13-super-admin-academic-copy.test.ts
  - Super Admin Academic Setup legacy copy and defaults > SA-academics-people-36 formats persisted status enums as legacy-readable names

## chat-14
- tests/unit/recruiter-chat14-round1.test.ts
  - chat-14 recruiter reassigned exact-parity round 1 > REC-home-drives-31 keeps exact legacy round preset labels

## chat-16
- tests/unit/chat16-SA-placements-projects-120-refused-file-report.test.ts
  - SA-placements-projects-120 authenticated import refusal reporting > SA-placements-projects-120 displays refused files and reasons without cl
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi
- tests/unit/UX-recruiter-calendar-01.test.ts
  - UX-recruiter-calendar-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-company-01.test.ts
  - UX-recruiter-company-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-01.test.ts
  - UX-recruiter-drives-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-jobId-01.test.ts
  - UX-recruiter-drives-jobId-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-jobId-interview-slots-01.test.ts
  - UX-recruiter-drives-jobId-interview-slots-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-jobId-messages-01.test.ts
  - UX-recruiter-drives-jobId-messages-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-jobId-rounds-editor-01.test.ts
  - UX-recruiter-drives-jobId-rounds-editor-01 > preserves role-safe navigation, exact route copy and accessible shared surface
- tests/unit/UX-recruiter-drives-jobId-rounds-editor-remove-roundId-01.test.ts
  - UX-recruiter-drives-jobId-rounds-editor-remove-roundId-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-drives-new-01.test.ts
  - UX-recruiter-drives-new-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-drives-proposals-01.test.ts
  - UX-recruiter-drives-proposals-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-drives-recorded-outside-01.test.ts
  - UX-recruiter-drives-recorded-outside-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-home-01.test.ts
  - UX-recruiter-home-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-messages-01.test.ts
  - UX-recruiter-messages-01 > preserves canonical route, scoped data and the audited mobile/action states
- tests/unit/UX-recruiter-profile-01.test.ts
  - UX-recruiter-profile-01 > preserves canonical route, scoped data and the audited mobile/action states

