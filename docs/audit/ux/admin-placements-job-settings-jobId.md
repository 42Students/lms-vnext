# /admin/placements/job-settings/[jobId] · UX source review

- **Weakness / baseline:** Job-settings facts are rendered through a shared detail view.
- **Source work / disposition:** Shared detail navigation now meets phone touch/focus criteria while retaining read-only status.
- **States reviewed:** Inaccessible setting not-found, lifecycle status, recorded facts and return path.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-job-settings-jobId-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
