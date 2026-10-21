# Work packet (wave 2): edit src/components/admin/super-admin-attendance-settings-editor.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-5-006-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Read/write policy fields inline in Card size small (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:475-486)
- vNext now: Collapsed Attendance policy disclosure and nested section heading (src/app/(authenticated)/admin/attendance/page.tsx:142-146; src/components/admin/super-admin-attendance-settings-editor.tsx:44-65)
- Fix: Make policy card inline with same small-card padding.

## G2-5-006-026  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Policy load/save/reset errors use backend message/fallback (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:75-79; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:91-103)
- vNext now: Any failed PUT generic Attendance settings could not be saved. Try again. (src/components/admin/super-admin-attendance-settings-editor.tsx:31-42; src/components/admin/super-admin-attendance-settings-editor.tsx:65-70)
- Fix: Surface per-setting backend validation and recoverable Retry.

## G2-5-006-028  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: On policy save toast `${label} updated`, failure toast Failed to save label (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:95-99)
- vNext now: Inline Attendance settings saved. or generic error (src/components/admin/super-admin-attendance-settings-editor.tsx:39-42; src/components/admin/super-admin-attendance-settings-editor.tsx:65)
- Fix: Use per-setting transient toast with legacy copy.

## G2-5-006-062  [P2] GAP  facet F19 Performance  effort M
- Legacy: Policy field independently GETs settings with Retry reload (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:59-79)
- vNext now: Whole settings in options GET; no independent reload (src/app/(authenticated)/admin/attendance/page.tsx:68-72; src/components/admin/super-admin-attendance-settings-editor.tsx:44-65)
- Fix: Support per-policy refetch to resolve partial failure.
