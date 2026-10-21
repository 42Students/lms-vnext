# Work packet (wave 2): edit src/components/attendance/faculty-attendance-workspace.tsx (part 4 of 5)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md, docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-17/attendance-name-with-dp.md, docs/audit/gap2/lane-18/course-attendance-report.md

## G2-19-009-036  [P2] GAP  facet F13  effort M
- Legacy: Old load/empty schedule/errored roster distinct `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:268-277` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:364-373`
- vNext now: vNext list empty `No learners match this search` `src/components/attendance/faculty-attendance-workspace.tsx:920-924`
- Fix: Separate no schedule, no learners, zero search matches and error.

## G2-19-009-042  [P2] GAP  facet F16  effort S
- Legacy: Old buttons min-height36 desktop `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.scss:697-710`
- vNext now: vNext touch min-height44 mobile and 36 md `src/components/attendance/faculty-attendance-workspace.tsx:954-979`
- Fix: Keep 44px touch target but align 36px dense desktop glyph pair.

## G2-19-009-043  [P2] GAP  facet F16  effort M
- Legacy: Old status inside table 50% column `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-85`
- vNext now: vNext card list with contact details and grouped controls `src/components/attendance/faculty-attendance-workspace.tsx:933-999`
- Fix: Restore breakpoint-specific desktop table cell and mobile card.

## G2-19-009-047  [P2] GAP  facet F18  effort S
- Legacy: Old literal visual P and A `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:25-36`
- vNext now: vNext literal Present and Absent `src/components/attendance/faculty-attendance-workspace.tsx:975-998`
- Fix: Use legacy compact copy at desktop.

## G2-19-009-050  [P2] GAP  facet F19  effort M
- Legacy: Old table scroll vertical 420 and no paging `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:342-348`
- vNext now: vNext list entire roster with no fixed height `src/components/attendance/faculty-attendance-workspace.tsx:920-1005`
- Fix: Match visible row density and scroll affordance; optionally virtualize huge rosters.

## G2-19-009-052  [P2] GAP  facet F20  effort M
- Legacy: Old unsaved flag blocks route navigation and window unload `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:49-71`
- vNext now: vNext unsavedMarks + confirmDiscardMarks scoped to internal view `src/components/attendance/faculty-attendance-workspace.tsx:259-270`
- Fix: Test Next router/back/unload dirty handling and match confirm wording.

## G2-19-009-053  [P2] GAP  facet F21  effort M
- Legacy: Old AntD icons and Redux, caller's attendanceServices `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:1-6` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:8-15`
- vNext now: vNext shared Button and TypeScript server service `src/components/attendance/faculty-attendance-workspace.tsx:15-26` `src/modules/attendance/faculty-service.ts:451-459`
- Fix: Map callback and API boundary in migration plan.

## G2-2-027-002  [P2] GAP  facet F01  effort M
- Legacy: TakeAttendance.js:201-270 embeds marking in legacy course attendance tab.
- vNext now: faculty-attendance-workspace.tsx:494-517 has REPORT/MARK segmented view in unified faculty attendance workspace.
- Fix: Clone tab switch, section spacing and entry positions while retaining new routing.

## G2-2-027-003  [P2] GAP  facet F01  effort M
- Legacy: TakeAttendance.js:275-305 shows session date/time and `Ready to mark`.
- vNext now: faculty-attendance-workspace.tsx:844-867 shows session title/time/location, marked/unmarked and marking-window states.
- Fix: Restore legacy session head layout and explicit status placement; show blocking policy warning separately.

## G2-2-027-004  [P2] GAP  facet F02  effort M
- Legacy: TakeAttendance.js:278-312 uses take-attendance-panel with header, summary, search/tools, table and sticky submit.
- vNext now: faculty-attendance-workspace.tsx:807-875 places date/session selector in responsive 2-column grid; controls and list at :872-1051.
- Fix: Clone legacy header-to-roster spacing, visual section order and summary strip geometry.

## G2-2-027-005  [P2] GAP  facet F02  effort S
- Legacy: TakeAttendance.js:305-343 renders 3-item `Students/Present/Absent` summary and bulk actions above table.
- vNext now: faculty-attendance-workspace.tsx:872-915 has actions above roster but counts mainly in sticky footer :1025-1034.
- Fix: Add exact three-stat horizontal summary before tools; retain useful footer summary.

## G2-2-027-006  [P2] GAP  facet F02  effort M
- Legacy: TakeAttendance.js:343-347 Ant Table class `ln-table ln-table-filter px-0`, scroll x500 y420.
- vNext now: faculty-attendance-workspace.tsx:917-1006 renders HTML `<ul>` with bordered flex rows; no x500/y420 table.
- Fix: Recreate compact table header/column widths/scroll viewport, responsive list fallback only at narrow widths.

## G2-2-027-007  [P2] GAP  facet F02  effort S
- Legacy: TakeAttendance.js:377-412 uses centered antd Modal `ln-confirm-modal-root`.
- vNext now: faculty-attendance-workspace.tsx:1072-1083 uses shared ConfirmDialog.
- Fix: Tune shared ConfirmDialog sizing, overlay, footer and focus to old modal footprint.

## G2-2-027-008  [P2] GAP  facet F03  effort M
- Legacy: TakeAttendance.js:74-89 has columns `Student Name`/`Status`, each width 50%.
- vNext now: faculty-attendance-workspace.tsx:926-999 renders learner text block and two Present/Absent buttons, no table header.
- Fix: Restore visible header labels and 50:50 column proportions for desktop.

## G2-2-027-009  [P2] GAP  facet F03  effort M
- Legacy: TakeAttendance.js:9-10 imports NameWithDp and AbsentPresntBtnCol.
- vNext now: faculty-attendance-workspace.tsx:937-998 renders text/roll/contact plus native button group.
- Fix: Map legacy portrait avatar initials/photo, button color/placement and dense row sizing.

## G2-2-027-017  [P2] GAP  facet F05  effort M
- Legacy: TakeAttendance.js:74-89 roster columns exactly `Student Name` and `Status`.
- vNext now: faculty-attendance-workspace.tsx:917-1006 row list includes name, roll, email, phone, button group.
- Fix: Align desktop table header and content density with old while masking contact when not essential.

## G2-2-027-018  [P2] GAP  facet F05  effort M
- Legacy: TakeAttendance.js:340-347 Table has pagination=false, scrolling 420px vertically.
- vNext now: faculty-attendance-workspace.tsx:926-1005 maps entire `visibleRoster` to list, no bounded scroll.
- Fix: Restore fixed-height roster scroll and sticky row header; avoid 1000 DOM items without virtualization.

## G2-2-027-023  [P2] GAP  facet F06  effort M
- Legacy: AttendanceBulkController.java:73-79 `reason` optional, default `Mark Absent` in :127-133.
- vNext now: faculty-service.ts:69-75 `correctionReason` max500 optional, `faculty-attendance-workspace.tsx:1008-1018` required on corrections.
- Fix: Preserve first-submission reason/default and distinguish it from mandatory correction explanation.

## G2-2-027-024  [P2] GAP  facet F06  effort S
- Legacy: TakeAttendance.js:318-340 `Mark all present` / `Mark all absent` are never gated by time.
- vNext now: faculty-attendance-workspace.tsx:883-912 disables those actions if markingWindow !== OPEN.
- Fix: Document deliberate policy change; match legacy visual disabled state only if owner wants parity.

## G2-2-027-038  [P2] GAP  facet F09  effort S
- Legacy: TakeAttendance.js:402-408 has inline warning `Attendance was only partially saved` for partial.
- vNext now: faculty-attendance-workspace.tsx:1052-1064 shows `No attendance marks were saved...` with reload.
- Fix: Replace partial banner only if atomic saves intentionally differ; show exact failure variant.

## G2-2-027-039  [P2] GAP  facet F09  effort M
- Legacy: TakeAttendance.js:50-70 browser beforeunload and Router routeChangeStart discard prompt.
- vNext now: faculty-attendance-workspace.tsx:259-270 registers beforeunload; :267-270 uses confirmDiscardMarks for mode selection.
- Fix: Cover all navigation/path changes with accessible discard overlay; preserve unsaved marks through cancel.

## G2-2-027-066  [P2] GAP  facet F16  effort M
- Legacy: TakeAttendance.js:343-347 roster table x500px/y420px scrolling.
- vNext now: faculty-attendance-workspace.tsx:917-1006 responsive list with full-width buttons on mobile.
- Fix: Match legacy scroll/density desktop and validate tablet/phone field order.

## G2-2-027-080  [P2] GAP  facet F19  effort M
- Legacy: TakeAttendance.js:343-348 bounds table vertical scroll at 420px.
- vNext now: faculty-attendance-workspace.tsx:926-1005 renders every visible list item eagerly.
- Fix: Virtualize or paginate for 500–1000 rows while matching legacy bounded list.

## G2-2-027-085  [P2] GAP  facet F20  effort M
- Legacy: ClassSchedule.java:24-27 start/end stored as strings and old page formats via dayjs :97-98.
- vNext now: faculty-attendance-workspace.tsx:105-120 formats stored timestamps in Asia/Kolkata.
- Fix: Verify import offsetless legacy start/end in IST and crossing-midnight edge.

## G2-14-009-012  [P3] GAP  facet F03  effort S
- Legacy: Sunday header and cells have Sunday class and line `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:280-288` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:305-311`
- vNext now: No Sunday-specific column treatment `src/components/attendance/faculty-attendance-workspace.tsx:686-716`
- Fix: Add Sunday separator and text style

## G2-14-009-027  [P3] GAP  facet F06  effort S
- Legacy: Previous and next arrows use Ant chevrons and 36px icon targets `docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.js:60-87` `docs/legacy-source/frontend/src/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters.module.scss:13-37`
- vNext now: Arrows are textual glyphs in secondary buttons `src/components/attendance/faculty-attendance-workspace.tsx:542-576`
- Fix: Use chevron icons with 36px targets and old focus style

## G2-14-009-039  [P3] GAP  facet F09  effort S
- Legacy: Mode switch dirty-state native confirmation uses exact discard question `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:23-28` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-83`
- vNext now: Shared confirmation dialog same title plus Discard changes `src/components/attendance/faculty-attendance-workspace.tsx:267-270` `src/components/attendance/faculty-attendance-workspace.tsx:1275-1282`
- Fix: Keep question and use old modal spacing

## G2-15-009-008  [P3] GAP  facet F03  effort S
- Legacy: Schedule Class button in session panel header (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:302-306`)
- vNext now: Schedule Class in PageHeader (`src/components/attendance/faculty-attendance-workspace.tsx:498-503`)
- Fix: Relocate action to match old session header

## G2-15-009-011  [P3] GAP  facet F03  effort S
- Legacy: Search prefix SearchOutlined and allowClear (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:315-324`)
- vNext now: Same placeholder without icon/clear (`src/components/attendance/faculty-attendance-workspace.tsx:873-881`)
- Fix: Restore search magnifier and clear affordance

## G2-15-009-028  [P3] GAP  facet F06  effort S
- Legacy: Submit label Schedule and primary Cancel in drawer (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:72-96`)
- vNext now: Submit Schedule Class; Cancel secondary (`src/components/attendance/faculty-attendance-workspace.tsx:1187-1205`)
- Fix: Match old footer labels/order and 2 states

## G2-15-009-029  [P3] GAP  facet F06  effort S
- Legacy: Ant form vertical and autoComplete off (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:99-114`)
- vNext now: Native form with responsive two-column layout (`src/components/attendance/faculty-attendance-workspace.tsx:1209-1273`)
- Fix: Match vertical form, label heights, autocomplete off

## G2-15-009-070  [P3] GAP  facet F17  effort S
- Legacy: Old schedule select aria label varies for loading/error/empty (`docs/legacy-source/frontend/src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js:141-165`)
- vNext now: New explicit label and No classes option only (`src/components/attendance/faculty-attendance-workspace.tsx:815-840`)
- Fix: Announce loading/unavailable states and preserve keyboard selection

## G2-17-009-009  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:13 — Does not trim nonempty first_name/last_name before join.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:97-101 — Trims displayName.
- Fix: Specify whitespace-normalisation parity for imported names.

## G2-17-009-026  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:6-14 — One wrapper div, no mobile-specific logic; parent handles scroll.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:925-954 — Responsive flex/grid row and actions.
- Fix: Compare mobile truncation/wrap with legacy table in browser.

## G2-17-009-029  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:75 — Column heading `Student Name`.
- vNext now: src/components/attendance/faculty-attendance-workspace.tsx:689-690 — Monthly table label `Learner`; marking uses displayed name without `Student Name` header.
- Fix: Adopt role-specific legacy column label on marking table.

## G2-18-009-009  [P3] GAP  facet F03  effort S
- Legacy: Legacy teacher segment labels `Attendance report`, `Mark attendance` (`AttendanceReport.js:75-85`).
- vNext now: New first label `Monthly Attendance`, second `Mark attendance` (`faculty-attendance-workspace.tsx:508-517`).
- Fix: Change REPORT tab literal to `Attendance report`.

## G2-18-009-027  [P3] GAP  facet F05  effort S
- Legacy: Legacy mark search `Find a student by name`, match first/last name, clear icon (`TakeAttendance.js:169-199,314-324`).
- vNext now: New same placeholder, filters `${displayName} ${email}`, no explicit allowClear icon (`faculty-attendance-workspace.tsx:280-288,872-881`).
- Fix: Keep name match primary, add allowClear icon, avoid email-based hits unless approved.

## G2-18-009-048  [P3] GAP  facet F09  effort M
- Legacy: Legacy Schedule Class opened via ScheduleClassDrawer from Mark panel (`TakeAttendance.js:203-262,302-306`).
- vNext now: New Schedule Class Drawer opened from PageHeader even in Report (`faculty-attendance-workspace.tsx:498-503,1180-1274`).
- Fix: Keep Mark-panel trigger and match old placement and drawer fields.

## G2-18-009-071  [P3] GAP  facet F13  effort S
- Legacy: Legacy teacher empty `No attendance data for this month` (`TeacherAttendanceView.jsx:129-131`).
- vNext now: New `No scheduled classes this month` (`faculty-attendance-workspace.tsx:678-683`).
- Fix: Differentiate no API result versus no scheduled classes and match wording.

## G2-18-009-085  [P3] GAP  facet F18  effort S
- Legacy: Legacy faculty `Attendance report` vs new `Monthly Attendance` segment (`AttendanceReport.js:79-82`; `faculty-attendance-workspace.tsx:508-517`).
- vNext now: New segment misses exact phrase (`faculty-attendance-workspace.tsx:508-517`).
- Fix: Use `Attendance report` literal.
