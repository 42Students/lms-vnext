# Work packet (wave 2): edit src/components/attendance/learner-attendance-workspace.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-18-009-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy learner two cards Attendance this month and Attendance History (`StudentAttendanceView.jsx:96-127`).
- vNext now: New learner five-block disclosures Attendance, Eligibility signal, recovery, Course overview, Session history (`learner-attendance-workspace.tsx:366-521`).
- Fix: Restore old two-card default anatomy and order; extras in secondary extension.

## G2-18-009-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy month nav uses LeftOutlined/RightOutlined icons around flat month picker (`CourseAttendeeHeaderFilters.js:48-87`).
- vNext now: New glyph arrows, labeled native month input (`faculty-attendance-workspace.tsx:541-577`; `learner-attendance-workspace.tsx:302-347`).
- Fix: Restore old month-control iconography/picker density and arrow-month-arrow order.

## G2-18-009-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy learner heading `Attendance this month`, percent or dash, safe/risk recovery guidance, stats Present/Absent/Held (`StudentAttendanceView.jsx:79-117`).
- vNext now: New learner metric disclosure shows Total/Held/Present/Absent/Attendance with short details; recovery isolated in another panel (`learner-attendance-workspace.tsx:366-443`).
- Fix: Move exact primary percentage, safe/risk guidance and three counts into one summary.

## G2-18-009-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy learner history columns Date, Day, Class Start Time, Present/Absent (`StudentAttendanceView.jsx:184-215`).
- vNext now: New Date, Class Start Time, Status, Faculty/location, Day (`learner-attendance-workspace.tsx:537-560`).
- Fix: Restore exact four column headers and order; secondary fields in expanded detail.

## G2-18-009-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy learner date `D MMM YYYY`, day `dddd`, time `h:mm A` (`StudentAttendanceView.jsx:161-173,184-205`).
- vNext now: New dateLabel/timeLabel from IST models and time embedded under Date (`learner-attendance-workspace.tsx:543-556`).
- Fix: Match display strings and placement, verify IST against legacy local browser date.

## G2-18-009-023  [P2] GAP  facet F05  effort S
- Legacy: Legacy course attendance month picker is one selectable `MMMM YYYY`, previous/next arrows (`CourseAttendeeHeaderFilters.js:48-88`).
- vNext now: New faculty native month Input, learner native Input plus extra `This month` (`faculty-attendance-workspace.tsx:541-577`; `learner-attendance-workspace.tsx:302-348`).
- Fix: Match Ant month picker selector and sizes, keep direct month jump.

## G2-18-009-065  [P2] GAP  facet F12  effort M
- Legacy: Legacy learner headroom `canMiss=floor(present/t-held)`, `mustAttend=ceil((t*held-present)/(1-t))`, threshold fallback75 (`attendanceConstants.js:49-61`; `StudentAttendanceView.jsx:85-109`).
- vNext now: New recovery projection and College attendancePolicy threshold (`learner-attendance-workspace.tsx:217-218,435-443`; `learner-service.ts:39-43,101-115`).
- Fix: Compare both formulas including 100% and floating boundary, reuse exact user-facing guidance.

## G2-18-009-078  [P2] GAP  facet F16  effort M
- Legacy: Legacy learner desktop Ant Table vs separate mobile attendance cards (`StudentAttendanceView.jsx:128-179`).
- vNext now: New responsive DataTable mobile-priority cells, not dedicated old cards (`learner-attendance-workspace.tsx:537-560`).
- Fix: Rebuild mobile four-line card with date/day/time/status at phone width.

## G2-18-009-083  [P2] GAP  facet F17  effort S
- Legacy: Legacy learner history dates/status are table cells or mobile cards (`StudentAttendanceView.jsx:128-179`).
- vNext now: New DataTable adapts prioritization but day field lower priority (`learner-attendance-workspace.tsx:537-560`).
- Fix: Ensure Day/Status always visible on phone with same reading order.

## G2-18-009-086  [P2] GAP  facet F18  effort S
- Legacy: Legacy label `Select Class` and `Class Start Time` (`AttendanceReport.js:60-72`; `StudentAttendanceView.jsx:200-205`).
- vNext now: New no staff class select; learner table retains `Class Start Time` (`faculty-attendance-workspace.tsx:494-520`; `learner-attendance-workspace.tsx:548-550`).
- Fix: Restore staff Select Class label with named control.

## G2-18-009-091  [P2] GAP  facet F20  effort M
- Legacy: Legacy fetch sequence/ref and cancellation guard prevent stale wrong-course data (`TeacherAttendanceView.jsx:42-99`; `StudentAttendanceView.jsx:19-51`).
- vNext now: New Month URL replacement for learner causes SSR read, staff month is local (`learner-attendance-workspace.tsx:219-264`; `faculty-attendance-workspace.tsx:290-302`).
- Fix: Keep data/URL scope in sync after rapid date/course switches.

## G2-19-006-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy Attendance in PageShell/ListingPageHeader with compact metric pills `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:342-374`
- vNext now: vNext PageHeader plus separate learner workspace metrics under Disclosure `src/app/(authenticated)/learn/attendance/page.tsx:27-36` `src/components/attendance/learner-attendance-workspace.tsx:366-401`
- Fix: Restore old header/metrics visual hierarchy and compact pills.

## G2-19-006-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy attendance metrics are three inline MetricPills Total/Present/Absent in header `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:345-369`
- vNext now: vNext five metric blocks Total/Held/Present/Absent/Attendance inside Disclosure `src/components/attendance/learner-attendance-workspace.tsx:366-401`
- Fix: Keep three legacy primary metrics and show Held/% as secondary.

## G2-19-006-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy one filter bar Course (book icon) and arrows/month picker `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:387-424`
- vNext now: vNext border section with label Course, date input, This month and history link `src/components/attendance/learner-attendance-workspace.tsx:278-364`
- Fix: Restore icon/inline filter geometry while retaining accessible native month selection.

## G2-19-006-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy one `ln-module-card` encloses table/empty/error `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:425-473`
- vNext now: vNext independent DataTable beneath five other sections `src/components/attendance/learner-attendance-workspace.tsx:445-564`
- Fix: Restore card boundary/padding and keep table near filters.

## G2-19-006-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy metric icons Book/CheckCircle/CloseCircle and teal/green/amber `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:350-368`
- vNext now: vNext plain Metric typography and optional disclosure history `src/components/attendance/learner-attendance-workspace.tsx:132-161` `src/components/attendance/learner-attendance-workspace.tsx:366-401`
- Fix: Render matching colored pills with icons and popovers.

## G2-19-006-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy table Date, Day, Class Start Time, Status `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:311-335`
- vNext now: vNext DataTable Date, Class Start Time, Status, Faculty/location, Day (reordered Day to end) `src/components/attendance/learner-attendance-workspace.tsx:537-559`
- Fix: Match four legacy columns/order; place faculty/location as optional fifth.

## G2-19-006-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy date `YYYY MMMM D` in desktop Date column `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:313-315`
- vNext now: vNext localized `dateLabel()` plus separate time under Date `src/components/attendance/learner-attendance-workspace.tsx:543-547`
- Fix: Use legacy long date format and avoid duplicating time.

## G2-19-006-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy mobile card shows `dddd, MMM D`, time and status `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:52-71`
- vNext now: vNext responsive DataTable priority cells, no dedicated mobile AttendanceListItem `src/components/attendance/learner-attendance-workspace.tsx:537-559`
- Fix: Restore date-title + badge mobile card structure.

## G2-19-006-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy course selected by numeric courseId `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:102-105` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:160-163`
- vNext now: vNext option by UUID deliveryId not courseId, supports same course multiple sections `src/components/attendance/learner-attendance-workspace.tsx:178-197` `src/modules/attendance/learner-service.ts:260-269`
- Fix: Map legacy course selector and subsection disambiguation with stable labels.

## G2-19-006-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy table uses whole month's classes and `pagination={false}` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:450-457`
- vNext now: vNext history table displays monthRows filtered by status/order; no explicit pagination `src/components/attendance/learner-attendance-workspace.tsx:196-206` `src/components/attendance/learner-attendance-workspace.tsx:537-559`
- Fix: Preserve all sessions by default and same chronological sort; compare ordering of returned records.

## G2-19-006-023  [P2] GAP  facet F05  effort M
- Legacy: Legacy month picker AntD DatePicker picker=month display MMMM YYYY `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:408-419`
- vNext now: vNext native input type month `YYYY-MM` visible by browser locale `src/components/attendance/learner-attendance-workspace.tsx:315-329`
- Fix: Match month/year visual text and calendar popup behavior.

## G2-19-006-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy course selection stored Redux selectedCourse; date stored Redux and survives SPA navigation `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:75-105` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:228-269`
- vNext now: vNext stores deliveryId/month as URL params, defaults current month `src/components/attendance/learner-attendance-workspace.tsx:176-197` `src/components/attendance/learner-attendance-workspace.tsx:219-246`
- Fix: Preserve selection across return navigation via URL/back history and selected option.

## G2-19-006-025  [P2] GAP  facet F06  effort S
- Legacy: Legacy month selection cannot be cleared, `allowClear=false`, inputReadOnly `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:408-418`
- vNext now: vNext native type=month with change fallback to current selected month `src/components/attendance/learner-attendance-workspace.tsx:315-329`
- Fix: Ensure clear prevention and keyboard/month-only semantics match.

## G2-19-006-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy Course placeholder Select course, load/not-found variants `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:391-400`
- vNext now: vNext Course Select always enumerates known options, empty state if none `src/components/attendance/learner-attendance-workspace.tsx:266-273` `src/components/attendance/learner-attendance-workspace.tsx:280-300`
- Fix: Match loading/empty/select state copy and disabled behavior.

## G2-19-006-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy Present MetricPill popover `Recent Present Dates` latest 10 with +more `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:190-211` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:355-360`
- vNext now: vNext Metric uses Disclosure `Recent dates (N)` and rows from all recent status dates `src/components/attendance/learner-attendance-workspace.tsx:132-161` `src/components/attendance/learner-attendance-workspace.tsx:208-217`
- Fix: Use popover title, 10-row cap and +N more action.

## G2-19-006-036  [P2] GAP  facet F09  effort M
- Legacy: Legacy Absent MetricPill popover `Absent Dates` all rows `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:213-226` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:362-368`
- vNext now: vNext Metric history Disclosure `Recent dates (N)` `src/components/attendance/learner-attendance-workspace.tsx:154-161` `src/components/attendance/learner-attendance-workspace.tsx:381-386`
- Fix: Restore Absent Dates contextual popover.

## G2-19-006-048  [P2] GAP  facet F13  effort S
- Legacy: Legacy no course chosen shows illustration Select a course and explanatory line `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:274-285`
- vNext now: vNext no authorized deliveries returns No Courses to track yet `src/components/attendance/learner-attendance-workspace.tsx:266-273`
- Fix: Distinguish unloaded/choose-course/no-enrollment states and reproduce art.

## G2-19-006-050  [P2] GAP  facet F13  effort M
- Legacy: Legacy refresh retains previous classes + `Updating attendance...` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:445-448`
- vNext now: vNext URL changes and recalculates selected month, no loading indicator inside existing table `src/components/attendance/learner-attendance-workspace.tsx:219-246` `src/components/attendance/learner-attendance-workspace.tsx:521-537`
- Fix: Show stale-scope refresh status without cross-course data leakage.

## G2-19-006-058  [P2] GAP  facet F16  effort M
- Legacy: Legacy separate desktop AntD Table (`scroll.x=max-content`) and mobile list cards `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:449-469`
- vNext now: vNext one responsive DataTable using mobilePriority columns `src/components/attendance/learner-attendance-workspace.tsx:537-560`
- Fix: Match mobile cards and horizontal desktop table.

## G2-19-006-059  [P2] GAP  facet F16  effort M
- Legacy: Legacy compact header metric pills and filter bar `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:345-425`
- vNext now: vNext stacked Disclosure border sections, multi-grid report `src/components/attendance/learner-attendance-workspace.tsx:275-401`
- Fix: Match at 375/768/1280 widths and reduce vertical scroll.

## G2-19-006-060  [P2] GAP  facet F16  effort M
- Legacy: Legacy mobile attendance list date/status pill separate content `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:52-71`
- vNext now: vNext mobile table Date/Status and extra Faculty/location priorities `src/components/attendance/learner-attendance-workspace.tsx:537-559`
- Fix: Restore day/time/status grouping and touch spacing.

## G2-19-006-062  [P2] GAP  facet F17  effort M
- Legacy: Legacy table aria-busy when loading, explicit TableSkeleton `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:425-438`
- vNext now: vNext no per-table aria-busy during URL navigation `src/components/attendance/learner-attendance-workspace.tsx:521-561`
- Fix: Announce busy/loading and restore focus on updates.

## G2-19-006-063  [P2] GAP  facet F17  effort S
- Legacy: Legacy mobile row StatusCol and date header semantic h3 `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:52-71`
- vNext now: vNext DataTable generic cell strong/span `src/components/attendance/learner-attendance-workspace.tsx:543-559`
- Fix: Ensure mobile status association, headings and screenreader reading order.

## G2-19-006-066  [P2] GAP  facet F18  effort S
- Legacy: Legacy month picker renders `MMMM YYYY` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:408-419`
- vNext now: vNext type month browser locale `YYYY-MM` dependent `src/components/attendance/learner-attendance-workspace.tsx:315-329`
- Fix: Use explicit human label month/year near native input.

## G2-19-006-075  [P2] GAP  facet F21  effort M
- Legacy: Legacy statuses share attendanceConstants with teacher attendance `docs/legacy-source/frontend/src/utils/attendanceConstants.js:18-46`
- vNext now: vNext typed learnerAttendanceStatus and explicit threshold policy `src/modules/attendance/learner-service.ts:247-299` `src/components/attendance/learner-attendance-workspace.tsx:89-113`
- Fix: Reconcile marked vs unmarked/current class attendance statuses across faculty/learner.

## G2-19-006-080  [P2] GAP  facet F23  effort M
- Legacy: Legacy explicit separate mobile list view `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:459-469`
- vNext now: vNext one DataTable responsive renderer `src/components/attendance/learner-attendance-workspace.tsx:537-560`
- Fix: Restore pixel-level mobile card parity.

## G2-5-027-005  [P2] GAP  facet F01  effort M
- Legacy: Legacy mark/unmark absence and overall/per-course percentage in learner controller. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-1003`
- vNext now: vNext separates attendance workspaces, sessions and aggregate summaries. `src/modules/attendance/learner-service.ts:59-125`, `src/components/attendance/learner-attendance-workspace.tsx:34-63`
- Fix: Document faculty attendance writer and per-course percent replacement.

## G2-5-027-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy attendance course dropdown followed by course/date-range records. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:151-265`
- vNext now: vNext attendance workspace shows delivery, period, status and session details in consolidated views. `src/components/attendance/learner-attendance-workspace.tsx:34-64`
- Fix: Match old attendance dropdown/date controls where parity applies.

## G2-5-027-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy attendance course options contain course/class IDs; guarded by canAccessCourse. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:151-234`
- vNext now: vNext displays deliveryId plus courseId/name/code/section/period; old integer course option shape is absent. `src/modules/attendance/learner-service.ts:92-100`, `src/components/attendance/learner-attendance-workspace.tsx:34-41`
- Fix: Show course label and optional class code, map to authorized delivery.
