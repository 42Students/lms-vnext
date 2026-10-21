# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u009-attendance-shared-component.md

31 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u009-attendance-shared-component.md

## G2-5-009-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: If not collegeScoped shows warning Select a College to view attendance (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:476)
- vNext now: No-college separate route empty state (src/app/(authenticated)/college/attendance/page.tsx:38-42)
- Fix: Match warning alert wording and icon.

## G2-5-009-008  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Select class placeholder Select class, loading, error disables selector (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-500)
- vNext now: Class Select always available from server options (src/components/attendance/admin-attendance-workspace.tsx:335-354)
- Fix: Use loading/verification states with precise placeholder.

## G2-5-009-010  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Link Show all college courses toggles Only courses taught to this class (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:514-517)
- vNext now: Checkbox always visible and explanatory extra phrase (src/components/attendance/admin-attendance-workspace.tsx:379-391)
- Fix: Use two-state link with exact copy.

## G2-5-009-011  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Icon-only month navigation with MMMM YYYY in middle (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-520)
- vNext now: Previous/Next text buttons and native month input (src/components/attendance/admin-attendance-workspace.tsx:392-410)
- Fix: Match icon-only arrows and label.

## G2-5-009-012  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: CSV action DownloadOutlined button disabled if no absentees (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:521)
- vNext now: CSV positioned in stats region, may disappear when no grid (src/components/attendance/admin-attendance-workspace.tsx:437-473)
- Fix: Keep disabled export in toolbar.

## G2-5-009-013  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Legend P/A/N/X and count ratio above table (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:150-156)
- vNext now: Legend at bottom, adds E/M/L/S codes (src/components/attendance/admin-attendance-workspace.tsx:589-591)
- Fix: Match legacy legend placement and code semantics.

## G2-5-009-015  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Separate weekday initial header, day-number second row (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:160-172)
- vNext now: One header cell with number and weekday (src/components/attendance/admin-attendance-workspace.tsx:481-500)
- Fix: Restore two distinct header rows.

## G2-5-009-019  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Session local time formatted with dayjs to hour/minute (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:21-32)
- vNext now: Session ISO printed in IST (src/components/attendance/admin-attendance-workspace.tsx:126-133)
- Fix: Check time zone around midnight; preserve India policy deliberately.

## G2-5-009-024  [P2] GAP  facet F06 Forms  effort M
- Legacy: AntD Select searchable via showSearch and option label contains (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-513)
- vNext now: Native Select controls, no searchable type-ahead (src/components/attendance/admin-attendance-workspace.tsx:335-375)
- Fix: Implement keyboard searchable class/course selects.

## G2-5-009-031  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Correction error toast fallback Attendance correction failed. Retry without closing this record. (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:93-96)
- vNext now: Inline fetch error and generic Check your connection and retry. (src/components/attendance/admin-attendance-workspace.tsx:281-288)
- Fix: Align exact fallback wording and preserve open modal.

## G2-5-009-032  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Success transient message.success including session label (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:89-92)
- vNext now: Persistent top Info Alert with session.title (src/components/attendance/admin-attendance-workspace.tsx:278-280)
- Fix: Use transient toast with formatted meeting time.

## G2-5-009-033  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Correction failures transient error message, no modal close (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:93-96)
- vNext now: Inline Alert, drawer remains open (src/components/attendance/admin-attendance-workspace.tsx:281-288)
- Fix: Match toast lifetime and location, preserve persistent form error if needed.

## G2-5-009-034  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Retry a failed lookup no success toast, banner disappears (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-490)
- vNext now: No explicit options Retry button (src/components/attendance/admin-attendance-workspace.tsx:414-425)
- Fix: Restore retry feedback and loading transition.

## G2-5-009-035  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Choose a session — [student] centered Modal with warning text (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:221-237)
- vNext now: Choose attendance session in Drawer, no matching warning (src/components/attendance/admin-attendance-workspace.tsx:742-769)
- Fix: Restore Modal and exact wording.

## G2-5-009-036  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Correction record Modal shows conditional audit metadata (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:239-264)
- vNext now: Side Drawer, always shows audit rows and extra explanatory fields (src/components/attendance/admin-attendance-workspace.tsx:621-741)
- Fix: Use modal, conditionally show Marked by/at.

## G2-5-009-039  [P2] GAP  facet F10 Actions/side effects  effort L
- Legacy: Monthly GET collegeId/classId/courseId/startDate/endDate (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:423-427; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153)
- vNext now: getAdminAttendanceGrid by deliveryId and month (src/modules/attendance/admin-service.ts:282-425)
- Fix: Verify all sections/terms represented under chosen class/course.

## G2-5-009-048  [P2] GAP  facet F12 Business rules  effort S
- Legacy: Session held when start missing or <=now (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:21-26)
- vNext now: Session start must be valid and <= loadedAt (src/components/attendance/admin-attendance-workspace.tsx:220-238)
- Fix: Handle historical missing start and live now tick.

## G2-5-009-053  [P2] GAP  facet F14 Exports  effort S
- Legacy: Filename attendance-class-CLASS-course-COURSE-YYYY-MM.csv (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:447-467)
- vNext now: attendance-sectionCode-courseCode-month.csv (src/components/attendance/admin-attendance-workspace.tsx:292-320)
- Fix: Match exact filename.

## G2-5-009-055  [P2] GAP  facet F14 Exports  effort S
- Legacy: Export CSV button disabled when no records (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:521)
- vNext now: Action located in summary when grid exists (src/components/attendance/admin-attendance-workspace.tsx:437-473)
- Fix: Show disabled action in toolbar.

## G2-5-009-058  [P2] GAP  facet F16 Responsive  effort M
- Legacy: 220px class/course Select and 12px flex gap (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-513)
- vNext now: Full-width labeled filters, responsive grid (src/components/attendance/admin-attendance-workspace.tsx:324-391)
- Fix: Match compact filter widths and wrapping.

## G2-5-009-059  [P2] GAP  facet F16 Responsive  effort M
- Legacy: 31 narrow date columns scroll x (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:157-171)
- vNext now: Date columns min-width16 and padded cells (src/components/attendance/admin-attendance-workspace.tsx:481-500)
- Fix: Match row/cell density for month horizontal scroll.

## G2-5-009-060  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Table caption and student row header scope semantics (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:159-180)
- vNext now: Caption exists, learner row in body td (src/components/attendance/admin-attendance-workspace.tsx:477-515)
- Fix: Add scope=row and two-level headers.

## G2-5-009-061  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Cell accessible status name includes student and selected date (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- vNext now: Multi-session aria announces count only (src/components/attendance/admin-attendance-workspace.tsx:539-547)
- Fix: Use attendance ratio in accessible label.

## G2-5-009-062  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Legend P/A/N/X visually and through text (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:150-156)
- vNext now: Different legend under table (src/components/attendance/admin-attendance-workspace.tsx:589-591)
- Fix: Restore placement and exact semantic legends.

## G2-5-009-063  [P2] GAP  facet F18 Wording  effort S
- Legacy: Attendance; Review monthly attendance by class and course, correct recent records, and export same grid shown on screen. (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:470-474)
- vNext now: College-wide attendance oversight for college (src/app/(authenticated)/college/attendance/page.tsx:119-122)
- Fix: Use exact subtitle.

## G2-5-009-064  [P2] GAP  facet F18 Wording  effort S
- Legacy: Choose a session — [student]; Only the session you open will be corrected (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:221-224)
- vNext now: Choose attendance session, no warning (src/components/attendance/admin-attendance-workspace.tsx:742-748)
- Fix: Use exact title/helper text.

## G2-5-009-014  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: Students, Sessions held, Absences, optional Not marked summary (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:134-140)
- vNext now: Definition list with Active days and always Not marked (src/components/attendance/admin-attendance-workspace.tsx:438-466)
- Fix: Reproduce metric order and conditional label.

## G2-5-009-017  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: Student cell only studentName (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:174-180)
- vNext now: Learner name plus Roll/email fallback (src/components/attendance/admin-attendance-workspace.tsx:503-525)
- Fix: Show legacy primary name, move extra metadata out of clone.

## G2-5-009-050  [P3] GAP  facet F13 States  effort S
- Legacy: Pick a class and course to view attendance (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:534-539)
- vNext now: Select a class and course/other detailed empties (src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Use exact legacy initial empty message.

## G2-5-009-052  [P3] GAP  facet F13 States  effort S
- Legacy: No attendance data for this class, course and month (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:122-125)
- vNext now: No attendance data for this month (src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Use full legacy scope-specific sentence.

## G2-5-009-065  [P3] GAP  facet F18 Wording  effort S
- Legacy: Previous month/Next month accessible labels, Export CSV copy (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-521)
- vNext now: Text Previous and Next, Export action remote (src/components/attendance/admin-attendance-workspace.tsx:392-410)
- Fix: Match icons and preserve labels.
