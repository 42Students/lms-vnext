# Unit test failures, round 4 (cloud CI 11876899)

Fix YOUR section: read the test, read the source it checks. Usually a merge dropped or reverted source, or the test expectation drifted. Restore the source behaviour (never delete features; only change the test if it is plainly wrong). Run nothing locally; reason carefully. Push to your -b branch, say done. Files with a chatN- prefix belong to lane N; `other` goes to chat-2.

## chat-2
- tests/unit/chat2-LEARNER-course-detail-R03-live-session-policy.test.ts
  - LEARNER-course-detail-R03 ? scheduled live class Join/Copy > LEARNER-course-detail-R03 applies release policy inside the learner authorizati
- tests/unit/chat2-tpo-public-link-settings.test.ts
  - TPO-settings-audit-55 recruiter link > TPO-settings-audit-55 is reachable through settings navigation
- tests/unit/mentor-meetings-round4.test.ts
  - mentor meetings and attention > MEN-projects-meetings-73 flags idle planned projects, not blocked or completed

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

## chat-4
- tests/unit/chat4-college-academic-people-gap-closure.test.ts
  - chat-4 College academic and people gap closure > COL-academic-setup-R03 links the required academic-period setup from guides and empty state
- tests/unit/chat4-gap-ux-freeze-product-decisions.test.ts
  - chat-4 owner-delegated gap decisions: safe college policy > COL-course-tabs-25 limits playback thresholds to validated persisted central ove
- tests/unit/chat4-super-admin-projects-gap-closure.test.ts
  - chat-4 Super Admin Projects verified gap coverage > SA-placements-projects-63 retains the verified Projects behavior

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

## chat-7
- tests/unit/chat7-college-project-legacy-one-tab.test.ts
  - College Admin Projects legacy Workspaces and one tab strip > shows legacy Projects group and single Workspaces page heading

## chat-9
- tests/unit/chat9-calendar-partial-recovery.test.ts
  - TPO calendar partial-data recovery > TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail
- tests/unit/chat9-phase2-college-company-query.test.ts
  - college company search and pagination > validates a strict bounded URL and protects literal wildcard searches
- tests/unit/chat9-round6-calendar-settings.test.ts
  - chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation

## chat-11
- tests/unit/t-s2-08-publication-navigation.test.ts
  - T-S2-08 public publishing remains a scoped TPO setting > keeps the new setting reachable
- tests/unit/tpo-settings-primary-nav.test.ts
  - TPO-settings-audit-01 legacy primary Settings sections > keeps the ten legacy sections in original group order alongside linked destinations

## chat-12
- tests/unit/chat12-round19-roster-responsive-counts.test.ts
  - TPO Students phone presentation and scoped selection summary > TPO-students-51 shows two-column phone journey, focused row summary and colla

## chat-14
- tests/unit/w03-archived-project-readonly.test.ts
  - W03 archived project read-only UI contract > hides delivery, resource and meeting mutation controls while retaining history sections

## chat-16
- tests/unit/chat16-gap-register-reconciliation-r7.test.ts
  - chat-16 centralized gap tracking reconciliation > chat-16 register includes exactly the 32 reassigned mentor and tracker gaps
- tests/unit/chat16-mentor-attention-stalled-r6.test.ts
  - chat-16 mentor stalled attention semantics > MEN-projects-meetings-73 includes idle planned projects at seven days but excludes blocked, com
- tests/unit/chat16-mentor-tracker-contract-round2.test.ts
  - chat-16 reassigned mentor acceptance, round 2 > MEN-projects-meetings-73 includes idle planned projects but excludes blocked ones
- tests/unit/chat16-queue-source-verification-r6.test.ts
  - chat-16 reassigned mentor and tracker queue source contracts > MEN-projects-meetings-73 retains its audited source boundary
- tests/unit/chat16-round3-two-unit-regressions.test.ts
  - chat-16 Round 3 canonical gap queue reconciliation > the 32 originally reassigned IDs remain one-to-one with the central register after revi
- tests/unit/hr-drive-round-presets.test.ts
  - HR Request Drive local round presets > replaces only draft rounds with supported legacy kinds

