# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u009-attendance-shared-component.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u009-attendance-shared-component.md

## G2-5-009-005  [P1] GAP  facet F02 Layout/section order  effort M
- Legacy: Option/class-course error banners precede filters (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-496)
- vNext now: Only empty state; no independent options verification alerts (src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Show validation and retry banners in exact order.

## G2-5-009-009  [P1] GAP  facet F03 Visible elements  effort M
- Legacy: Course placeholder reflects loading/unavailable/not linked and disabled appropriately (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:501-513)
- vNext now: One Select with no dynamic class-course Retry/placeholder (src/components/attendance/admin-attendance-workspace.tsx:355-375)
- Fix: Implement all course verification states and safe disabled condition.

## G2-5-009-016  [P1] GAP  facet F04 Data formatting  effort M
- Legacy: Multi-session cell number attended/marked ratio (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- vNext now: Shows N sessions rather than attended/marked (src/components/attendance/admin-attendance-workspace.tsx:527-552)
- Fix: Use per-student per-day ratio backed by marks.

## G2-5-009-028  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: Options unavailable shows Retry and says couldn't load classes/courses (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-490)
- vNext now: SSR awaited without local catch, likely global error boundary (src/app/(authenticated)/college/attendance/page.tsx:54-77)
- Fix: Catch lookup failure inside page, provide scoped Retry.

## G2-5-009-029  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: Failed class-course verification disables unsafe course choice with Retry class courses (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:491-495)
- vNext now: No dedicated verification failure, courses merged from deliveries (src/components/attendance/admin-attendance-workspace.tsx:355-375)
- Fix: Distinguish zero courses from failed verification.

## G2-5-009-030  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: On cell open record fetched, missing record shows Attendance record unavailable. (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71)
- vNext now: Correction drawer uses cached grid record, no detail GET (src/components/attendance/admin-attendance-workspace.tsx:207-218)
- Fix: Add record detail read/Retry before correction.

## G2-5-009-037  [P1] GAP  facet F09 Modals/drawers  effort M
- Legacy: If absent only Mark present; else Mark absent with reason Radio.Group (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:265-275)
- vNext now: Five status buttons always visible (src/components/attendance/admin-attendance-workspace.tsx:644-679)
- Fix: Match single available action and default reason per current state.

## G2-5-009-038  [P1] GAP  facet F09 Modals/drawers  effort M
- Legacy: Failed record detail lookup blocks correction controls (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-67)
- vNext now: No record GET so drawer can show stale records (src/components/attendance/admin-attendance-workspace.tsx:207-218)
- Fix: Disable save until validated live record detail.

## G2-5-009-042  [P1] GAP  facet F10 Actions/side effects  effort M
- Legacy: No record => no correction allowed (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-67)
- vNext now: Guard checks timeline and session, but not live record GET (src/components/attendance/admin-attendance-workspace.tsx:246-260)
- Fix: Block writes on missing/stale record version.

## G2-5-009-046  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Absent exception rows imply counted session even if attendanceMarkedAt missing (docs/legacy-source/frontend/src/utils/adminAttendanceGrid.js:6-18)
- vNext now: Only MARKED session counts toward denominator (src/modules/attendance/admin-grid-model.ts:91-132)
- Fix: Include absence-implied historical marked records.

## G2-5-009-047  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Per-learner marked session denominator (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:99-112)
- vNext now: Uses markedSessions × active student count for aggregate (src/components/attendance/admin-attendance-workspace.tsx:230-236)
- Fix: Compute count per learner and handle partial marking.

## G2-5-009-051  [P1] GAP  facet F13 States  effort M
- Legacy: Loading monthly attendance 8x8 skeleton, refreshing status, last grid+Retry (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538)
- vNext now: SSR reads and workspace without scoped skeleton/retry (src/app/(authenticated)/college/attendance/page.tsx:54-77)
- Fix: Build loading and refreshing states retaining data.

## G2-5-009-054  [P1] GAP  facet F14 Exports  effort M
- Legacy: CSV Student, day1..N; empty if no class; ratio multi-session (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:451-463)
- vNext now: Learner/Roll/days/Attendance %, no-class ✖, split codes (src/components/attendance/admin-attendance-workspace.tsx:299-320)
- Fix: Export screen-equivalent values and exact columns.

## G2-5-009-073  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Attend keyed student_id/class_schedule_id with absence reason (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:11-43)
- vNext now: Attendance records keyed schedule event UUID + membership UUID, status (src/db/schema/attendance.ts:110-169)
- Fix: Field-by-field migration of old exceptions to new statuses.

## G2-5-009-074  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: ClassSchedule contains faculty/course/session mark timestamp (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35)
- vNext now: Schedule events and attendance_sessions separate marked flag (src/db/schema/attendance.ts:63-108)
- Fix: Migrate old times/course relationships and attendanceMarkedAt.

## G2-5-009-075  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Read legacy app_setting policy values via PolicySettingField (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:478-485)
- vNext now: Dedicated attendance_policies table keyed by college (src/db/schema/attendance.ts:17-60)
- Fix: Migrate effective global/org/college policy overrides.
