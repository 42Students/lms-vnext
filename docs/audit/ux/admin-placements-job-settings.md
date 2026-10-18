# /admin/placements/job-settings · UX source review

- **Weakness / baseline:** This settings index is a read-only scoped directory, not a direct write form.
- **Source work / disposition:** Responsive shared directory filter layout, consistent card actions and distinct empty copy now apply.
- **States reviewed:** Selected college required, invalid filters, empty and paged settings.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-job-settings-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
