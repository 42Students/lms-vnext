# /admin/placements/jobs/[jobId]/settings · UX source review

- **Weakness / baseline:** This drive configuration view already distinguishes editable/published from read-only archived states.
- **Source work / disposition:** Kept drive status, deadline, duplicate/archive actions, registered posting details and safety-scoped tab navigation.
- **States reviewed:** Draft/published/archived status, optional posting terms and action availability.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-jobs-jobId-settings-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
