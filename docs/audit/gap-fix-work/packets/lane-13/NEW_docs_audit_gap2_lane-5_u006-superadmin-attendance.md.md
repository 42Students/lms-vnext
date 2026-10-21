# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u006-superadmin-attendance.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-5-006-007  [P1] GAP  facet F03 Visible elements  effort M
- Legacy: Two policy inline inputs each with reload/save/default reset (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:156-203)
- vNext now: Two columns numeric inputs and one common Save attendance policy (src/components/admin/super-admin-attendance-settings-editor.tsx:44-65)
- Fix: Restore independent per-field Save/Reload/Reset to default controls.

## G2-5-006-008  [P1] MISSING  facet F03 Visible elements  effort M
- Legacy: Default (24 hours)/Custom for this college tags reveal inherited vs override (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:158-169)
- vNext now: Shows current numbers but not effective default/override provenance (src/components/admin/super-admin-attendance-settings-editor.tsx:44-62)
- Fix: Show per-setting inheritance badge and reset affordance.

## G2-5-006-018  [P1] GAP  facet F05 Tables/lists  effort M
- Legacy: CSV data equals day grid, not per-session status list (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:449-467)
- vNext now: Per-session slash values and Roll column (src/components/attendance/admin-attendance-workspace.tsx:292-320)
- Fix: Match CSV month cell aggregation and column list.

## G2-5-006-023  [P1] GAP  facet F06 Forms  effort M
- Legacy: Separate numeric input min/max, Reset to default on custom (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:173-197)
- vNext now: Shared policy input pair min1/max168 and min1/max100, no Reset control (src/components/admin/super-admin-attendance-settings-editor.tsx:47-65)
- Fix: Support independent change/reset and original spinner inputs.

## G2-5-006-035  [P1] GAP  facet F10 Actions/side effects  effort M
- Legacy: On click GET exact attendance record before correction (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-259)
- vNext now: Opens correction from preloaded grid without dedicated record GET (src/components/attendance/admin-attendance-workspace.tsx:207-218)
- Fix: Revalidate record on open and block stale corrections.

## G2-5-006-036  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: Save/reset app_setting college override through TenantAdminService (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:92-93; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:114-116)
- vNext now: PUT /api/attendance/admin/policy only, no DELETE override (src/components/admin/super-admin-attendance-settings-editor.tsx:35-39)
- Fix: Restore global->org->college setting precedence and override reset.

## G2-5-006-043  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Correction controls present/absent reason per status (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:185-207)
- vNext now: Five statuses selectable at all times (src/components/attendance/admin-attendance-workspace.tsx:644-679)
- Fix: Restore conditional action and legacy allowed reason set.

## G2-5-006-049  [P1] GAP  facet F14 Exports  effort M
- Legacy: No-class CSV cells blank, multi-session ratio (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:460-463)
- vNext now: No-class exports ✖, many session statuses slash separated (src/components/attendance/admin-attendance-workspace.tsx:299-307)
- Fix: Export screen-equivalent N/P/A/ratio and blank no-class cells.

## G2-5-006-066  [P1] GAP  facet F21 Integrations  effort L
- Legacy: Tenant settings app_setting hierarchy via TenantAdminService (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:7-12; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:92-116)
- vNext now: Direct policy-specific API PUT, attendance_policies records (src/components/admin/super-admin-attendance-settings-editor.tsx:35-39)
- Fix: Reconcile source of truth and cross-admin inheritance precedence.

## G2-5-006-068  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Settings stored global/org/college app_setting keys (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:20-24; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:59-74)
- vNext now: Dedicated attendance_policies keyed by college, direct defaults (src/db/schema/attendance.ts:17-60)
- Fix: Migrate effective overrides without losing organization default/reset.
