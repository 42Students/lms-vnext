# Work packet: edit src/components/attendance/admin-attendance-workspace.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-5-001-012  [P1] GAP  facet F04 Data shown/formatting  effort M
- Legacy: Attendance marker choices N, P, A or attended/marked ratio for multiple sessions; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207
- vNext now: Badge uses 1-session state or text '[n] sessions' for multi-session day; src/components/attendance/admin-attendance-workspace.tsx:527-552
- Fix: Calculate and show per-day attended/marked ratio instead of session count; preserve chooser on click.

## G2-5-001-019  [P1] GAP  facet F06 Forms  effort M
- Legacy: Class changes clear course/grid, and class-course failure blocks course selection; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:349-365,491-513
- vNext now: Class changes clear course/delivery; course list computed from delivery data; src/components/attendance/admin-attendance-workspace.tsx:183-191,337-355
- Fix: On lookup failure distinguish cannot-verify from valid zero linked courses; disable only unsafe selection and provide retry.

## G2-5-001-023  [P1] GAP  facet F07 Validation and errors  effort M
- Legacy: Assignment verification failure 'Couldn't verify which courses are taught to this class' and Retry class courses; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:491-495
- vNext now: No dedicated per-class lookup error state because courses from delivery list; src/components/attendance/admin-attendance-workspace.tsx:179-191,414-425
- Fix: Surface class-offering lookup failure separately from verified empty list; provide retry.

## G2-5-001-024  [P1] GAP  facet F07 Validation and errors  effort L
- Legacy: Correction record invalid/missing shows precise 'Attendance record unavailable' and retry, stops action; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-67,239-245
- vNext now: Correction drawer relies on preloaded grid and does not issue record detail lookup; src/components/attendance/admin-attendance-workspace.tsx:207-218,621-741
- Fix: Add separate authenticated record read/validation before enabling correction, with an inline Retry record state.

## G2-5-001-030  [P1] GAP  facet F09 Modals/drawers/popovers  effort M
- Legacy: If absent, show only 'Mark present'; else single 'Mark absent' plus reason Radio.Group; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:265-275
- vNext now: Always renders five footer buttons Present/Absent/Excused/Medical/Late; src/components/attendance/admin-attendance-workspace.tsx:644-679
- Fix: Restore state-dependent single action and reason radio default; prevent nonsensical same-status submission.

## G2-5-001-032  [P1] GAP  facet F10 Actions and side effects  effort M
- Legacy: Per-cell GET /api/v1/admin/attendance/record prior to write; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-259
- vNext now: Reads all record rows in initial grid and opens drawer without second GET; src/components/attendance/admin-attendance-workspace.tsx:207-218,542-545,683-739
- Fix: Revalidate state on open to avoid stale corrections, and block writes if record fetch fails.

## G2-5-001-040  [P1] GAP  facet F12 Business rules and formulas  effort M
- Legacy: Class-wide percentage is sum of per-learner marked or absent-implied sessions; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:99-112
- vNext now: Compute markedSessions × active roster minus non-PRESENT records; src/components/attendance/admin-attendance-workspace.tsx:230-236
- Fix: Use per-learner counted denominator, respecting exception rows/partial attendance and explicit marking state.

## G2-5-001-043  [P1] GAP  facet F13 Empty/loading/error/offline/session  effort M
- Legacy: Grid skeleton labeled 'Loading monthly attendance'; refresh status 'Refreshing attendance…'; error retains last grid and Retry; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538
- vNext now: Server-rendered data delivered without explicit grid skeleton/refresh partial state or scoped Retry; src/app/(authenticated)/college/attendance/page.tsx:54-77; src/components/attendance/admin-attendance-workspace.tsx:414-435
- Fix: Add visible loading/refresh/error states with same-scope stale data retained and Retry.

## G2-5-001-046  [P1] GAP  facet F14 Export/import/upload  effort M
- Legacy: No class day CSV cell is empty, multi-session is aggregate attended/marked ratio; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:453-463
- vNext now: No class exports ✖ and multi-session uses slash-separated each-session codes; src/components/attendance/admin-attendance-workspace.tsx:299-307
- Fix: Match on-screen and legacy CSV aggregate ratio; blank no-class dates.

## G2-5-006-024  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: Options failure alert and separate class-course failure with Retry (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-495)
- vNext now: SSR options loaded without specific inline per-lookup Retry (src/app/(authenticated)/admin/attendance/page.tsx:68-72; src/components/attendance/admin-attendance-workspace.tsx:414-425)
- Fix: Catch lookup failures; preserve differentiated options/course warnings.

## G2-5-006-025  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: Grid refresh failure keeps old scope data, warning, Retry (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538)
- vNext now: SSR fetching, no last-good scope grid retention (src/app/(authenticated)/admin/attendance/page.tsx:68-92; src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Retain last matching result and Retry after refresh failure.
