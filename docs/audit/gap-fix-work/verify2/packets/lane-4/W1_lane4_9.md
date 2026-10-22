# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-002-028 [P1] GAP facet F07 Validation/errors
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Errors show closable warning, stale results retained with Data below may be outdated. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-180; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- Expected fix: Catch load failure, show inline Retry and stale data warning.

## G2-5-002-064 [P1] GAP facet F20 Edge/concurrency
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Global ?jobId displays removable Job chip and clear resets job. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:190-199; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:356-393)
- Expected fix: Restore deep link and visible removable chip.

## G2-5-002-067 [P1] GAP facet F22 Models/migrations
- Files: (none, new feature)
- Legacy: Interview row has job application, learner, name, type, status, version, duration, notes, interviewer. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-93; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:161-171)
- Expected fix: Create field-by-field migration and parity mapping without losing historic appointments.

## G2-5-006-066 [P1] GAP facet F21 Integrations
- Files: (none, new feature)
- Legacy: Tenant settings app_setting hierarchy via TenantAdminService (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:7-12; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:92-116)
- Expected fix: Reconcile source of truth and cross-admin inheritance precedence.

## G2-5-007-005 [P1] GAP facet F02 Layout/section order
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Legacy one Interviews header, summary, filter toolbar and appointment table (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-1049)
- Expected fix: Use global Interviews list as default, grid as optional new mode.

## G2-5-007-036 [P1] GAP facet F10 Actions/side effects
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: View applicant passes application ID context to wrapper callback (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632)
- Expected fix: Route to exact jobApplication candidate, not round.

## G2-5-008-077 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Hard delete row after guards (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- Expected fix: Explicit data retention decision and archival migration.

## G2-5-010-031 [P1] GAP facet F06 Forms
- Files: (none, new feature)
- Legacy: Recurring weekdays can be unselected -> daily, time step 5m, end>start (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:533-579)
- Expected fix: Implement empty weekdays as daily and five-minute increments.

## G2-5-012-007 [P1] GAP facet F02
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Needs doing chip opens a conditional focus card listing its events and Close action (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:270-285`)
- Expected fix: Build focused list with toggle-on/off and contextual Open/Move/Done actions

## G2-5-012-071 [P1] GAP facet F13
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Legacy failed soon/past summaries retain previous values and mark them unknown (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:84-103`)
- Expected fix: Keep last-known summary rows and stale marker across refresh

## G2-5-030-058 [P1] GAP facet F20
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy dirty close guarded but scope change useEffect directly resets; unresolved path. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-81`
- Expected fix: Handle scope-switch while pending explicitly.

## G2-6-020-038 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy GET /fetchAll global SA can read all departments (DepartmentController.java:95-124).
- Expected fix: Provide authorized global admin collection view or explicit scope-selection workflow.

## G2-6-019-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy workShiftPreference free text such as Day Shift/Night Shift/Flexible/Remote (JobPreferences.java:28-29).
- Expected fix: Map legacy Night Shift/Day Shift/Remote without silent loss; preserve unrecognized text.

## G2-11-017-045 [P1] MISSING facet F23
- Files: (none, new feature)
- Legacy: Legacy Announcements, Messages, Placement team and Settings present (more.js:26-28,41).
- Expected fix: Add four independent legacy links with exact routes and descriptions.

## G2-11-026-007 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: GET list accepts status/environment/reporter/search/page=0/size=20/sort=DESC (PublicBugTrackerController.java:37-46).
- Expected fix: Support old filters or client adapter for reporter, search, zero-index page and size.

## G2-12-011-006 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Read markers isNew per event after readThrough, separate hiddenUnread count (RecruiterNotificationService.java:139-153).
- Expected fix: Show older hidden unread count and defer auto-read for hidden entries.

## G2-15-024-011 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: seed() transactional, idempotent-ish lookups by stable unique keys (E2eSeedService.java:82-89,164-189,311-337).
- Expected fix: Implement transactionally idempotent fixtures keyed by stable identifiers and tenant.

## G2-17-030-077 [P1] GAP facet F20
- Files: src/modules/placements/admin-drive-directory-model.ts
- Legacy: Legacy extend uses local format YYYY-MM-DDTHH:mm:ss without timezone. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74`
- Expected fix: Specify timezone-aware deadline input and normalize IST local-to-UTC during mutation.

## G2-6-016-034 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: v2 selects records free-text skill usage (SkillsSearchController.java:92-101).
- Expected fix: Implement dedicated free-text usage writer preserving independent counters.

## G2-6-006-001 [OK — legacy teacher/fileExplorer redirects to /teacher/courses] MISSING facet F01
- Files: (none, new feature)
- Legacy: Old `/teacher/fileExplorer` redirects to `/teacher/courses` server-side `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-7`
- Expected fix: Add Next redirect alias `/teacher/fileExplorer` → `/teacher/courses` (temporary/307)

## G2-12-027-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:98-113,134-157: create POST `/create` and update PUT `/update/{id}`.
- Expected fix: Map full update semantics to scoped edit surface or explicitly document retained-field restrictions.

## G2-13-023-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:317-337 POST reschedule inserts reschedule_request with reason and preferred_times; no immediate booking change.
- Expected fix: Map legacy reschedule_request fields/status to new request schema, retain pending-approval side effect.

## G2-14-030-038 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:85-88,173-186 recognizes RESCHEDULE_REQUESTED and unchanged schedule logic.
- Expected fix: Map requested reschedule through learner request records and expose pending state without dropping reason/windows.

## G2-17-031-011 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 returns delivery, submission and review history.
- Expected fix: Map every submission state, version, feedback, approver and evidence field.

## G2-19-027-066 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/model/Course.java:42-45 stores active, enabled, allowedForDisplay separately.
- Expected fix: Differentiate hidden visibility from archived course lifecycle; avoid conflating user hide with archive.
