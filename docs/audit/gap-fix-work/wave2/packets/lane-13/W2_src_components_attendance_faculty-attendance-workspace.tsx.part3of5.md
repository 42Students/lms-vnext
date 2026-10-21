# Work packet (wave 2): edit src/components/attendance/faculty-attendance-workspace.tsx (part 3 of 5)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md

## G2-18-009-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy faculty report shows download icon/button near Monthly Attendance header (`TeacherAttendanceView.jsx:175-185,212-229`).
- vNext now: New FacultyReportDownload displayed inside monthly health card (`faculty-attendance-workspace.tsx:596-632`).
- Fix: Align Download report button location/icon and primary action labels.

## G2-18-009-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy teacher grid legend uses individual chips `P = Present`, `A = Absent`, `— = Not marked yet`, `✖ = No class` (`TeacherAttendanceView.jsx:231-236`).
- vNext now: New one joined paragraph adds `S = future class`, `x/y = ...` (`faculty-attendance-workspace.tsx:793-795`).
- Fix: Render 4 original colored legend chips; optionally secondary additional legend.

## G2-18-009-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy staff report grid day headings first-letter weekdays and numerals, sticky Student Name (`TeacherAttendanceView.jsx:262-325`).
- vNext now: New date-heading `DD Mon` only for days with sessions, sticky Learner, no weekday letter row (`faculty-attendance-workspace.tsx:684-717`).
- Fix: Render two-level week day/number headers for all calendar days including no-class.

## G2-18-009-020  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty grid multi-session day shows attended/session ratio and tooltip table `Session Time`,`Attendance` (`TeacherAttendanceView.jsx:337-399,428-446`).
- vNext now: New uses StatusBadge with `ratio` plus date title native tooltip; no per-session tooltip table (`faculty-attendance-workspace.tsx:745-785`).
- Fix: Add focusable session-time/status popover for mixed days.

## G2-18-009-022  [P2] GAP  facet F04  effort M
- Legacy: Legacy faculty active students based absentees.length and sessions marked (`TeacherAttendanceView.jsx:143-173`).
- vNext now: New roster built from active section delivery with mark metadata (`faculty-attendance-workspace.tsx:47-90,317-323`).
- Fix: Crosscheck roster count for withdrawn/moved students; preserve authorized audit history.

## G2-18-009-023  [P2] GAP  facet F05  effort S
- Legacy: Legacy course attendance month picker is one selectable `MMMM YYYY`, previous/next arrows (`CourseAttendeeHeaderFilters.js:48-88`).
- vNext now: New faculty native month Input, learner native Input plus extra `This month` (`faculty-attendance-workspace.tsx:541-577`; `learner-attendance-workspace.tsx:302-348`).
- Fix: Match Ant month picker selector and sizes, keep direct month jump.

## G2-18-009-025  [P2] GAP  facet F05  effort L
- Legacy: Legacy teacher grid lists every student, one column/day, whole month (`TeacherAttendanceView.jsx:252-325`).
- vNext now: New table shows sessions-only columns and allLearners (`faculty-attendance-workspace.tsx:684-790`).
- Fix: Render 28–31 day cells, sticky student header, horizontal scroll for wide months.

## G2-18-009-026  [P2] GAP  facet F05  effort M
- Legacy: Legacy mark grid two columns Student Name and Status, no pagination, vertical 420px scroll (`TakeAttendance.js:73-93,342-348`).
- vNext now: New responsive `ul` of learner list, no table header or 420px scroll (`faculty-attendance-workspace.tsx:917-1006`).
- Fix: Match 2-column Ant Table, 420px viewport scroll and row density.

## G2-18-009-030  [P2] GAP  facet F06  effort S
- Legacy: Legacy mode defaults Attendance report, Segmented toggles Mark and prompts dirty on exit (`AttendanceReport.js:20-28,75-85`).
- vNext now: New defaults REPORT unless deep-linked session, uses ConfirmDialog for dirty swap (`faculty-attendance-workspace.tsx:148-153,267-270,508-518,1275-1282`).
- Fix: Match default report mode, preserve deep links and old exact discard question.

## G2-18-009-031  [P2] GAP  facet F06  effort S
- Legacy: Legacy scheduled session selector shows start time `h:mm A` only, width113 or160; selects first fetched schedule (`TakeAttendanceHeaderFilters.js:74-87,141-160`).
- vNext now: New class session selector shows title/time plus IST, auto-selects resolution model (`faculty-attendance-workspace.tsx:815-843`).
- Fix: Render time-only option labels/default and compact widths when cloning.

## G2-18-009-032  [P2] GAP  facet F06  effort S
- Legacy: Legacy attendance date Select Date Ant DatePicker, allowClear false (`TakeAttendanceHeaderFilters.js:163-177`).
- vNext now: New native date input with visible label Date (`faculty-attendance-workspace.tsx:810-814`).
- Fix: Use legacy picker control/placeholder and date styling.

## G2-18-009-034  [P2] GAP  facet F06  effort M
- Legacy: Legacy ScheduleClassDrawer uses faculty/class IDs and date/start/end, no authoring location/title in parent payload (`TakeAttendance.js:204-262`).
- vNext now: New Schedule drawer requires Title max200, separate startsAt/endsAt ISO, Location max500 (`faculty-attendance-workspace.tsx:1180-1274`; `faculty-service.ts:41-66`).
- Fix: Retain new payload validation, map original time/date defaults, restore legacy drawer visuals.

## G2-18-009-046  [P2] GAP  facet F09  effort M
- Legacy: Legacy draft discard `window.confirm('Discard your unsaved attendance changes?')` on mode/class/date and navigation (`AttendanceReport.js:23-42`; `TakeAttendance.js:49-71`).
- vNext now: New ConfirmDialog on mark mode/session/day switching and beforeunload guard (`faculty-attendance-workspace.tsx:261-270,1275-1282`).
- Fix: Preserve exact text, route-change coverage and cancel semantics.

## G2-18-009-047  [P2] MISSING  facet F09  effort M
- Legacy: Legacy teacher multi-session grid hover/focus CustomToolTipTable with Session Time and Attendance (`TeacherAttendanceView.jsx:373-399,428-446`).
- vNext now: New table badge ratio, date column `title` only (`faculty-attendance-workspace.tsx:692-714,745-785`).
- Fix: Restore keyboard-accessible per-student per-day attendance tooltip.

## G2-18-009-053  [P2] GAP  facet F10  effort M
- Legacy: Legacy teacher GET attendance by classId/startDate/endDate/facultyId, courseSlug/id (`TeacherAttendanceView.jsx:42-99`; `attendanceServices.js:62-66`).
- vNext now: New faculty SSR loader supplies sessions/roster/marks scoped to delivery (`faculty-attendance-workspace.tsx:82-90,141-153`).
- Fix: Map legacy requests to authorized delivery/month reads with equivalent reload.

## G2-18-009-054  [P2] GAP  facet F10  effort M
- Legacy: Legacy Mark date GET schedules (`TakeAttendanceHeaderFilters.js:54-125`; `attendanceServices.js:55-60`).
- vNext now: New Mark list from preloaded workspace sessions (`faculty-attendance-workspace.tsx:290-302,800-843`).
- Fix: Ensure all sessions fetched for selected date (not only bounded default month) and recover errors.

## G2-18-009-055  [P2] GAP  facet F10  effort M
- Legacy: Legacy Mark GET roster by classScheduleId, joins absentees list (`TakeAttendance.js:100-168`; `attendanceServices.js:48-53`).
- vNext now: New currentDeliveryRoster by section/delivery, records by scheduleEventId/membershipId (`faculty-service.ts:129-139`; `faculty-attendance-workspace.tsx:206-215`).
- Fix: Confirm roster membership temporal alignment and historical attendee handling.

## G2-18-009-057  [P2] GAP  facet F10  effort M
- Legacy: Legacy schedule class POST `/api/v1/faculty/schedules` with faculty_id,class_id, times/course (`attendanceServices.js:69-74`; `TakeAttendance.js:217-231`).
- vNext now: New POST `/api/attendance/faculty` with deliveryId/title/timestamps/location (`faculty-attendance-workspace.tsx:455-469`).
- Fix: Translate scope fields, validate time zone and conflict policy.

## G2-18-009-058  [P2] GAP  facet F10  effort M
- Legacy: Legacy PDF is browser-generated from monthly report model, no POST (`TeacherAttendanceView.jsx:175-185`).
- vNext now: New `FacultyReportDownload` locally builds attendance report summary (`faculty-attendance-workspace.tsx:596-632`).
- Fix: Match PDF filename/column/header/format, no server write.

## G2-18-009-069  [P2] GAP  facet F13  effort M
- Legacy: Legacy report loading Spin and distinct failures/no data (`TeacherAttendanceView.jsx:112-140`; `StudentAttendanceView.jsx:53-69`).
- vNext now: New SSR initial load and local month filter no scoped loading Spinner (`faculty-attendance-workspace.tsx:290-302,494-579`; `learn/attendance/page.tsx:19-25`).
- Fix: Add local loading skeleton/spinner when switching course/month.

## G2-18-009-072  [P2] GAP  facet F13  effort M
- Legacy: Legacy roster failure `Could not load the attendance roster` with Retry (`TakeAttendance.js:263-275`).
- vNext now: New initial roster server-loaded, inline only submit error/reload (`faculty-attendance-workspace.tsx:1052-1065`).
- Fix: Implement isolated failure Retry for roster read.

## G2-18-009-073  [P2] GAP  facet F13  effort S
- Legacy: Legacy no scheduled class shows Empty + Schedule Class button (`TakeAttendance.js:364-373`).
- vNext now: New EmptyState `No class scheduled for this date`, schedule in PageHeader (`faculty-attendance-workspace.tsx:800-805,498-503`).
- Fix: Place Schedule Class call-to-action within no-class state.

## G2-18-009-075  [P2] GAP  facet F14  effort M
- Legacy: Legacy faculty Download monthly attendance PDF from report with class/course metadata (`TeacherAttendanceView.jsx:175-185`).
- vNext now: New FacultyReportDownload generates attendance report but different summary rows (`faculty-attendance-workspace.tsx:596-632`).
- Fix: Match old PDF headings, printable grid and filename; preserve no-data handling.

## G2-18-009-079  [P2] GAP  facet F16  effort M
- Legacy: Legacy teacher grid full-month horizontally scroll with sticky student column (`TeacherAttendanceView.jsx:237-248,317-325`).
- vNext now: New min-w-[48rem] horizontal scroll with sticky learner name, only session days (`faculty-attendance-workspace.tsx:684-718`).
- Fix: Match month-day column widths, sticky corner and mobile scroll anatomy.

## G2-18-009-080  [P2] GAP  facet F16  effort M
- Legacy: Legacy Mark table fixed scroll x500/y420 (`TakeAttendance.js:342-348`).
- vNext now: New fluid flex roster, touch buttons min44px, no fixed viewport (`faculty-attendance-workspace.tsx:917-1005`).
- Fix: Restore table viewport and mobile row heights without reducing accessible targets.

## G2-18-009-082  [P2] GAP  facet F17  effort S
- Legacy: Legacy teacher grid first column `<th scope=row>`, header two rows and multi-session ratio focusable (`TeacherAttendanceView.jsx:267-325,389-398`).
- vNext now: New first row learner name `<td>` with button, dates `<th>`, ratio status text (`faculty-attendance-workspace.tsx:684-788`).
- Fix: Use semantic scope=row header while retaining detail button inside.

## G2-18-009-086  [P2] GAP  facet F18  effort S
- Legacy: Legacy label `Select Class` and `Class Start Time` (`AttendanceReport.js:60-72`; `StudentAttendanceView.jsx:200-205`).
- vNext now: New no staff class select; learner table retains `Class Start Time` (`faculty-attendance-workspace.tsx:494-520`; `learner-attendance-workspace.tsx:548-550`).
- Fix: Restore staff Select Class label with named control.

## G2-18-009-090  [P2] GAP  facet F19  effort L
- Legacy: Legacy teacher grid O(students×calendar days), per-day sessions processed client (`TeacherAttendanceView.jsx:252-450`).
- vNext now: New O(roster×only days with sessions), full records hydrated (`faculty-attendance-workspace.tsx:290-302,684-790`).
- Fix: Bound data for large rosters and restore calendar shape with virtualization if necessary.

## G2-18-009-091  [P2] GAP  facet F20  effort M
- Legacy: Legacy fetch sequence/ref and cancellation guard prevent stale wrong-course data (`TeacherAttendanceView.jsx:42-99`; `StudentAttendanceView.jsx:19-51`).
- vNext now: New Month URL replacement for learner causes SSR read, staff month is local (`learner-attendance-workspace.tsx:219-264`; `faculty-attendance-workspace.tsx:290-302`).
- Fix: Keep data/URL scope in sync after rapid date/course switches.

## G2-18-009-095  [P2] GAP  facet F21  effort M
- Legacy: Legacy PDF generator browser utility downloadMonthlyAttendancePdf (`TeacherAttendanceView.jsx:11-12,175-185`).
- vNext now: New FacultyReportDownload in-app PDF/export generator (`faculty-attendance-workspace.tsx:596-632`).
- Fix: Compare printable output metadata and filename at runtime; keep browser-only generation.

## G2-19-009-002  [P2] GAP  facet F01  effort M
- Legacy: Old route exposed via Course attendance without a separate REPORT/MARK toggle `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:201-208`
- vNext now: vNext adds Monthly Attendance / Mark attendance segmented toggle `src/components/attendance/faculty-attendance-workspace.tsx:508-518`
- Fix: Match legacy entry/default selection and page shell.

## G2-19-009-003  [P2] GAP  facet F02  effort M
- Legacy: Old buttons share one horizontally aligned div in 50%-width Status column `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:11-16` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-85`
- vNext now: vNext displays two-wide buttons in each flex/list card row `src/components/attendance/faculty-attendance-workspace.tsx:929-955`
- Fix: Use table status column on desktop, retain mobile stacked card.

## G2-19-009-004  [P2] GAP  facet F02  effort M
- Legacy: Old button cells belong to 500px-wide table viewport y=420px `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:342-348`
- vNext now: vNext list renders all learners without fixed table viewport `src/components/attendance/faculty-attendance-workspace.tsx:920-1005`
- Fix: Use legacy table container and scroll where desktop allows.

## G2-19-009-005  [P2] GAP  facet F03  effort S
- Legacy: Old present visual CheckOutlined + P `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:16-26`
- vNext now: vNext full word Present and no CheckOutlined `src/components/attendance/faculty-attendance-workspace.tsx:955-976`
- Fix: Render P plus check icon at desktop, keep full aria label.

## G2-19-009-006  [P2] GAP  facet F03  effort S
- Legacy: Old absent visual CloseOutlined + A `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:27-37`
- vNext now: vNext full word Absent and no CloseOutlined `src/components/attendance/faculty-attendance-workspace.tsx:977-998`
- Fix: Render A plus cross icon at desktop, keep full aria label.

## G2-19-009-007  [P2] GAP  facet F03  effort S
- Legacy: Old active present green-tinted button and absent red-tinted button `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.scss:720-738`
- vNext now: vNext selected present primary and absent danger variants `src/components/attendance/faculty-attendance-workspace.tsx:958-984`
- Fix: Use subtle legacy active fills and colored borders.

## G2-19-009-008  [P2] GAP  facet F03  effort S
- Legacy: Old btn padding6px14px height36 radius8 font13 and gap8 `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.scss:693-710`
- vNext now: vNext min-height 44 mobile and 36 desktop, grid gap token `src/components/attendance/faculty-attendance-workspace.tsx:954-998`
- Fix: Reproduce 36px desktop/8px gap while retaining 44px phone target.

## G2-19-009-013  [P2] GAP  facet F05  effort M
- Legacy: Old search filters joined first_name last_name only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:170-185`
- vNext now: vNext filters displayName and email `src/components/attendance/faculty-attendance-workspace.tsx:280-285`
- Fix: Match old name behavior and document extra email matches.

## G2-19-009-016  [P2] GAP  facet F06  effort M
- Legacy: Old callback receives student record plus `present` or `absent` string `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:19-30`
- vNext now: vNext callback markOne receives membershipId and boolean `src/components/attendance/faculty-attendance-workspace.tsx:968-994` `src/components/attendance/faculty-attendance-workspace.tsx:340-350`
- Fix: Build explicit learner ID to membership ID mapping.

## G2-19-009-026  [P2] GAP  facet F09  effort M
- Legacy: Old modal has per-row count text Mark N absent and M present? `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:396-402`
- vNext now: vNext ConfirmDialog description generated via facultyAttendanceConfirmation `src/components/attendance/faculty-attendance-workspace.tsx:254-258` `src/components/attendance/faculty-attendance-workspace.tsx:1072-1077`
- Fix: Match exact singular/plural confirmation wording.
