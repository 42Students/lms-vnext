# /admin/placements/drives · UX source review

- **Weakness / baseline:** All drives used a fixed-width 55rem desktop table that required horizontal scrolling on phones.
- **Source work / disposition:** Converted the directory to responsive shared DataTable with primary title, secondary facts, always-visible Open drive and explicit No drives found empty copy. Added shared Pagination.
- **States reviewed:** No college, invalid filters, no matching drives, bulk action rendering and paginated results.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-drives-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
