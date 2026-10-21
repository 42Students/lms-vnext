# Work packet: edit src/components/attendance/faculty-attendance-workspace.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md, docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md

## G2-18-009-019  [P1] GAP  facet F04  effort L
- Legacy: Legacy one grid cell per student per day including no class X (`TeacherAttendanceView.jsx:327-419`).
- vNext now: New one grid column per *day with sessions* and excludes no-class days (`faculty-attendance-workspace.tsx:290-302,692-719`).
- Fix: Restore full calendar day grid including no-class and upcoming cells.

## G2-18-009-028  [P1] GAP  facet F05  effort S
- Legacy: Legacy Mark all present and Mark all absent buttons disabled only with empty list (`TakeAttendance.js:325-341`).
- vNext now: New disables when no roster, submitting or markingWindow closed (`faculty-attendance-workspace.tsx:882-914`).
- Fix: Maintain approved time-window policy; explain extra disabled state and status in UI.

## G2-18-009-029  [P1] MISSING  facet F06  effort M
- Legacy: Legacy class Select appears only staff with >1 assignment, 160px width, placeholder `Select Class` (`AttendanceReport.js:58-73`).
- vNext now: New faculty selector absent within workspace (`faculty-attendance-workspace.tsx:494-518`).
- Fix: Restore assigned-class selector with URL sync and draft-discard confirmation.

## G2-18-009-038  [P1] GAP  facet F07  effort M
- Legacy: Legacy mark roster load `Could not load the attendance roster`, error details and Retry (`TakeAttendance.js:113-167,263-275`).
- vNext now: New roster bundled into initial SSR; inline save error but not isolated load error (`faculty-attendance-workspace.tsx:141-153,1052-1065`).
- Fix: Handle roster load errors separately, preserve report grid and Retry.

## G2-18-009-056  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk save POST `/api/v1/attendance/bulk` (`attendanceServices.js:13-24`).
- vNext now: New PATCH `/api/attendance/faculty/sessions/{uuid}` with explicit absent+present UUID arrays, expectedMarkedAt/correctionReason (`faculty-attendance-workspace.tsx:401-419`).
- Fix: Document payload map, transaction, correction semantics, and handle conflict/retry.

## G2-18-009-066  [P1] GAP  facet F12  effort M
- Legacy: Legacy faculty Mark always shows Ready to mark, regardless session start (`TakeAttendance.js:293-307`).
- vNext now: New disallows NOT_STARTED and after correctionWindowHours, defaults24 (`faculty-attendance-workspace.tsx:271-278,855-861`; `attendance.ts:30-34`).
- Fix: Document intentional policy change; show reason disabled instead of silently denying.

## G2-18-009-084  [P1] GAP  facet F17  effort M
- Legacy: Legacy dirty prompt on routeChangeStart and beforeUnload preserves pending marks (`TakeAttendance.js:49-71`).
- vNext now: New beforeunload guard; ConfirmDialog covers in-component transitions but not all Next router URL transitions (`faculty-attendance-workspace.tsx:261-270`).
- Fix: Confirm route switches while dirty, trap accidental navigation, preserve browser back where possible.

## G2-18-009-088  [P1] GAP  facet F19  effort L
- Legacy: Legacy teacher one date-scoped GET per month, requestSeq disallows stale results (`TeacherAttendanceView.jsx:42-99`).
- vNext now: New faculty entire workspace loaded server-side and months sliced in client (`faculty-attendance-workspace.tsx:290-302`).
- Fix: Introduce server-range month read/paging for large years/course histories and loading statuses.

## G2-19-009-015  [P1] GAP  facet F06  effort M
- Legacy: Old accepts disabled prop default false `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:5-6` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:19-33`
- vNext now: vNext disables buttons if window not OPEN or submitting `src/components/attendance/faculty-attendance-workspace.tsx:963-986`
- Fix: Owner-confirm marking time rule; align disabled messaging.

## G2-19-009-023  [P1] GAP  facet F08  effort L
- Legacy: Old partial failure specifies N recorded / M failed, names and retry failed only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:503-536`
- vNext now: vNext service writes atomically, client error via errorMessage `src/modules/attendance/faculty-service.ts:488-520` `src/components/attendance/faculty-attendance-workspace.tsx:120-139`
- Fix: Explain atomic rejection and list offending learner IDs without replay.

## G2-19-009-031  [P1] GAP  facet F11  effort M
- Legacy: Old row can mark before session start, per Ready to mark comment `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:293-297`
- vNext now: vNext explicitly denies until session started and past correction window `src/components/attendance/faculty-attendance-workspace.tsx:855-861` `src/modules/attendance/faculty-service.ts:533-548`
- Fix: Owner decide whether intentional; show disabled reason.

## G2-19-009-033  [P1] GAP  facet F12  effort M
- Legacy: Old reason sent as static Mark Absent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- vNext now: vNext 8-character required correction reason for already MARKED session `src/components/attendance/faculty-attendance-workspace.tsx:353-361` `src/modules/attendance/faculty-service.ts:550-561`
- Fix: Explain written correction policy; differentiate first mark.

## G2-19-009-034  [P1] GAP  facet F12  effort M
- Legacy: Old bulk mark all actions enabled with nonempty roster `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:325-341`
- vNext now: vNext also checks markingWindow and submitting `src/components/attendance/faculty-attendance-workspace.tsx:881-913`
- Fix: Use consistent disabled-policy explanation.

## G2-19-009-055  [P1] GAP  facet F22  effort L
- Legacy: Old learner_id with boolean isAbsent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:138-149` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:8-9`
- vNext now: vNext membership UUID / attendanceRecords.status enum ABSENT `src/components/attendance/faculty-attendance-workspace.tsx:47-53` `src/modules/attendance/faculty-service.ts:606-618`
- Fix: Map legacy learner/session IDs and recorded absence status in migrations.

## G2-2-027-045  [P1] GAP  facet F10  effort M
- Legacy: TakeAttendance.js:529-535 retries ONLY failed IDs on partial success.
- vNext now: faculty-attendance-workspace.tsx:420-435 expects whole-roster atomic retry, :1059-1064 provides reload.
- Fix: Update retry flow/copy based on authoritative save semantics; never replay unknown writes.

## G2-13-009-037  [P2] GAP  facet F08  effort S
- Legacy: Legacy successful bulk marks toast status from API (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:36-38`)
- vNext now: New submitAttendance shows savedNotice/in-page status (`src/components/attendance/faculty-attendance-workspace.tsx:429-430`)
- Fix: Align exact success message and keep persistent context.

## G2-14-009-035  [P2] GAP  facet F08  effort S
- Legacy: Mark success toast lasts 4 seconds, says Attendance marked successfully. `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:507-515`
- vNext now: Exact text in savedNotice Alert; no evident 4-second timer `src/components/attendance/faculty-attendance-workspace.tsx:429-431` `src/components/attendance/faculty-attendance-workspace.tsx:494-496`
- Fix: Match toast duration and placement

## G2-14-009-036  [P2] GAP  facet F08  effort M
- Legacy: Partial submission exposes failed-student count and names `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548`
- vNext now: Atomic write errors show no marks saved plus roster-reload action `src/components/attendance/faculty-attendance-workspace.tsx:420-436` `src/components/attendance/faculty-attendance-workspace.tsx:1052-1066`
- Fix: Document atomic behavior and clear all-or-nothing wording

## G2-15-009-030  [P2] MISSING  facet F07  effort S
- Legacy: Missing date message Select Date (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:116-125`)
- vNext now: No standalone date/Select Date (`src/components/attendance/faculty-attendance-workspace.tsx:1229-1251`)
- Fix: Implement exact Date required message

## G2-15-009-031  [P2] GAP  facet F07  effort S
- Legacy: Messages Select Start Time and Select End Time (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:135-156`)
- vNext now: Browser native required messages (`src/components/attendance/faculty-attendance-workspace.tsx:1229-1251`)
- Fix: Render field-specific old validation text
