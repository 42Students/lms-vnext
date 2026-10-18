# /admin/placements/retention · UX source review

- **Weakness / baseline:** The review-only retention report forced a 44rem-wide table on phones.
- **Source work / disposition:** Converted to responsive DataTable with mobile primary applicant, secondary status/date and always-visible Review link, plus explicit no-applications empty copy.
- **States reviewed:** No college, no applications past 180-day rule, capped 200-row notice and candidate review navigation.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-retention-01`, plus shared-contract assertions where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, phone, desktop, native-app and screen-reader evidence remain pending orchestrator execution.
