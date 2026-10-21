# Work packet: edit src/components/attendance/faculty-attendance-workspace.tsx (part 3 of 3)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-15-009-034  [P2] GAP  facet F07  effort S
- Legacy: Toasts Please select a class. and Nothing to submit — mark at least one student present or absent. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:457-478`)
- vNext now: Disabled submit rather than those warnings (`src/components/attendance/faculty-attendance-workspace.tsx:1035-1043`)
- Fix: Preserve guarded client validation and copy

## G2-15-009-037  [P2] GAP  facet F08  effort S
- Legacy: Schedule success/error exact text with four-second message toast (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:233-254`)
- vNext now: Persistent Alert success/inline error, not four-second toast (`src/components/attendance/faculty-attendance-workspace.tsx:479-488`)
- Fix: Match transient 4s feedback and exact text

## G2-18-009-036  [P2] GAP  facet F07  effort M
- Legacy: Legacy faculty report error `Couldn't load attendance data for this month.` + Retry (`TeacherAttendanceView.jsx:63-88,122-130`).
- vNext now: New SSR workspace no per-month request/Retry, month computed client (`faculty-attendance-workspace.tsx:290-302,494-520`).
- Fix: Distinguish remote failure from empty and add retry/refresh affordance.

## G2-18-009-037  [P2] GAP  facet F07  effort M
- Legacy: Legacy schedule lookup warning `Class schedules unavailable`, desc backend message or `Could not load class schedules for this date.` (`TakeAttendanceHeaderFilters.js:102-137`).
- vNext now: New all sessions in server workspace, no isolated selector failure (`faculty-attendance-workspace.tsx:800-843`).
- Fix: Add scoped warning/error/retry when session listing fails.

## G2-18-009-042  [P2] GAP  facet F08  effort S
- Legacy: Legacy mark confirm Modal titled `Submit Attendance`, text `Mark N students absent and M students present?` (`TakeAttendance.js:376-410`).
- vNext now: New ConfirmDialog title same but description from attendanceConfirmation model, not necessarily exact (`faculty-attendance-workspace.tsx:1072-1083`).
- Fix: Use literal singular/plural count wording and Confirm/Cancel actions.

## G2-19-009-019  [P2] GAP  facet F07  effort M
- Legacy: Old loading error `Could not load the attendance roster` Retry `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:268-275`
- vNext now: vNext empty search text No learners match this search `src/components/attendance/faculty-attendance-workspace.tsx:920-924`
- Fix: Keep loading/transport failure separate from empty search.

## G2-19-009-020  [P2] GAP  facet F07  effort M
- Legacy: Old submit warning Nothing to submit — mark at least one student... `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:469-479`
- vNext now: vNext corrected marked session requires changed mark and reason `src/components/attendance/faculty-attendance-workspace.tsx:353-361`
- Fix: Use distinct initial-empty vs unchanged-correction errors.

## G2-19-009-022  [P2] GAP  facet F08  effort S
- Legacy: Old successful submit message Attendance marked successfully. duration4 `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:507-514`
- vNext now: vNext global savedNotice inline Alert `src/components/attendance/faculty-attendance-workspace.tsx:494-496`
- Fix: Show legacy 4-second toast plus persistent save receipt.

## G2-2-027-034  [P2] GAP  facet F08  effort S
- Legacy: TakeAttendance.js:508-515 shows success toast 4 seconds and resets dirty.
- vNext now: faculty-attendance-workspace.tsx:429-431 sets persistent Alert and router.refresh().
- Fix: Match old four-second toast dismissal and reset state after confirmed save.

## G2-2-027-035  [P2] GAP  facet F08  effort S
- Legacy: TakeAttendance.js:515-516 closes confirmation on full success.
- vNext now: faculty-attendance-workspace.tsx:383-384 closes confirmation before network send.
- Fix: Keep confirming overlay locked until saved or failed to avoid misleading disappearing dialog.

## G2-2-037-023  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:508-515 four-second success toast
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:429-435 persistent inline Alert
- Fix: Clone toast placement/lifetime and copy at page level, preserve atomic semantics.

## G2-15-009-038  [P3] GAP  facet F08  effort S
- Legacy: Success Attendance marked successfully. in 4s message toast (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:507-515`)
- vNext now: Same copy in persistent Alert (`src/components/attendance/faculty-attendance-workspace.tsx:429-430`)
- Fix: Keep copy but restore toast timing/position

## G2-18-009-041  [P3] GAP  facet F08  effort S
- Legacy: Legacy schedule success toast `Class scheduled successfully.`, 4s (`TakeAttendance.js:230-247`).
- vNext now: New success Alert `Class scheduled successfully.` without 4s timer (`faculty-attendance-workspace.tsx:479-485,494-497`).
- Fix: Match legacy ephemeral toast placement/duration.

## G2-18-009-043  [P3] GAP  facet F08  effort S
- Legacy: Legacy schedule failure toast backend message or `Failed to schedule class.`, 4s (`TakeAttendance.js:248-259`).
- vNext now: New inline `Failed to schedule class. Check your connection and try again.` (`faculty-attendance-workspace.tsx:470-489,1265-1272`).
- Fix: Use exact legacy fallback and toast while preserving server reason.

## G2-2-027-033  [P3] GAP  facet F08  effort S
- Legacy: AttendanceBulkController.java:174-177 success message `Attendance recorded for N learner(s)`.
- vNext now: faculty-attendance-workspace.tsx:429-431 shows `Attendance marked successfully.`.
- Fix: Decide whether API count belongs in toast; mirror legacy detailed completion message if required.
