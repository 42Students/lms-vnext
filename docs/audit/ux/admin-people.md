# /admin/people · UX source review

- **Weakness / baseline:** A scoped People directory already renders a shared DataTable and PeoplePagination.
- **Source work / disposition:** Retained the responsive table/card path with explicit empty copy and scoped directory status; no duplicate client table was added.
- **States reviewed:** Missing scope, no matching records and paginated role-aware records.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-people-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
