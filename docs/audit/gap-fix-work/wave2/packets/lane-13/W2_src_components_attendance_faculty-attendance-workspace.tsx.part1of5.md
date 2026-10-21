# Work packet (wave 2): edit src/components/attendance/faculty-attendance-workspace.tsx (part 1 of 5)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-14/u009-teacher-attendance-view.md

## G2-13-009-007  [P2] GAP  facet F02  effort S
- Legacy: Legacy faculty mark mode preserves same outer report toolbar (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-98`)
- vNext now: New FacultyAttendanceWorkspace separate PageHeader with mode/filters (`src/components/attendance/faculty-attendance-workspace.tsx:501-522`)
- Fix: Unify shell structure so mode transitions preserve page head.

## G2-13-009-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy attendance faculty legend P/A/—/✖ above monthly grid (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:231-236`)
- vNext now: New faculty legend after grid, adds S for future (`src/components/attendance/faculty-attendance-workspace.tsx:794-794`)
- Fix: Put legend before grid; retain future marker as separate enhancement.

## G2-13-009-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy report download icon DownloadOutlined with Button Download Report (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:221-229`)
- vNext now: New FacultyReportDownload inside summary, different CTA styling (`src/components/attendance/faculty-attendance-workspace.tsx:596-616`)
- Fix: Keep Download Report icon button near month label.

## G2-13-009-027  [P2] GAP  facet F06  effort S
- Legacy: Legacy faculty mode segmented Attendance report / Mark attendance (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-83`)
- vNext now: New mode Monthly Attendance / Mark attendance (`src/components/attendance/faculty-attendance-workspace.tsx:501-515`)
- Fix: Restore exact `Attendance report` label and selection icon style.

## G2-13-009-028  [P2] GAP  facet F06  effort S
- Legacy: Legacy teacher class selector only if >1 assigned sections, placeholder Select Class (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-72`)
- vNext now: New route scopes delivery and does not show class select inside attendance component (`src/components/attendance/faculty-attendance-workspace.tsx:141-153`)
- Fix: Provide class selector when multiple assigned sections and update URL.

## G2-13-009-038  [P2] GAP  facet F09  effort S
- Legacy: Legacy switching dirty attendance uses native confirm prompt (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:23-28`)
- vNext now: New ConfirmDialog Discard your unsaved attendance changes?, danger (`src/components/attendance/faculty-attendance-workspace.tsx:1275-1282`)
- Fix: Match modal wording while retaining accessible dialog.

## G2-13-009-042  [P2] GAP  facet F10  effort L
- Legacy: Legacy faculty GET getStudentAttendanceByDaterange by class/month/faculty (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-66`)
- vNext now: New faculty workspace fetched by deliveryId/role and records/sessions (`src/components/attendance/faculty-attendance-workspace.tsx:82-92`)
- Fix: Compare projection and join cardinality; preserve complete month/roster.

## G2-13-009-043  [P2] GAP  facet F10  effort L
- Legacy: Legacy mark uses markBulkAttendance/markStudentAbsent APIs (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:8-15`)
- vNext now: New faculty workspace saves via service-backed attendance API (`src/components/attendance/faculty-attendance-workspace.tsx:353-430`)
- Fix: Map bulk absent/present and corrections to same atomic final state.

## G2-13-009-044  [P2] GAP  facet F10  effort M
- Legacy: Legacy download PDF client-side buildMonthlyAttendanceReport and downloadMonthlyAttendancePdf (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:175-184`)
- vNext now: New FacultyReportDownload builds typed report (`src/components/attendance/faculty-attendance-workspace.tsx:596-632`)
- Fix: Compare report column headers, attendance percentages, file name and metadata.

## G2-13-009-053  [P2] GAP  facet F13  effort S
- Legacy: Legacy faculty true empty No attendance data for this month (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:129-131`)
- vNext now: New No scheduled classes this month and action guidance (`src/components/attendance/faculty-attendance-workspace.tsx:678-680`)
- Fix: Map no schedules vs no attendance yet to separate empty states.

## G2-13-009-056  [P2] GAP  facet F14  effort S
- Legacy: Legacy Download Report always produces PDF and disables if no students (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:221-229`)
- vNext now: New FacultyReportDownload takes month and rows (`src/components/attendance/faculty-attendance-workspace.tsx:596-632`)
- Fix: Verify disabled when zero data and PDF filename/columns.

## G2-13-009-061  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop monthly grid horizontally scrollable with student names fixed side (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:237-249`)
- vNext now: New scroll min-w 48rem table (`src/components/attendance/faculty-attendance-workspace.tsx:686-794`)
- Fix: Verify sticky student labels, header scroll and focus at 375/768.

## G2-13-009-067  [P2] GAP  facet F18  effort S
- Legacy: Old faculty mode label Attendance report (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:79-82`)
- vNext now: New Monthly Attendance mode (`src/components/attendance/faculty-attendance-workspace.tsx:509-514`)
- Fix: Restore exact segmented copy.

## G2-14-009-001  [P2] GAP  facet F01  effort M
- Legacy: Role-specific AttendanceReport mounts this faculty report component in course tab `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:14-19` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:94-99`
- vNext now: Standalone course delivery attendanceDetail route with visible PageHeader `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:14-39` `src/components/attendance/faculty-attendance-workspace.tsx:498-506`
- Fix: Keep attendance report in a unified course tab with no duplicate page head

## G2-14-009-002  [P2] GAP  facet F01  effort M
- Legacy: Faculty with multiple class assignments selects class in toolbar and URL changes shallowly via cls `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:30-41` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-73`
- vNext now: cls redirects to delivery route and class select is absent `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34` `src/components/attendance/faculty-attendance-workspace.tsx:498-520`
- Fix: Show class selector only for multiple assignments and preserve cls deep link

## G2-14-009-003  [P2] GAP  facet F01  effort S
- Legacy: Course Attendance title is screen-reader-only because outer tab names it `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:44-55`
- vNext now: Visible Attendance title plus course-code eyebrow and period `src/components/attendance/faculty-attendance-workspace.tsx:498-506`
- Fix: Match legacy tab title treatment and remove duplicate visible eyebrow

## G2-14-009-005  [P2] GAP  facet F02  effort M
- Legacy: Toolbar then monthly class health section then separate monthly grid card `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:58-99` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:188-249`
- vNext now: Header then badges and month picker then summary and risk panel then grid `src/components/attendance/faculty-attendance-workspace.tsx:498-795`
- Fix: Restore legacy report section order and separate grid header

## G2-14-009-006  [P2] GAP  facet F02  effort S
- Legacy: Grid card has its own heading, active-day count, month and download action `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:212-230`
- vNext now: Download within summary area and active days in SummaryStrip `src/components/attendance/faculty-attendance-workspace.tsx:581-642`
- Fix: Move action and active-day count into grid heading toolbar

## G2-14-009-007  [P2] GAP  facet F02  effort M
- Legacy: Summary uses dedicated learn-attendance-summary faculty and grid card styles `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:190-212` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:212-249`
- vNext now: Border-bottom sections and shared SummaryStrip `src/components/attendance/faculty-attendance-workspace.tsx:581-643`
- Fix: Copy legacy section geometry and spacing from AttendanceReport.scss

## G2-14-009-008  [P2] GAP  facet F03  effort S
- Legacy: Visible label Monthly class health above large percentage `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:190-200`
- vNext now: Visible title Monthly Attendance and Monthly class health is aria label `src/components/attendance/faculty-attendance-workspace.tsx:581-590`
- Fix: Render Monthly class health as visible summary heading

## G2-14-009-009  [P2] GAP  facet F03  effort S
- Legacy: Summary shows Students, Sessions, Absences and conditional Not marked `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:203-210`
- vNext now: Shows unconditional Not marked, Active days and Upcoming too `src/components/attendance/faculty-attendance-workspace.tsx:635-642`
- Fix: Restore main four chips and conditional not-marked display

## G2-14-009-011  [P2] GAP  facet F03  effort S
- Legacy: Legend before table has four individually styled chips `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:231-238`
- vNext now: Single sentence after table with S future and x/y `src/components/attendance/faculty-attendance-workspace.tsx:793-795`
- Fix: Restore legend chips ahead of table and put extras separately

## G2-14-009-014  [P2] GAP  facet F04  effort S
- Legacy: If no held classes summary says No scheduled sessions found for this month `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:191-201`
- vNext now: Summary always says zero present marks across zero sessions `src/components/attendance/faculty-attendance-workspace.tsx:588-594`
- Fix: Use exact legacy empty-summary sentence

## G2-14-009-016  [P2] GAP  facet F04  effort S
- Legacy: Month printed as MMMM YYYY `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:218-220` `docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:68-78`
- vNext now: Month control and report title show raw YYYY-MM `src/components/attendance/faculty-attendance-workspace.tsx:554-564` `src/components/attendance/faculty-attendance-workspace.tsx:598-613`
- Fix: Display full month name and keep YYYY-MM internal key

## G2-14-009-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy name uses first and last name from active roster `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:858-894`
- vNext now: Name falls back to email and short membership ID with extra contact details `src/components/attendance/faculty-attendance-workspace.tsx:97-103` `src/components/attendance/faculty-attendance-workspace.tsx:720-743`
- Fix: Show legacy full name in grid; move contact fallbacks to details

## G2-14-009-020  [P2] GAP  facet F05  effort S
- Legacy: Two rows of weekday initials and day numbers `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:242-246` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:275-315`
- vNext now: One row contains DD Mon and possible times count `src/components/attendance/faculty-attendance-workspace.tsx:686-716`
- Fix: Restore two-tier month header

## G2-14-009-021  [P2] GAP  facet F05  effort S
- Legacy: Sticky first header says Student Name and rows use th scope=row `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:267-273` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:297-326`
- vNext now: Header says Learner and row names are td `src/components/attendance/faculty-attendance-workspace.tsx:686-690` `src/components/attendance/faculty-attendance-workspace.tsx:719-745`
- Fix: Restore Student Name and proper scoped row header

## G2-14-009-023  [P2] MISSING  facet F05  effort M
- Legacy: Mixed-session ratio opens per-session tooltip table with Session Time and Attendance `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:373-399` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:428-449`
- vNext now: Ratio badge has no popover; time only in column title `src/components/attendance/faculty-attendance-workspace.tsx:695-714` `src/components/attendance/faculty-attendance-workspace.tsx:770-785`
- Fix: Add accessible per-session tooltip table with A P and N

## G2-14-009-026  [P2] GAP  facet F06  effort S
- Legacy: Ant date picker is month-only, read-only, cannot clear `docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:68-79`
- vNext now: Native type=month control is editable and browser-rendered `src/components/attendance/faculty-attendance-workspace.tsx:554-564`
- Fix: Use month picker with exact read-only display and no-clear rule

## G2-14-009-028  [P2] MISSING  facet F06  effort M
- Legacy: Class selector shows only when more than one assignment, width min 160px `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-72`
- vNext now: No in-page class selector `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34` `src/components/attendance/faculty-attendance-workspace.tsx:498-520`
- Fix: Add class selector with same conditional and placeholder

## G2-14-009-037  [P2] MISSING  facet F09  effort M
- Legacy: Multi-session tooltip reveals per-class time and mark `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:373-399` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:428-449`
- vNext now: No equivalent popup in grid `src/components/attendance/faculty-attendance-workspace.tsx:770-785`
- Fix: Add keyboard and hover reachable tooltip

## G2-14-009-054  [P2] GAP  facet F13  effort S
- Legacy: Empty report text No attendance data for this month `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:129-131`
- vNext now: New No scheduled classes this month with next-action message `src/components/attendance/faculty-attendance-workspace.tsx:678-683`
- Fix: Match exact report empty state text

## G2-14-009-058  [P2] GAP  facet F14  effort S
- Legacy: Download filename attendance-course-MMMM-YYYY.pdf `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:140-142`
- vNext now: Filename attendance-report-title-with-YYYY-MM.pdf `src/components/attendance/faculty-attendance-workspace.tsx:598-600` `src/components/courses/faculty-report-download.tsx:26-31`
- Fix: Use original name token order and month label

## G2-14-009-059  [P2] GAP  facet F14  effort S
- Legacy: No students disables download button `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:221-228`
- vNext now: New hides download when no students or no sessions `src/components/attendance/faculty-attendance-workspace.tsx:596-633`
- Fix: Render disabled control rather than omit

## G2-14-009-062  [P2] GAP  facet F16  effort S
- Legacy: Legacy attendance toolbar stacks and centers under 768px `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.scss:100-112`
- vNext now: Month filter uses flex-wrap, responsive md layout `src/components/attendance/faculty-attendance-workspace.tsx:524-579`
- Fix: Match centered stack at phone widths

## G2-14-009-063  [P2] GAP  facet F16  effort M
- Legacy: Legacy day columns min-width 32px and overflow scrolls `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.scss:33-53`
- vNext now: New min-width 112px per day with table min 48rem `src/components/attendance/faculty-attendance-workspace.tsx:686-716`
- Fix: Restore compact columns and horizontal scroll

## G2-14-009-064  [P2] GAP  facet F17  effort S
- Legacy: Month caption and th scope=row learner names `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:238-246` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:320-326`
- vNext now: scrollLabel on table but learner cell is td; no month caption `src/components/attendance/faculty-attendance-workspace.tsx:686-790`
- Fix: Use actual scoped row headers and caption

## G2-14-009-065  [P2] GAP  facet F17  effort M
- Legacy: Session ratio is keyboard-focusable with aria-label `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:389-399`
- vNext now: Ratio text inside noninteractive badge `src/components/attendance/faculty-attendance-workspace.tsx:770-785`
- Fix: Make session tooltip keyboard-operable with Escape

## G2-14-009-067  [P2] GAP  facet F18  effort S
- Legacy: Mode tab says Attendance report `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-83`
- vNext now: New says Monthly Attendance `src/components/attendance/faculty-attendance-workspace.tsx:508-518`
- Fix: Use exact segment label

## G2-14-009-068  [P2] GAP  facet F18  effort S
- Legacy: Summary heading says Monthly class health `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:190-200`
- vNext now: New says Monthly Attendance `src/components/attendance/faculty-attendance-workspace.tsx:581-595`
- Fix: Use exact heading
