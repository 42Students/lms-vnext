# /admin/placements/hiring · UX source review

- **Weakness / baseline:** The persisted hiring overview is rendered through the shared directory instead of an invented conversion funnel.
- **Source work / disposition:** Shared filter grid and mobile card/action changes apply. Kept counts limited to job-level persisted applications.
- **States reviewed:** No scope, invalid filters, empty jobs and paginated job-level counts.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-hiring-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
