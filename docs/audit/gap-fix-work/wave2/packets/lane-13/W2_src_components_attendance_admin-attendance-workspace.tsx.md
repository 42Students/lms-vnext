# Work packet (wave 2): edit src/components/attendance/admin-attendance-workspace.tsx

38 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md, docs/audit/gap2/lane-5/u009-attendance-shared-component.md

## G2-5-001-003  [P2] GAP  facet F02 Layout and section order  effort M
- Legacy: Order: title/subtitle, policy card, errors, filters, health summary, monthly grid; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:469-538,127-149
- vNext now: PageHeader, four navigation tabs, filter form, health summary, grid, retroactive-window disclosure, parent contact editor; src/app/(authenticated)/college/attendance/page.tsx:119-137; src/components/attendance/admin-attendance-workspace.tsx:324-438,595-619
- Fix: Use legacy section order; put read-only policy information before class/course/month filters and do not relocate policy to a lower disclosure.

## G2-5-001-004  [P2] GAP  facet F02 Layout and section order  effort M
- Legacy: Attendance summary is framed as 'Monthly class health' with prominent % then stat line; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:128-140
- vNext now: Monthly class health is eyebrow, section/course heading, multi-column definition list; src/components/attendance/admin-attendance-workspace.tsx:438-466
- Fix: Reproduce the legacy primary-percentage hierarchy and stats row.

## G2-5-001-005  [P2] GAP  facet F02 Layout and section order  effort S
- Legacy: Monthly Attendance grid has dedicated header, 'Review attendance day by day...' explanation, active-day and month metadata; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:142-149
- vNext now: Grid starts directly with Table; active days sits in summary metrics; src/components/attendance/admin-attendance-workspace.tsx:463-479
- Fix: Restore grid header/meta and explanatory line above the table.

## G2-5-001-007  [P2] GAP  facet F03 Every visible element  effort S
- Legacy: One line action 'Show all college courses'/'Only courses taught to this class' appears only after class-course verification; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:514-517
- vNext now: Persistent 'Show all college courses (including courses not taught to this class)' checkbox; src/components/attendance/admin-attendance-workspace.tsx:379-391
- Fix: Replace checkbox with conditional verified-source toggle and exact switch wording.

## G2-5-001-009  [P2] GAP  facet F04 Data shown/formatting  effort S
- Legacy: Class label is name/class_name/className, '[Elective]' prefix becomes '(elective)'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:329-337
- vNext now: Class option displays sectionName · sectionCode, elective marker only in course dropdown; src/components/attendance/admin-attendance-workspace.tsx:342-360
- Fix: Use legacy class option naming and elective handling; retain code only if separately required.

## G2-5-001-010  [P2] GAP  facet F04 Data shown/formatting  effort M
- Legacy: Course dropdown label is course_name or Course id; assignment labels include ' · Sem N' and ' · past'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:338-339,375-396
- vNext now: Course option prints code · name with optional '(elective)'/'(not taught to this class)'; term is separate picker; src/components/attendance/admin-attendance-workspace.tsx:356-375
- Fix: Preserve assignment course label, semester and active/past suffix as applicable.

## G2-5-001-013  [P2] GAP  facet F04 Data shown/formatting  effort M
- Legacy: Grid uses weekday initial on one header row, numeric date on second; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:160-172
- vNext now: Single header cell stacks full date number and weekday initial, extra n sessions; src/components/attendance/admin-attendance-workspace.tsx:481-500
- Fix: Restore legacy two-row weekday/date header and corner cells.

## G2-5-001-018  [P2] GAP  facet F06 Forms  effort M
- Legacy: Class and course searchable AntD Select with explicit placeholder and 220px widths; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-513
- vNext now: Native Select controls with visible Class/Course labels, full width; src/components/attendance/admin-attendance-workspace.tsx:335-366
- Fix: Implement searchable equivalent with legacy placeholders and compact widths.

## G2-5-001-021  [P2] GAP  facet F06 Forms  effort M
- Legacy: No View attendance submit; filter changes fetch automatically; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:414-444,497-513
- vNext now: Form requires pressing View attendance to commit class/course selections; src/components/attendance/admin-attendance-workspace.tsx:328-332,376-378
- Fix: Fetch automatically upon class/course/month selection or clearly preserve intended legacy zero-submit flow.

## G2-5-001-025  [P2] GAP  facet F07 Validation and errors  effort S
- Legacy: Correction failure toast default 'Attendance correction failed. Retry without closing this record.'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:93-96
- vNext now: Inline text from FriendlyFetchError, 409 refresh directive, fallback 'Check your connection and retry.'; src/components/attendance/admin-attendance-workspace.tsx:281-286,731-737
- Fix: Align fallback wording and retain server error, with concurrency-specific 409 handling as vNext addition.

## G2-5-001-026  [P2] GAP  facet F08 Success/info/confirmation/toasts  effort S
- Legacy: Successful correction uses antd message.success and interpolation of formatted session label; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:89-92
- vNext now: Info Alert remains at top, uses session.title rather than legacy sessionLabel time; src/components/attendance/admin-attendance-workspace.tsx:278-280,324-327
- Fix: Use transient success toast, legacy session label including local time, rather than persistent info notice.

## G2-5-001-028  [P2] GAP  facet F09 Modals/drawers/popovers  effort M
- Legacy: Multiple-session chooser is centered Modal 'Choose a session — [student]', has informational paragraph; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:221-237
- vNext now: Session chooser is Drawer 'Choose attendance session' with student description, no exact paragraph; src/components/attendance/admin-attendance-workspace.tsx:742-769
- Fix: Use modal, exact title and per-session warning sentence.

## G2-5-001-029  [P2] GAP  facet F09 Modals/drawers/popovers  effort M
- Legacy: Record details appear in centered Modal with 'Session', 'Current state', conditional 'Marked by/at'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:239-264
- vNext now: Side Drawer always shows Marked by/at, explanatory Faculty window and potential Note; src/components/attendance/admin-attendance-workspace.tsx:621-741
- Fix: Match modal presentation and conditionally show audit metadata only when absent.

## G2-5-001-039  [P2] GAP  facet F12 Business rules and formulas  effort M
- Legacy: Legacy session is held if startTime missing or startTime<=now; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:21-26
- vNext now: Requires startsAt<=loadedAt and filters by session.status; src/components/attendance/admin-attendance-workspace.tsx:220-238
- Fix: Define behavior for missing-start historical records and refresh held state if page remains open across start time.

## G2-5-001-042  [P2] GAP  facet F13 Empty/loading/error/offline/session  effort S
- Legacy: Initial state 'Pick a class and course to view attendance'; empty data 'No attendance data for this class, course and month'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:122-125,534-539
- vNext now: EmptyState alternatives 'Select a class and course', 'No assigned class courses', 'No active learners', 'No attendance data for this month'; src/components/attendance/admin-attendance-workspace.tsx:414-435
- Fix: Use exact legacy initial/data-empty language; keep newer more specific states only if intentionally approved.

## G2-5-001-045  [P2] GAP  facet F14 Export/import/upload  effort S
- Legacy: CSV filename attendance-class-[class]-course-[course]-YYYY-MM.csv, Student + numeric date columns; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:447-467
- vNext now: CSV attendance-[sectionCode]-[courseCode]-[month].csv, Learner/Roll/dates/Attendance %; src/components/attendance/admin-attendance-workspace.tsx:292-320
- Fix: Restore exact filename and column headers/order; only extend columns under explicit product decision.

## G2-5-001-047  [P2] GAP  facet F14 Export/import/upload  effort S
- Legacy: Export CSV disabled when no absentees, button adjacent month; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-521
- vNext now: Export CSV button appears only inside data summary; src/components/attendance/admin-attendance-workspace.tsx:437-473
- Fix: Place export next to month filter and maintain disabled rather than hidden state.

## G2-5-001-051  [P2] GAP  facet F16 Responsive/mobile  effort M
- Legacy: Grid has one compact cell per calendar day, wide month table; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:157-172
- vNext now: Table uses min-w-16 date cells and px-3/py-3 body; src/components/attendance/admin-attendance-workspace.tsx:485-495,527-534
- Fix: Align day widths and row heights to legacy grid CSS and confirm horizontal overflow on phone.

## G2-5-001-052  [P2] GAP  facet F17 Keyboard/focus/screen readers  effort S
- Legacy: Legacy grid caption 'Attendance by student and day...' and scope=col/row; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:159-171,178-180
- vNext now: vNext Table caption, th for learner but body learner is td; src/components/attendance/admin-attendance-workspace.tsx:477-484,503-515
- Fix: Use scope=row for learner names and maintain separate weekday/day column headers.

## G2-5-001-053  [P2] GAP  facet F17 Keyboard/focus/screen readers  effort S
- Legacy: Legacy day buttons' accessible labels announce present/absent and student; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-205
- vNext now: Multi-session button label announces count only; single includes state and time; src/components/attendance/admin-attendance-workspace.tsx:539-547
- Fix: Announce aggregate attended/marked ratio in multi-session cell accessible name.

## G2-5-001-054  [P2] GAP  facet F17 Keyboard/focus/screen readers  effort S
- Legacy: Legend identifies codes P/A/N/X and ratio; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:150-156
- vNext now: Legend is single paragraph at bottom with P/A/E/M/L/—/S; src/components/attendance/admin-attendance-workspace.tsx:589-591
- Fix: Place legacy legend before grid and preserve distinction between N and no-class.

## G2-5-001-057  [P2] GAP  facet F18 Wording vs legacy copy  effort S
- Legacy: Legacy chooser 'Choose a session — [student]' and 'Only the session you open will be corrected'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:221-224
- vNext now: Drawer 'Choose attendance session' and no warning; src/components/attendance/admin-attendance-workspace.tsx:742-748
- Fix: Restore exact title and helper text.

## G2-5-006-004  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Header; policy card; option warnings; filters; monthly grid (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:469-487)
- vNext now: Header; workspace filters/grid; policy editor disclosure at bottom (src/app/(authenticated)/admin/attendance/page.tsx:132-147; src/components/attendance/admin-attendance-workspace.tsx:324-439)
- Fix: Move policy card above selectors, always visible.

## G2-5-006-009  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Compact selectors, arrow icons, month label and CSV action in one row (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-521)
- vNext now: Full-width labels, native month input, CSV action with grid (src/components/attendance/admin-attendance-workspace.tsx:335-410; src/components/attendance/admin-attendance-workspace.tsx:437-473)
- Fix: Restore compact single toolbar layout and CSV placement.

## G2-5-006-011  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Legend ahead of grid and monthly class health heading (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:142-158)
- vNext now: Legend below table and stats in different hierarchy (src/components/attendance/admin-attendance-workspace.tsx:438-479; src/components/attendance/admin-attendance-workspace.tsx:589-591)
- Fix: Restore legend and heading positions.

## G2-5-006-016  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Unmarked N vs no-class X distinguished (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- vNext now: Uses — and S alongside extra E/M/L states (src/components/attendance/admin-attendance-workspace.tsx:527-552; src/components/attendance/admin-attendance-workspace.tsx:589-591)
- Fix: Preserve old code legend N/X and state meaning.

## G2-5-006-022  [P2] GAP  facet F06 Forms  effort M
- Legacy: Class and course selection fetch automatically (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-513)
- vNext now: View attendance GET form submit (src/components/attendance/admin-attendance-workspace.tsx:324-332; src/components/attendance/admin-attendance-workspace.tsx:376-378)
- Fix: Auto-refetch grid as soon as selectors change.

## G2-5-006-045  [P2] GAP  facet F13 States  effort M
- Legacy: Loading monthly attendance skeleton 8x8 plus refreshing notice (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:523-538)
- vNext now: No equivalent in route component (src/app/(authenticated)/admin/attendance/page.tsx:68-92; src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Create scoped skeleton, stale-refresh info and retry.

## G2-5-006-053  [P2] GAP  facet F16 Responsive  effort M
- Legacy: ln-module 220px filters wrap; 31-day horizontal grid (docs/legacy-source/frontend/src/pages/superadmin/attendance.js:12-28; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-521)
- vNext now: Modern max-width wrappers and full-width selects (src/app/(authenticated)/admin/attendance/page.tsx:132-147; src/components/attendance/admin-attendance-workspace.tsx:324-410)
- Fix: Match 220px select/wrap across 375/768/1280.

## G2-5-009-002  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: Exact title Attendance and long review subtitle (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:469-475)
- vNext now: Outer PageHeader emits different description; workspace lacks title (src/app/(authenticated)/college/attendance/page.tsx:119-137; src/components/attendance/admin-attendance-workspace.tsx:324-333)
- Fix: Use exact title/subtitle once, avoid duplicate headings.

## G2-5-009-006  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Single flex toolbar class/course/month arrows/Export CSV (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-522)
- vNext now: Form grid controls, month input, export in summary section (src/components/attendance/admin-attendance-workspace.tsx:324-410; src/components/attendance/admin-attendance-workspace.tsx:437-473)
- Fix: Restore single horizontal toolbar with 12px gaps.

## G2-5-009-007  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Monthly class health heading + legend above grid (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:142-158)
- vNext now: Stats above, legend after grid, grid heading missing (src/components/attendance/admin-attendance-workspace.tsx:438-479; src/components/attendance/admin-attendance-workspace.tsx:589-591)
- Fix: Restore header, meta and legend above table.

## G2-5-009-026  [P2] GAP  facet F06 Forms  effort M
- Legacy: Any selection auto-loads grid, no View button (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:414-444)
- vNext now: Submit View attendance required (src/components/attendance/admin-attendance-workspace.tsx:324-333; src/components/attendance/admin-attendance-workspace.tsx:376-378)
- Fix: Trigger GET immediately for class/course/month changes.

## G2-5-001-006  [P3] GAP  facet F03 Every visible element  effort S
- Legacy: Month navigation icon-only LeftOutlined and RightOutlined; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-520
- vNext now: Buttons rendered with visible Previous and Next text; src/components/attendance/admin-attendance-workspace.tsx:392-404
- Fix: Match arrow-icon controls while retaining aria-labels.

## G2-5-001-008  [P3] GAP  facet F03 Every visible element  effort S
- Legacy: Summary labels include 'Students', 'Sessions held', 'Absences', conditional 'Not marked'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:135-140
- vNext now: Labels generally match, but Not marked always shown and Active days inline; src/components/attendance/admin-attendance-workspace.tsx:458-465
- Fix: Conditionally show Not marked and move Active days into grid header.

## G2-5-001-027  [P3] GAP  facet F08 Success/info/confirmation/toasts  effort S
- Legacy: Success and errors emitted as transient antd message; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:89-95
- vNext now: Correction uses persistent notice and inline error, no toast lifetime; src/components/attendance/admin-attendance-workspace.tsx:148-150,281-288,326
- Fix: Restore toast placement/lifetime; verify browser legacy AntD default duration (UNKNOWN until live check).

## G2-5-001-056  [P3] GAP  facet F18 Wording vs legacy copy  effort S
- Legacy: Legacy filter toggle label 'Only courses taught to this class'; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:514-517
- vNext now: vNext unchecked checkbox wording includes '(including courses not taught to this class)'; src/components/attendance/admin-attendance-workspace.tsx:379-390
- Fix: Use two legacy phrases matched to toggle state.

## G2-5-009-027  [P3] GAP  facet F06 Forms  effort S
- Legacy: Month default current browser month, navigable indefinitely (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:296; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-520)
- vNext now: Month default Asia/Kolkata; month input additional (src/app/(authenticated)/college/attendance/page.tsx:18-24; src/components/attendance/admin-attendance-workspace.tsx:392-410)
- Fix: Match visible month but retain timezone-correct IST.
