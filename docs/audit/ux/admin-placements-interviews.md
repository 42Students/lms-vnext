# /admin/placements/interviews · UX source review

- **Weakness / baseline:** The interviews index is a shared read-only directory, distinct from each drive's appointment editor.
- **Source work / disposition:** Improved shared filter and navigation touch targets while preserving the recorded-round terminology.
- **States reviewed:** No scope, invalid filters, missing rows and paginated round statuses.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-interviews-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
