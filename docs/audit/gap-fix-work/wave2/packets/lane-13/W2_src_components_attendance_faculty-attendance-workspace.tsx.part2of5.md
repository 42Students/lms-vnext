# Work packet (wave 2): edit src/components/attendance/faculty-attendance-workspace.tsx (part 2 of 5)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-17/attendance-name-with-dp.md, docs/audit/gap2/lane-18/course-attendance-report.md

## G2-14-009-069  [P2] GAP  facet F18  effort S
- Legacy: First table column says Student Name `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:297-301`
- vNext now: New says Learner `src/components/attendance/faculty-attendance-workspace.tsx:687-691`
- Fix: Use exact column text

## G2-14-009-070  [P2] GAP  facet F18  effort S
- Legacy: Status legend has chips with P A dash cross `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:231-236`
- vNext now: Single paragraph adds S and x/y `src/components/attendance/faculty-attendance-workspace.tsx:793-795`
- Fix: Keep exact four chip texts and order

## G2-14-009-074  [P2] GAP  facet F20  effort M
- Legacy: Legacy uses local dayjs start/end date query `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:53-60`
- vNext now: Month key and group dates explicitly Asia/Kolkata `src/modules/attendance/faculty-grid-model.ts:24-54` `src/components/attendance/faculty-attendance-workspace.tsx:159-161`
- Fix: Test midnight and month-boundary equivalence

## G2-14-009-076  [P2] GAP  facet F20  effort M
- Legacy: Legacy partial save retries failed learners only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548`
- vNext now: New atomic PATCH has version token and reload guidance `src/components/attendance/faculty-attendance-workspace.tsx:420-436` `src/modules/attendance/faculty-service.ts:550-570`
- Fix: Document retry/idempotency semantics

## G2-15-009-004  [P2] GAP  facet F02  effort M
- Legacy: Attendance Session/date/time/Ready to mark/Schedule Class then 3 counters (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:263-313`)
- vNext now: Date/select/detail first; no analogous panel header and counters (`src/components/attendance/faculty-attendance-workspace.tsx:797-872`)
- Fix: Restore legacy header sections/counter order

## G2-15-009-005  [P2] GAP  facet F02  effort M
- Legacy: Search and bulk bar, 2-column table, count hint and submit footer (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:314-363`)
- vNext now: Search and bulk bar, stacked roster list and sticky footer (`src/components/attendance/faculty-attendance-workspace.tsx:872-1051`)
- Fix: Recreate legacy table/order and footer placements

## G2-15-009-006  [P2] GAP  facet F02  effort M
- Legacy: mt-3 take-attendance-panel content shell (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:263-278`)
- vNext now: Extra PageHeader and bordered section separators (`src/components/attendance/faculty-attendance-workspace.tsx:495-520`)
- Fix: Match source panel canvas/padding/borders and title position

## G2-15-009-007  [P2] GAP  facet F03  effort S
- Legacy: Attendance Session date ddd D MMM YYYY, hh:mm A range, Ready to mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:281-297`)
- vNext now: Session title, en-IN date, submitted/correction explanatory text (`src/components/attendance/faculty-attendance-workspace.tsx:844-867`)
- Fix: Show exact date/time and Ready to mark chip in panel header

## G2-15-009-009  [P2] GAP  facet F03  effort M
- Legacy: Two icon controls with P/ A glyphs and att-btn--active styling (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:16-37`)
- vNext now: Full-word Present/Absent buttons with primary/danger variants (`src/components/attendance/faculty-attendance-workspace.tsx:954-999`)
- Fix: Restore two compact icon plus letter toggles with active styling

## G2-15-009-010  [P2] GAP  facet F03  effort S
- Legacy: Three counters Students, Present, Absent (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:309-313`)
- vNext now: Only absent/present hint near submit (`src/components/attendance/faculty-attendance-workspace.tsx:1025-1034`)
- Fix: Add three-counter strip above tools in old order

## G2-15-009-013  [P2] GAP  facet F04  effort M
- Legacy: Student name first_name + last_name; blank if missing (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:5-14`)
- vNext now: displayName/email/Learner UUID prefix fallback (`src/components/attendance/faculty-attendance-workspace.tsx:97-103`)
- Fix: Replicate legacy name fields or define explicit transformed equivalent

## G2-15-009-015  [P2] GAP  facet F04  effort S
- Legacy: Dates dayjs local calendar display; time hh:mm A (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:97-99`)
- vNext now: Explicit Asia/Kolkata en-IN medium date/time style (`src/components/attendance/faculty-attendance-workspace.tsx:105-117`)
- Fix: Match legacy visible date/time strings in IST; test overnight

## G2-15-009-018  [P2] GAP  facet F05  effort M
- Legacy: Table headers Student Name and Status, widths 50% each, no sorting (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-93`)
- vNext now: Divided ul cards without headers/equal-width columns (`src/components/attendance/faculty-attendance-workspace.tsx:917-1005`)
- Fix: Use two-column legacy table and unsorted rows

## G2-15-009-019  [P2] GAP  facet F05  effort M
- Legacy: Ant table scroll x=500px y=420px; pagination=false (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:342-348`)
- vNext now: Fully expanded ul with no 420px scroll window (`src/components/attendance/faculty-attendance-workspace.tsx:917-1005`)
- Fix: Restore fixed roster scrolling and horizontal overflow

## G2-15-009-020  [P2] GAP  facet F05  effort S
- Legacy: Name-only case-insensitive trimmed search (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:170-199`)
- vNext now: Filters displayName and email (`src/components/attendance/faculty-attendance-workspace.tsx:280-288`)
- Fix: Search only legacy-equivalent student name

## G2-15-009-023  [P2] GAP  facet F06  effort M
- Legacy: DatePicker Date required, defaults selected takeAttendanceDate (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:111-130`)
- vNext now: No standalone date field, datetime-local starts/ends empty (`src/components/attendance/faculty-attendance-workspace.tsx:1229-1251`)
- Fix: Restore date picker preselected from attendance date

## G2-15-009-024  [P2] GAP  facet F06  effort S
- Legacy: Start Time 12h TimePicker required (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:131-147`)
- vNext now: Native datetime-local required (`src/components/attendance/faculty-attendance-workspace.tsx:1229-1239`)
- Fix: Restore time-only Ant-style 12h control

## G2-15-009-025  [P2] GAP  facet F06  effort S
- Legacy: End Time 12h TimePicker and max12h overnight validation (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:148-179`)
- vNext now: Native datetime-local; backend handles range validation (`src/components/attendance/faculty-attendance-workspace.tsx:1241-1251`)
- Fix: Match end time control and frontend validation

## G2-15-009-026  [P2] MISSING  facet F06  effort S
- Legacy: Disabled Course input shows selectedCourse.name (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:180-185`)
- vNext now: Only course described, no disabled Course field (`src/components/attendance/faculty-attendance-workspace.tsx:1180-1273`)
- Fix: Show disabled Course input with selected course

## G2-15-009-040  [P2] GAP  facet F09  effort S
- Legacy: Submit Attendance Modal counts, Confirm/Cancel, disabled while saving (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:376-412`)
- vNext now: ConfirmDialog summary and pending state with different shell (`src/components/attendance/faculty-attendance-workspace.tsx:1072-1083`)
- Fix: Match modal spacing/buttons/count grammar and pending dismissal

## G2-15-009-041  [P2] GAP  facet F09  effort S
- Legacy: Modal shows Attendance was only partially saved/Attendance was not saved on error (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:402-409`)
- vNext now: Error outside modal after request (`src/components/attendance/faculty-attendance-workspace.tsx:1052-1065`)
- Fix: Display failure at confirmation locus, respecting atomic semantics

## G2-15-009-060  [P2] GAP  facet F13  effort S
- Legacy: Empty No class scheduled for this date plus Schedule Class button (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:364-373`)
- vNext now: EmptyState same title but extra description, action only in header (`src/components/attendance/faculty-attendance-workspace.tsx:801-805`)
- Fix: Restore schedule action inside empty state and old illustration

## G2-15-009-067  [P2] GAP  facet F16  effort M
- Legacy: Old Ant Table x500/y420 scroll, fixed 2 columns (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:342-348`)
- vNext now: New flex list stacks on phones and grows full height (`src/components/attendance/faculty-attendance-workspace.tsx:917-1005`)
- Fix: Clone tablet/phone overflow and row density with accessible 44px targets

## G2-15-009-068  [P2] GAP  facet F16  effort M
- Legacy: Old right DrawerWidget footer and bottom actions (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:70-98`)
- vNext now: New Drawer responsive button stack/form grid (`src/components/attendance/faculty-attendance-workspace.tsx:1180-1213`)
- Fix: Match drawer width, footer and responsive alignment live

## G2-15-009-072  [P2] GAP  facet F18  effort S
- Legacy: Old headings Student Name, Status (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:75-83`)
- vNext now: No headings in ul list (`src/components/attendance/faculty-attendance-workspace.tsx:917-1005`)
- Fix: Recreate exact headers

## G2-15-009-073  [P2] GAP  facet F18  effort S
- Legacy: Loading schedules… / Schedules unavailable / Select Schedule / No classes scheduled (`docs/legacy-source/frontend/src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js:148-159`)
- vNext now: Only No classes scheduled option (`src/components/attendance/faculty-attendance-workspace.tsx:818-842`)
- Fix: Use all stateful placeholder strings

## G2-15-009-074  [P2] GAP  facet F18  effort S
- Legacy: Segmented label Attendance report (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-83`)
- vNext now: New Monthly Attendance mode label (`src/components/attendance/faculty-attendance-workspace.tsx:508-513`)
- Fix: Rename mode to Attendance report

## G2-15-009-077  [P2] GAP  facet F19  effort M
- Legacy: All learners unpaginated inside 420px scroll viewport (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:342-348`)
- vNext now: All learners unpaginated and unbounded ul (`src/components/attendance/faculty-attendance-workspace.tsx:917-1005`)
- Fix: Restore bounded scroll while keeping no pagination

## G2-17-009-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-84 — `Student Name` attendance table column uses NameWithDp.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:925-954 — Student row appears inside marking list and in monthly table.
- Fix: Retain Student Name column/label semantics where applicable.

## G2-17-009-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:6-14 — Wrapper class `take-attendance-std-wrapper`, no avatar currently.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:934-950 — Display name within grouped row with control buttons.
- Fix: Match wrapper spacing within legacy table context.

## G2-17-009-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:13 — Order first_name then last_name; filter false-like missing entries and join one space.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:97-101 — Uses displayName.trim, then email, then Learner UUID prefix fallback.
- Fix: Preserve given name/surname source and join order where actual fields exist.

## G2-17-009-010  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-84 — Name component is cell of table with Student Name header.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:925-954 — Marking list uses label+controls rather than same table cell.
- Fix: Align roster row/table relationship and dense spacing.

## G2-17-009-011  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:176-199 — Name search compares concatenated first+last case insensitive.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:283-286 — Search concatenates displayName and email.
- Fix: Match name-only search behavior or make extra email search explicit.

## G2-17-009-012  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:186-199 — Visible list follows original roster order; NameWithDp doesn't independently sort.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:217-235 — Full learners array sorted by learnerName for another view.
- Fix: Define exact default row ordering across marking/monthly views.

## G2-17-009-032  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:176-199 — Name filter trim/lowercase; uses first and last separately.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:283-286 — Search includes email and displayName; whitespace handling may differ.
- Fix: Test Unicode, accents, case normalization and combined names.

## G2-18-009-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy shared AttendanceReport mounted inside selected Course Attendance tab, conditional on FACULTY/ADMIN/SUPER_ADMIN vs learner (`AttendanceReport.js:12-20,44-99`).
- vNext now: New learner standalone `/learn/attendance`; faculty separate `FacultyAttendanceWorkspace` in course detail (`learn/attendance/page.tsx:13-36`; `faculty-attendance-workspace.tsx:141-153`).
- Fix: Preserve nested course-tab entry with role-specific viewer and correct active tab.

## G2-18-009-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy one page-head subtitle, toolbar left class select+segmented, right month/day filters, then summary and grid (`AttendanceReport.js:44-99`; `TeacherAttendanceView.jsx:188-249`).
- vNext now: New faculty PageHeader with Schedule Class action, segmented below header, separate filter+summary strips+grid (`faculty-attendance-workspace.tsx:494-635,678-797`).
- Fix: Match old toolbar and card section sequence, inline mode control.

## G2-18-009-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy faculty Monthly class health summary has main percentage and right 3–4 stat chips (`TeacherAttendanceView.jsx:188-210`).
- vNext now: New separate summary with extra status badges, Session/Mark counts, SummaryStrip six metrics and risk section (`faculty-attendance-workspace.tsx:524-675`).
- Fix: Use old summary card anatomy/stat chip spacing; advanced guidance below fold.

## G2-18-009-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy teacher Monthly Attendance grid is always expanded (`TeacherAttendanceView.jsx:212-249`).
- vNext now: New faculty grid appears below large risk panel and summary strip (`faculty-attendance-workspace.tsx:635-797`).
- Fix: Move monthly grid directly beneath summary within old frame.

## G2-18-009-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy month nav uses LeftOutlined/RightOutlined icons around flat month picker (`CourseAttendeeHeaderFilters.js:48-87`).
- vNext now: New glyph arrows, labeled native month input (`faculty-attendance-workspace.tsx:541-577`; `learner-attendance-workspace.tsx:302-347`).
- Fix: Restore old month-control iconography/picker density and arrow-month-arrow order.
