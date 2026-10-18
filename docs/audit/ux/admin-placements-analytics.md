# /admin/placements/analytics · UX source review

- **Weakness / baseline:** The analytic report is information-dense and uses a wide company table; the funnel already supplies numeric text equivalents.
- **Source work / disposition:** Retained the original KPI and funnel wording, date filters and CSV export. Table responsiveness and footer-summary alignment remain an outstanding page-specific item.
- **States reviewed:** Invalid date/filter alert, empty report, bounded 5,000-row notice and status/metrics.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-analytics-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
