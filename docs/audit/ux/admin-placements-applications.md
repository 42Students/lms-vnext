# /admin/placements/applications · UX source review

- **Weakness / baseline:** The application overview is a thin wrapper around the shared scoped directory.
- **Source work / disposition:** Improved shared AdminScopedReadPage filter grid and guarded mobile card links; retained authorized application fields and CSV.
- **States reviewed:** Missing college scope, invalid filters, empty selection, paginated applications and filtered read-only views.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-applications-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
