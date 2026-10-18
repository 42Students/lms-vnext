# /admin/placements/jobs/[jobId]/applications · UX source review

- **Weakness / baseline:** The restricted/read-only application register used a desktop table even when actions were unavailable.
- **Source work / disposition:** Converted the fallback register to shared mobile DataTable with explicit empty copy; retained CollegeApplicationPipelineControls for writable state.
- **States reviewed:** Invalid filters, authorized scoped applications, disabled-pipeline notice and filtered empty state.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-jobs-jobId-applications-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
