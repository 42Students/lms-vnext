# /admin/placements/jobs/[jobId]/schedule · UX source review

- **Weakness / baseline:** Persisted rounds used a fixed 48rem-wide table and small controls unsuitable for 320px.
- **Source work / disposition:** Converted rounds to shared responsive DataTable and Pagination, preserved original Round/Time/Venue/Mode/Status/Candidate slots labels and appointment editor.
- **States reviewed:** Invalid query, zero rounds, empty later page, paginated round/appointment listings.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-jobs-jobId-schedule-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
