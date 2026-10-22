# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-009-028 [P1] GAP facet F05
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy Mark all present and Mark all absent buttons disabled only with empty list (`TakeAttendance.js:325-341`).
- Expected fix: Maintain approved time-window policy; explain extra disabled state and status in UI.

## G2-18-009-029 [P1] MISSING facet F06
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy class Select appears only staff with >1 assignment, 160px width, placeholder `Select Class` (`AttendanceReport.js:58-73`).
- Expected fix: Restore assigned-class selector with URL sync and draft-discard confirmation.

## G2-18-009-035 [P1] GAP facet F07
- Files: src/app/(authenticated)/learn/attendance/page.tsx, src/components/attendance/learner-attendance-workspace.tsx
- Legacy: Legacy learner error `Failed to load attendance.` Alert plus Retry (`StudentAttendanceView.jsx:37-69`).
- Expected fix: Add attendance-scoped error state with exact legacy copy and Retry instead of route failure.

## G2-18-009-038 [P1] GAP facet F07
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy mark roster load `Could not load the attendance roster`, error details and Retry (`TakeAttendance.js:113-167,263-275`).
- Expected fix: Handle roster load errors separately, preserve report grid and Retry.

## G2-18-009-056 [P1] GAP facet F10
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy bulk save POST `/api/v1/attendance/bulk` (`attendanceServices.js:13-24`).
- Expected fix: Document payload map, transaction, correction semantics, and handle conflict/retry.

## G2-18-009-059 [P1] GAP facet F11
- Files: src/modules/attendance/faculty-service.ts, src/modules/attendance/learner-service.ts
- Legacy: Legacy viewer faculty/admin/SA canMark; learner read-only (`AttendanceReport.js:15-18,94-98`).
- Expected fix: Verify college-admin/SA acting-in-college path has same attendance view; preserve no cross-tenant writes.

## G2-18-009-060 [P1] GAP facet F11
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Legacy admin oversight GET can view any faculty's class in scoped college (`AdminAttendanceController.java:33-41,94-110`).
- Expected fix: Use distinct admin oversight service permissions rather than faculty membership impersonation.

## G2-18-009-066 [P1] GAP facet F12
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/db/schema/attendance.ts
- Legacy: Legacy faculty Mark always shows Ready to mark, regardless session start (`TakeAttendance.js:293-307`).
- Expected fix: Document intentional policy change; show reason disabled instead of silently denying.

## G2-18-009-084 [P1] GAP facet F17
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy dirty prompt on routeChangeStart and beforeUnload preserves pending marks (`TakeAttendance.js:49-71`).
- Expected fix: Confirm route switches while dirty, trap accidental navigation, preserve browser back where possible.

## G2-18-009-088 [P1] GAP facet F19
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy teacher one date-scoped GET per month, requestSeq disallows stale results (`TeacherAttendanceView.jsx:42-99`).
- Expected fix: Introduce server-range month read/paging for large years/course histories and loading statuses.

## G2-18-002-016 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: Legacy row Visible/Hidden tag green/neutral based on active AND enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- Expected fix: Show explicit `Students see it: Visible/Hidden` based on effective visibility (lesson flag+published path/content), not merely ACTIVE status.

## G2-19-009-015 [P1] GAP facet F06
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Old accepts disabled prop default false `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:5-6` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:19-33`
- Expected fix: Owner-confirm marking time rule; align disabled messaging.

## G2-19-009-028 [P1] GAP facet F10
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Old final POST `/api/v1/attendance/bulk` numeric classScheduleId and learnerIDs `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:16-20` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- Expected fix: Document full field/type map and preserve all-roster update.

## G2-19-009-031 [P1] GAP facet F11
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/modules/attendance/faculty-service.ts
- Legacy: Old row can mark before session start, per Ready to mark comment `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:293-297`
- Expected fix: Owner decide whether intentional; show disabled reason.

## G2-19-009-034 [P1] GAP facet F12
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Old bulk mark all actions enabled with nonempty roster `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:325-341`
- Expected fix: Use consistent disabled-policy explanation.

## G2-19-009-055 [P1] GAP facet F22
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/modules/attendance/faculty-service.ts
- Legacy: Old learner_id with boolean isAbsent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:138-149` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:8-9`
- Expected fix: Map legacy learner/session IDs and recorded absence status in migrations.

## G2-19-009-056 [P1] GAP facet F22
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Old numeric classScheduleId and static reason `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- Expected fix: Map legacy class schedules to event/membership/version fields.

## G2-19-006-004 [P1] GAP facet F02
- Files: src/components/attendance/learner-attendance-workspace.tsx
- Legacy: Legacy PageShell/scroll-container + filter bar then one list card `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:339-374` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:387-425`
- Expected fix: Return direct Attendance list density and move enhanced analytics under optional disclosures.

## G2-19-006-040 [P1] GAP facet F10
- Files: src/modules/attendance/learner-service.ts
- Legacy: Legacy attendance result shape `{classes, absentids}` `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102`
- Expected fix: Build parity adapter for all old absence semantics and mark provenance.

## G2-19-006-045 [P1] GAP facet F12
- Files: src/components/attendance/learner-attendance-workspace.tsx
- Legacy: Legacy only Present/Absent explicit; absence array dominates and attendanceMarked false indicates missing `docs/legacy-source/frontend/src/utils/attendanceConstants.js:29-34`
- Expected fix: Reconcile status transition/provenance when moving from legacy absence list.

## G2-19-006-052 [P1] GAP facet F13
- Files: src/components/attendance/learner-attendance-workspace.tsx
- Legacy: Legacy courses failure vs zero enrollment distinct with Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:375-385` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:427-434`
- Expected fix: Differentiate data fetch failure from genuine zero enrolled courses.

## G2-19-006-067 [P1] GAP facet F18
- Files: src/components/attendance/learner-attendance-workspace.tsx
- Legacy: Legacy empty error `Couldn't load your courses` and Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:427-432`
- Expected fix: Do not conflate 403/transport failure with no courses.

## G2-19-006-074 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/attendance/page.tsx, src/modules/attendance/learner-service.ts
- Legacy: Legacy attendance page API imports attendanceServices, Redux attendanceAction and route Utils `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:19-26`
- Expected fix: Document API/object mapping and current vs historical enrollment semantics.

## G2-19-006-076 [P1] GAP facet F22
- Files: src/modules/attendance/learner-service.ts
- Legacy: Legacy records API `{classes, absentids}` keyed classScheduleId `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:180-186`
- Expected fix: Create old classScheduleId→scheduleEvent/delivery/membership migration map with correct absence row.

## G2-19-005-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx
- Legacy: Calendar path is redirect-only to `/learn/my-placements/schedule?view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-7`
- Expected fix: Redirect old calendar entry to Schedule month view or provide explicit owner-approved separate new route.
