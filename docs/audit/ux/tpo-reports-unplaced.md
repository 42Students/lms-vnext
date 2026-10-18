# /tpo/reports/unplaced — UX rollout

- **Review:** Replaced blank report-filter loading state with shared accessible form skeleton; Raised existing 40px targets to 44px where present.
- **Unchanged:** The existing authorization scope, server-side data, exact legacy labels, empty-state wording, export/redirect behavior and component contracts are preserved.
- **States:** Audited current loading, empty and guarded-action presentation in source; an accessible shared loading placeholder was added.
- **Regression:** `UX-tpo-tpo-reports-unplaced-01` in `tests/unit/chat2-ux-tpo-report-pages.test.ts`.
- **Validation:** Source-only; TypeScript, Vitest, keyboard, narrow viewport and mobile WebView evidence are pending. Leave the master checklist unticked until tests pass.
