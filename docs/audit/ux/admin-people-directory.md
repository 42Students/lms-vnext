# /admin/people/directory · UX source review

- **Weakness / baseline:** People Directory already uses responsive membership cards, tabs and status filters.
- **Source work / disposition:** Kept deep links and scope-sensitive redaction; preserved exact People Directory wording and URL filter contract.
- **States reviewed:** Invalid filters, empty directory and paginated membership records.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-people-directory-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
