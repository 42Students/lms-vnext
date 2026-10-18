# /tpo/settings/blocked-dates — UX rollout

- **Review:** Promoted the settings page title to the shared semantic h1 PageHeader without changing legacy copy.
- **Unchanged:** The existing authorization scope, server-side data, exact legacy labels, empty-state wording, export/redirect behavior and component contracts are preserved.
- **States:** Audited current loading, empty and guarded-action presentation in source; changes were limited to existing navigation, hierarchy or touch affordances.
- **Regression:** `UX-tpo-tpo-settings-blocked-dates-01` in `tests/unit/chat2-ux-tpo-requests-settings-a.test.ts`.
- **Validation:** Source-only; TypeScript, Vitest, keyboard, narrow viewport and mobile WebView evidence are pending. Leave the master checklist unticked until tests pass.
