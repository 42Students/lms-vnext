# Work packet: edit src/components/admin/super-admin-attendance-settings-editor.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-17-029-015  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:238-258 college attendance threshold 1..100 and correction window 1..8760
- vNext now: vNext super-admin-attendance-settings-editor.tsx:17-27 restricts hours to maxCorrectionHours (default 168)
- Fix: Explain new 168h effective cap vs legacy 8760h and reconcile validated range with policy server and historical UI

## G2-5-006-044  [P1] GAP  facet F12 Business rules  effort M
- Legacy: App_setting override badges and reset distinction (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:128-169)
- vNext now: No stored default flag or override origin in component (src/components/admin/super-admin-attendance-settings-editor.tsx:17-22; src/components/admin/super-admin-attendance-settings-editor.tsx:44-65)
- Fix: Project effective source (global/org/college) and show default vs custom.
