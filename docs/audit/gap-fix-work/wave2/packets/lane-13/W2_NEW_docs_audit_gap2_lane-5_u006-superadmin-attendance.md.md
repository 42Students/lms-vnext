# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u006-superadmin-attendance.md

27 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-5-006-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: SuperAdminLayout and group academic SuperAdminGroupShell (docs/legacy-source/frontend/src/pages/superadmin/attendance.js:3-5; docs/legacy-source/frontend/src/pages/superadmin/attendance.js:24-32)
- vNext now: Standalone PageHeader Attendance with AdminAttendanceWorkspace; no grouped shell on route (src/app/(authenticated)/admin/attendance/page.tsx:132-149)
- Fix: Restore Academic Setup grouped tab shell and active attendance item.

## G2-5-006-002  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: No college selected inline AntD Alert warning only (docs/legacy-source/frontend/src/pages/superadmin/attendance.js:10-21)
- vNext now: PageHeader plus EmptyState (src/app/(authenticated)/admin/attendance/page.tsx:40-53)
- Fix: Use legacy warning Alert in module canvas rather than empty navigation view.

## G2-5-006-005  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Legacy ln-module then admin-list-page header (docs/legacy-source/frontend/src/pages/superadmin/attendance.js:24-28; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:469-475)
- vNext now: Space-y-6 page wrapper and PageHeader (src/app/(authenticated)/admin/attendance/page.tsx:132-137)
- Fix: Match canvas maxwidth, margins, admin-list-page header text metrics.

## G2-5-006-012  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Weekday first-row header; second numeric date row; Student column (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:160-180)
- vNext now: Single date cell with weekday secondary text and Learner field (src/components/attendance/admin-attendance-workspace.tsx:481-515)
- Fix: Recreate two-tier weekday/day grid header.

## G2-5-006-014  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Monthly percent main metric; held/absences/not-marked counters (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:135-140)
- vNext now: Definition-list stats incl active days and enrollment (src/components/attendance/admin-attendance-workspace.tsx:438-465)
- Fix: Match exact summary format and conditional Not marked counter.

## G2-5-006-019  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: Calendar grid caption and learner row headers (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:150-178)
- vNext now: Table caption but learner body td (src/components/attendance/admin-attendance-workspace.tsx:477-515)
- Fix: Use th scope=row for learner, restore header semantics.

## G2-5-006-020  [P2] GAP  facet F06 Forms  effort M
- Legacy: Class/Course searchable AntD Select, 220px, class course dependent (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:497-513)
- vNext now: Native select controls, options from courseSectionDeliveries (src/components/attendance/admin-attendance-workspace.tsx:335-366)
- Fix: Restore searchable selection, typed lookup and 220px compact layout.

## G2-5-006-021  [P2] GAP  facet F06 Forms  effort S
- Legacy: Previous/next month arrow buttons, centered MMMM YYYY (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:518-521)
- vNext now: Previous/Next textual buttons plus month input (src/components/attendance/admin-attendance-workspace.tsx:392-410)
- Fix: Use arrow icon only with aria labels.

## G2-5-006-027  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: No class/course empty vs unavailable options differentiated (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:534-539)
- vNext now: Additional empty variants but no loading failures (src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Keep legacy empty copy and explicit unsafe verification state.

## G2-5-006-029  [P2] MISSING  facet F08 Success/toasts  effort S
- Legacy: Reset toast `${label} reset to default` (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:117-121)
- vNext now: Reset action absent, therefore reset feedback absent (src/components/admin/super-admin-attendance-settings-editor.tsx:44-73)
- Fix: Restore reset and named success toast.

## G2-5-006-030  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Attendance correction success and error toast (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:89-96)
- vNext now: Persistent info notice and inline error (src/components/attendance/admin-attendance-workspace.tsx:278-288)
- Fix: Render legacy transient correction feedback.

## G2-5-006-031  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Single-session correction and chooser centered Modal (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:221-275)
- vNext now: Side Drawer correction and chooser (src/components/attendance/admin-attendance-workspace.tsx:621-769)
- Fix: Use Modal, exact title and conditional one action.

## G2-5-006-033  [P2] MISSING  facet F09 Modals/drawers  effort S
- Legacy: Reset to default no secondary confirmation (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:193-197)
- vNext now: No reset flow (src/components/admin/super-admin-attendance-settings-editor.tsx:44-73)
- Fix: Provide reset with expected toast and default badge.

## G2-5-006-048  [P2] GAP  facet F14 Exports  effort S
- Legacy: CSV attendance-class-CLASS-course-COURSE-MONTH.csv with Student/date columns (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:447-467)
- vNext now: attendance-sectionCode-courseCode-month.csv plus Roll and Attendance % (src/components/attendance/admin-attendance-workspace.tsx:292-320)
- Fix: Match exact filename and headers.

## G2-5-006-050  [P2] GAP  facet F14 Exports  effort S
- Legacy: Export disabled when no data, adjacent month selectors (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:521)
- vNext now: Export displayed inside grid summary only (src/components/attendance/admin-attendance-workspace.tsx:437-473)
- Fix: Keep disabled button visible within filters.

## G2-5-006-054  [P2] GAP  facet F16 Responsive  effort S
- Legacy: Month grid horizontally scrollable with compact day columns (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:157-180)
- vNext now: Date columns min-w16 and padded cells (src/components/attendance/admin-attendance-workspace.tsx:477-500)
- Fix: Match compact cell dimensions and scroll.

## G2-5-006-055  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Grid caption and row+column scope semantics (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:159-180)
- vNext now: Learner column td not th scope=row (src/components/attendance/admin-attendance-workspace.tsx:477-515)
- Fix: Restore row header semantics and two header rows.

## G2-5-006-056  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Policy help via InfoCircle tooltip, Reload icon aria-label (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:139-150)
- vNext now: Helper description inline, no Reload controls (src/components/admin/super-admin-attendance-settings-editor.tsx:47-60)
- Fix: Use tooltip help with keyboard focus plus Reload aria.

## G2-5-006-057  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Cell accessible names identify learner, date/status (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-205)
- vNext now: Multi-session cell announces only session count (src/components/attendance/admin-attendance-workspace.tsx:539-547)
- Fix: Expose ratio and learner in per-cell accessible name.

## G2-5-006-058  [P2] GAP  facet F18 Wording  effort S
- Legacy: Review monthly attendance by class and course, correct recent records, and export the same grid shown on screen. (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:472-474)
- vNext now: Scoped attendance oversight for college name. (src/app/(authenticated)/admin/attendance/page.tsx:135-136)
- Fix: Restore exact legacy subtitle.

## G2-5-006-059  [P2] GAP  facet F18 Wording  effort S
- Legacy: Late marking allowed for, Minimum attendance, Save, Reset to default (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:138-168)
- vNext now: Same first two labels, single Save attendance policy, no reset (src/components/admin/super-admin-attendance-settings-editor.tsx:47-69)
- Fix: Match individual policy control copy and actions.

## G2-5-006-065  [P2] GAP  facet F20 Concurrency/time  effort S
- Legacy: Save/reset actionRef lock blocks duplicate settings writes (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:86-126)
- vNext now: Saving state prevents repeat save, no reset available (src/components/admin/super-admin-attendance-settings-editor.tsx:15-43)
- Fix: Keep lock across separate Save and Reset endpoints.

## G2-5-006-010  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: Show all college courses link conditional after verification (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:514-517)
- vNext now: Persistent checkbox for all courses (src/components/attendance/admin-attendance-workspace.tsx:379-391)
- Fix: Use link toggling exact two labels.

## G2-5-006-015  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: Student label single name (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:170-178)
- vNext now: Learner cell with roll/email fallback secondary (src/components/attendance/admin-attendance-workspace.tsx:503-525)
- Fix: Match student-name-only row with any new data after approval.

## G2-5-006-046  [P3] GAP  facet F13 States  effort S
- Legacy: No-college alert Select a college to continue and exact description (docs/legacy-source/frontend/src/pages/superadmin/attendance.js:10-21)
- vNext now: Same title/description but EmptyState + extra PageHeader (src/app/(authenticated)/admin/attendance/page.tsx:40-53)
- Fix: Use warning Alert with legacy icon/spacing.

## G2-5-006-047  [P3] GAP  facet F13 States  effort S
- Legacy: Pick a class and course to view attendance (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:534-539)
- vNext now: Select a class and course variant with other empty conditions (src/components/attendance/admin-attendance-workspace.tsx:414-435)
- Fix: Use exact legacy empty text.

## G2-5-006-060  [P3] GAP  facet F18 Wording  effort S
- Legacy: Only courses taught to this class / Show all college courses (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:514-517)
- vNext now: Checkbox includes including courses not taught... (src/components/attendance/admin-attendance-workspace.tsx:379-390)
- Fix: Restore exact link wording.
