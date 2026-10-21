# Work packet: edit src/components/attendance/faculty-attendance-workspace.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md

## G2-13-009-051  [P1] GAP  facet F12  effort L
- Legacy: Legacy marked correction can take absence/presence status after initial mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:11-15`)
- vNext now: New marks corrections with required explanation/window and optimistic status (`src/components/attendance/faculty-attendance-workspace.tsx:353-430`)
- Fix: Verify legacy correction window/permissions, mark explanatory change deliberate.

## G2-13-009-077  [P1] GAP  facet F22  effort L
- Legacy: Old monthly teacher cohort uses teacher class/course filter, student ids (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-66`)
- vNext now: New uses section enrollment membershipId + deliveryId (`src/components/attendance/faculty-attendance-workspace.tsx:38-91`)
- Fix: Map classId/studentId/courseId to member and delivery IDs; audit historical enrollment.

## G2-14-009-015  [P1] GAP  facet F04  effort M
- Legacy: Sessions and Active days count held sessions only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-165`
- vNext now: Month sessionCount and Active days include future scheduled sessions `src/modules/attendance/faculty-learner-attendance-detail.ts:101-111` `src/components/attendance/faculty-attendance-workspace.tsx:635-642`
- Fix: Exclude future sessions from those legacy counts

## G2-14-009-019  [P1] GAP  facet F05  effort M
- Legacy: Calendar contains every date in selected month even no-class days `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:257-315` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:327-335`
- vNext now: Only days with sessions form column headers `src/components/attendance/faculty-attendance-workspace.tsx:290-303` `src/components/attendance/faculty-attendance-workspace.tsx:692-716`
- Fix: Generate all 28–31 date columns and show no-class glyph

## G2-14-009-030  [P1] GAP  facet F07  effort M
- Legacy: Fetch failure says Couldn't load attendance data for this month. and offers Retry `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:122-128`
- vNext now: Server loader has no month-local retry state `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-40` `src/components/attendance/faculty-attendance-workspace.tsx:494-522`
- Fix: Catch server fetch failure and show exact Retry state

## G2-14-009-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy mark POST bulk uses classScheduleId and learner IDs `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:13-24` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:488-501`
- vNext now: PATCH faculty sessions uses deliveryId plus UUID membership arrays `src/components/attendance/faculty-attendance-workspace.tsx:401-419` `src/modules/attendance/faculty-service.ts:451-485`
- Fix: Map legacy and new ID semantics and reconcile API clients

## G2-14-009-055  [P1] GAP  facet F13  effort M
- Legacy: Fetch failed distinct from valid empty state `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:37-40` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:122-141`
- vNext now: No explicit local retry error state in workspace `src/components/attendance/faculty-attendance-workspace.tsx:494-522`
- Fix: Add retryable error boundary

## G2-14-009-057  [P1] GAP  facet F14  effort L
- Legacy: PDF has portrait per-student summary and landscape day-by-day matrix `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:25-31` `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:75-138`
- vNext now: Generic PDF takes summary text and learner text rows only `src/components/attendance/faculty-attendance-workspace.tsx:596-632` `src/components/courses/faculty-report-download.tsx:14-45`
- Fix: Restore two-part PDF with color-coded daily matrix

## G2-14-009-071  [P1] GAP  facet F19  effort L
- Legacy: Legacy fetch is month-scoped and refetches when month changes `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:42-99`
- vNext now: New fetches entire delivery history once and filters client-side `src/modules/attendance/faculty-service.ts:253-368` `src/components/attendance/faculty-attendance-workspace.tsx:290-303`
- Fix: Add date-scoped DB read for long histories

## G2-15-009-021  [P1] GAP  facet F05  effort M
- Legacy: Mark-all controls disabled only if roster empty (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:326-339`)
- vNext now: Also disabled outside marking window and while saving (`src/components/attendance/faculty-attendance-workspace.tsx:882-913`)
- Fix: Reconcile marking window product policy and identical disabled state

## G2-15-009-036  [P1] GAP  facet F07  effort M
- Legacy: Partial/full failures include counts, max five failed names and retry-only failed IDs (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:523-543`)
- vNext now: Generic atomic reject and reload action (`src/components/attendance/faculty-attendance-workspace.tsx:1052-1065`)
- Fix: Explain atomic-vs-partial difference; design deterministic retry and error text

## G2-15-009-039  [P1] GAP  facet F08  effort M
- Legacy: Saving-close info toast and dirty-drawer discard confirm (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:33-49`)
- vNext now: Nondismissible busy drawer; dirty close not confirmed (`src/components/attendance/faculty-attendance-workspace.tsx:1180-1193`)
- Fix: Add Wait for the class schedule to finish saving. and dirty discard confirm

## G2-15-009-042  [P1] MISSING  facet F09  effort M
- Legacy: Discard class schedule changes? dialog; Discard changes/Keep editing (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:42-49`)
- vNext now: No confirm before closing changed schedule (`src/components/attendance/faculty-attendance-workspace.tsx:1180-1193`)
- Fix: Implement dirty scheduling confirmation matching copy/actions

## G2-15-009-045  [P1] GAP  facet F10  effort L
- Legacy: POST /api/v1/attendance/bulk classScheduleId, absentStudentIds,presentStudentIds,reason (`docs/legacy-source/frontend/src/api/Services/attendanceServices.js:16-24`)
- vNext now: PATCH /api/attendance/faculty/sessions/{id}, deliveryId/UUID lists + correction token (`src/components/attendance/faculty-attendance-workspace.tsx:401-430`)
- Fix: Write explicit ID and payload mapping plus retry/concurrency contract

## G2-15-009-047  [P1] GAP  facet F10  effort M
- Legacy: POST /api/v1/faculty/schedules faculty_id,class_id,start_time,end_time,courseSlug/Id (`docs/legacy-source/frontend/src/api/Services/attendanceServices.js:69-74`)
- vNext now: POST /api/attendance/faculty deliveryId,title,ISO start/end,location (`src/components/attendance/faculty-attendance-workspace.tsx:442-479`)
- Fix: Map route/payload and datetime offsets safely

## G2-15-009-061  [P1] GAP  facet F13  effort M
- Legacy: Schedule unavailable error warning + Retry, separate from no classes (`docs/legacy-source/frontend/src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js:102-138`)
- vNext now: New native select/no classes option without separate loading failure (`src/components/attendance/faculty-attendance-workspace.tsx:826-842`)
- Fix: Distinguish schedule failure from confirmed empty and add retry

## G2-15-009-080  [P1] GAP  facet F20  effort M
- Legacy: Failed rows retried only, accepted reloaded; total failure retains draft (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548`)
- vNext now: Atomic errors advise reload, no partial row retry (`src/components/attendance/faculty-attendance-workspace.tsx:421-439`)
- Fix: Provide reliable all-or-none retry semantics with network uncertainty handling

## G2-15-009-092  [P1] GAP  facet F23  effort L
- Legacy: Old unconditionally Ready to mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:294-305`)
- vNext now: New restricted window notice (`src/components/attendance/faculty-attendance-workspace.tsx:855-866`)
- Fix: Obtain owner policy decision on timed access and document intentional difference

## G2-18-009-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy teacher multi-class selector updates Redux classId/name then shallow-updates course URL `?cls=` (`AttendanceReport.js:30-42`).
- vNext now: New faculty workspace is bound to one delivery from server and has no class-switch control locally (`faculty-attendance-workspace.tsx:141-163,494-518`).
- Fix: Offer assigned-section switch/URL deep link with unsaved-draft guard.

## G2-18-009-014  [P1] GAP  facet F03  effort M
- Legacy: Legacy Mark panel status pill `Ready to mark` and Schedule Class action (`TakeAttendance.js:279-307`).
- vNext now: New marking panel instead signals `Cannot mark attendance ...` or `Attendance already submitted...`, Schedule Class globally in header (`faculty-attendance-workspace.tsx:498-505,844-867`).
- Fix: Restore status-pill placement; preserve mandatory current marking lock with clear explanation.
