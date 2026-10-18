# /admin/lessons · UX source review

- **Weakness / baseline:** Lessons are browsable by course and cohort with existing authoring entry points and a page-size limit.
- **Source work / disposition:** Retained SuperAdminLessonBulkVisibility and offering links, scoped filters and the exact Lessons heading. No page-specific wording edits.
- **States reviewed:** Invalid query, no college scope, no matching lessons, active/archived authoring states.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-lessons-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
