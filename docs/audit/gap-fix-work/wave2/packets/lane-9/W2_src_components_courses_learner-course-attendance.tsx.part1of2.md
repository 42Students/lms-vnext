# Work packet (wave 2): edit src/components/courses/learner-course-attendance.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-16/u009-learner-attendance.md

## G2-13-009-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy section report has toolbar then summary then grid (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:58-99`)
- vNext now: New learner has course title/month toolbar, monthly summary then History grid (`src/components/courses/learner-course-attendance.tsx:249-372`)
- Fix: Align toolbar width, panel boundaries and section order.

## G2-13-009-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy month picker AntD DatePicker `MMMM YYYY` and arrow icons (`docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:60-87`)
- vNext now: New native month input label Month with textual ←/→ (`src/components/courses/learner-course-attendance.tsx:261-320`)
- Fix: Match month picker visual, arrow icon geometry and exact month display.

## G2-13-009-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy month shows only control in right filter column (`docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:48-55`)
- vNext now: New month control grouped with course code/name left (`src/components/courses/learner-course-attendance.tsx:250-321`)
- Fix: Move month controls to legacy right toolbar slot.

## G2-13-009-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy Student summary colored safe/risk based on threshold (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:88-100`)
- vNext now: New summary plain bordered rows, no safe/risk background treatment (`src/components/courses/learner-course-attendance.tsx:325-336`)
- Fix: Restore threshold-dependent banner tone while respecting accessibility.

## G2-13-009-011  [P2] GAP  facet F03  effort S
- Legacy: Legacy student summary labels Present/Absent/Held as small chips (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:112-116`)
- vNext now: New three-column dl numbers and labels (`src/components/courses/learner-course-attendance.tsx:330-335`)
- Fix: Match compact chip treatment and order.

## G2-13-009-016  [P2] GAP  facet F04  effort S
- Legacy: Legacy copy above threshold: You need N%. You can miss X more classes this month (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:103-109`)
- vNext now: New says remain at or above current threshold, no this month wording (`src/components/courses/learner-course-attendance.tsx:218-235`)
- Fix: Restore exact copy and correct month scope.

## G2-13-009-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy below threshold: Below N% requirement...next X classes to recover (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:106-109`)
- vNext now: New says Below N% threshold; attend next X classes to recover (`src/components/courses/learner-course-attendance.tsx:228-234`)
- Fix: Use legacy `requirement` phrasing if policy semantics identical.

## G2-13-009-020  [P2] GAP  facet F04  effort S
- Legacy: Old date uses dayjs D MMM YYYY and h:mm A without year in table header? (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:188-205`)
- vNext now: New Intl `weekday short,day,month,year` and separate time (`src/components/courses/learner-course-attendance.tsx:44-63`)
- Fix: Match legacy date + weekday + time column formatting.

## G2-13-009-021  [P2] GAP  facet F05  effort S
- Legacy: Legacy student Table columns Date, Day, Class Start Time, Present/Absent (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:184-216`)
- vNext now: New five cols Date, Class, Status, Faculty/location, Day (`src/components/courses/learner-course-attendance.tsx:347-372`)
- Fix: Restore four original columns/order as default, put details in expanded view.

## G2-13-009-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy month chosen via AntD read-only DatePicker, arrows (`docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:60-87`)
- vNext now: New native `type=month` editable input (`src/components/courses/learner-course-attendance.tsx:261-302`)
- Fix: Use month-only picker with same accessibility and display format.

## G2-13-009-052  [P2] GAP  facet F13  effort S
- Legacy: Legacy no attendance data for month shows No classes in this period for learner (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:135-142`)
- vNext now: New No classes in this period, Try selecting a different month (`src/components/courses/learner-course-attendance.tsx:341-346`)
- Fix: Keep legacy empty title and optional helper copy.

## G2-13-009-060  [P2] GAP  facet F16  effort M
- Legacy: Legacy student uses desktop AntD table and separate mobile cards (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:128-179`)
- vNext now: New responsive DataTable all widths with mobile priorities (`src/components/courses/learner-course-attendance.tsx:347-372`)
- Fix: Compare 375px card order/shape with legacy custom cards.

## G2-13-009-068  [P2] GAP  facet F18  effort S
- Legacy: Old threshold copy `You need N%. You can miss X more classes this month.` (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:103-108`)
- vNext now: New `remain at or above the current threshold` (`src/components/courses/learner-course-attendance.tsx:224-227`)
- Fix: Use legacy instructional language.

## G2-13-009-072  [P2] GAP  facet F20  effort S
- Legacy: Old native Date JS/month uses local zone, partly dayjs (`docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:18-45`)
- vNext now: New explicitly IST month window but date-shifting uses local Date(year,month) (`src/components/courses/learner-course-attendance.tsx:24-44`)
- Fix: Ensure month navigation at DST/remote timezones can't drift to adjacent IST month.

## G2-16-009-001  [P2] GAP  facet F01  effort M
- Legacy: StudentAttendanceView.jsx:11-19 Redux selected attendeeCurMonth.
- vNext now: learner-course-attendance.tsx:139-149 month query props.
- Fix: Preserve selected-month course tab contract.

## G2-16-009-003  [P2] GAP  facet F01  effort M
- Legacy: StudentAttendanceView.jsx:118-127 history right-aligned month.
- vNext now: learner-course-attendance.tsx:249-323 adds course code/title/month navigator before summary.
- Fix: Align month selector and history metadata with original.

## G2-16-009-004  [P2] GAP  facet F02  effort M
- Legacy: StudentAttendanceView.jsx:98-117 tinted safe/risk/neutral card, primary percent and three stats in right column.
- vNext now: learner-course-attendance.tsx:325-336 neutral stacked border section.
- Fix: Restore tinted two-column summary card.

## G2-16-009-005  [P2] GAP  facet F02  effort M
- Legacy: StudentAttendanceView.jsx:118-180 history bordered card with header and inner table.
- vNext now: learner-course-attendance.tsx:337-373 plain header and table.
- Fix: Restore bordered Attendance History card.

## G2-16-009-006  [P2] GAP  facet F02  effort M
- Legacy: StudentAttendanceView.jsx:128-179 distinct desktop table and mobile cards.
- vNext now: learner-course-attendance.tsx:347-372 one DataTable with mobile priorities.
- Fix: Restore mobile date/day/time/status cards.

## G2-16-009-007  [P2] GAP  facet F03  effort S
- Legacy: StudentAttendanceView.jsx:53-57 centered large loading Spin.
- vNext now: learner-course-attendance.tsx:139-198 server provided records, no local spinner.
- Fix: Create attendance-specific loading fallback.

## G2-16-009-010  [P2] GAP  facet F04  effort S
- Legacy: StudentAttendanceView.jsx:184-216 columns Date/Day/Class Start Time/Present-Absent.
- vNext now: learner-course-attendance.tsx:352-371 Date/Class/Status/Faculty-location/Day.
- Fix: Restore four columns, labels and ordering.

## G2-16-009-011  [P2] GAP  facet F04  effort S
- Legacy: StudentAttendanceView.jsx:190,197,205 exact D MMM YYYY, dddd, h:mm A separately.
- vNext now: learner-course-attendance.tsx:45-64,353-356 date includes weekday/time combined.
- Fix: Separate date/day/time and preserve IST formatting.

## G2-16-009-012  [P2] GAP  facet F04  effort S
- Legacy: StudentAttendanceView.jsx:209-214 uses StatusCol statusClass and label.
- vNext now: learner-course-attendance.tsx:363-366 generic StatusBadge with enum text.
- Fix: Map present/absent/pending/future wording and tone.

## G2-16-009-018  [P2] GAP  facet F05  effort S
- Legacy: StudentAttendanceView.jsx:89-94 policy threshold from response with fallback default.
- vNext now: learner-course-attendance.tsx:207-213 reads workspace policy without fallback.
- Fix: Fallback on missing/invalid threshold.

## G2-16-009-019  [P2] GAP  facet F06  effort M
- Legacy: StudentAttendanceView.jsx:19-51 new month refetch aborts/ignores stale response.
- vNext now: learner-course-attendance.tsx:150-162 URL navigation triggers server refresh.
- Fix: Preserve month-loading and stale-state protection.

## G2-16-009-028  [P2] GAP  facet F10  effort L
- Legacy: StudentAttendanceView.jsx:23-51 getStudentAttendanceListByDaterange GET with user/course/month.
- vNext now: learner-course-attendance.tsx:139-196 parent-loaded attendance workspace.
- Fix: Audit normalized status/absence data contract and monthly query.

## G2-16-009-035  [P2] GAP  facet F13  effort M
- Legacy: StudentAttendanceView.jsx:53-59 centered Spin while fetch.
- vNext now: learner-course-attendance.tsx:139-196 no component loading state.
- Fix: Add local spinner/skeleton.

## G2-16-009-040  [P2] GAP  facet F16  effort M
- Legacy: StudentAttendanceView.jsx:128-179 mobile card grid distinct from desktop.
- vNext now: learner-course-attendance.tsx:347-372 DataTable mobile-priority columns.
- Fix: Restore exact mobile card date/day/time/status.

## G2-16-009-041  [P2] GAP  facet F16  effort M
- Legacy: StudentAttendanceView.jsx:98-117 colored summary horizontal.
- vNext now: learner-course-attendance.tsx:325-335 neutral vertical summary.
- Fix: Match risk/safe/neutral and responsive card alignment.

## G2-16-009-044  [P2] GAP  facet F17  effort S
- Legacy: StudentAttendanceView.jsx:66-67 Retry keyboard button.
- vNext now: learner-course-attendance.tsx:198-205 no localized Retry.
- Fix: Restore focusable Retry.

## G2-16-009-049  [P2] GAP  facet F19  effort M
- Legacy: StudentAttendanceView.jsx:19-51 GET one bounded month at a time.
- vNext now: learner-course-attendance.tsx:169-196 filters possibly all records client-side.
- Fix: Bound attendance fetch for large histories.

## G2-16-009-051  [P2] GAP  facet F20  effort M
- Legacy: StudentAttendanceView.jsx:20,39,43,47,50 cancelled prevents late response overwrite.
- vNext now: learner-course-attendance.tsx:150-162 URL refresh with navigation races possible.
- Fix: Verify stale transition cancellation.

## G2-16-009-052  [P2] GAP  facet F20  effort M
- Legacy: StudentAttendanceView.jsx:78-84 uses current time to derive future class state.
- vNext now: learner-course-attendance.tsx:193-196 relies on server stored status.
- Fix: Ensure status updates on day transition.

## G2-16-009-053  [P2] GAP  facet F21  effort L
- Legacy: StudentAttendanceView.jsx:1,37 Spring attendance endpoint.
- vNext now: learner-course-attendance.tsx:15-19 vNext learner-service Postgres.
- Fix: Compare old payload classes/absentids fields to new normalized rows.

## G2-16-009-054  [P2] GAP  facet F22  effort L
- Legacy: StudentAttendanceView.jsx:24-29 numeric course ID, date ranges, classes/absentids.
- vNext now: learner-course-attendance.tsx:169-196 UUID delivery, stored session statuses.
- Fix: Reconcile schedule/cancelled/unmarked and timezone mapping.

## G2-16-009-056  [P2] GAP  facet F23  effort L
- Legacy: StudentAttendanceView.jsx:98-180 tinted summary + bordered history + mobile card variant.
- vNext now: learner-course-attendance.tsx:239-374 generic sections, DataTable and no localized retry.
- Fix: Restore all UI/UX and error state parity.

## G2-13-009-066  [P3] GAP  facet F18  effort S
- Legacy: Old learner Attendance History subheading Review each scheduled class and your status for it (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:119-123`)
- vNext now: New separates title and description but identical words (`src/components/courses/learner-course-attendance.tsx:337-340`)
- Fix: Match heading typography (h3 vs description).

## G2-16-009-002  [P3] GAP  facet F01  effort S
- Legacy: StudentAttendanceView.jsx:98-118 summary starts directly, no intro.
- vNext now: learner-course-attendance.tsx:239-247 adds intro.
- Fix: Remove/move extra visible intro.

## G2-16-009-013  [P3] GAP  facet F04  effort S
- Legacy: StudentAttendanceView.jsx:124-126 history card displays MMMM YYYY.
- vNext now: learner-course-attendance.tsx:273-300 native YYYY-MM picker elsewhere.
- Fix: Include long-readable month in history header.

## G2-16-009-031  [P3] GAP  facet F11  effort S
- Legacy: StudentAttendanceView.jsx:30-34 absent course shows no-query state.
- vNext now: learner-course-attendance.tsx:198-205 shows No attendance data.
- Fix: Show class/course scope unavailable guidance.
