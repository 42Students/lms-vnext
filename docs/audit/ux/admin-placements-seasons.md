# /admin/placements/seasons · UX source review

- **Weakness / baseline:** The placement-season registry uses the existing shared scoped directory.
- **Source work / disposition:** Shared filter grid, phone cards, scoped statuses and pagination apply; retained active/closed wording.
- **States reviewed:** No college selected, invalid query, no seasons and paginated season results.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-seasons-01`, plus shared-contract assertions where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, phone, desktop, native-app and screen-reader evidence remain pending orchestrator execution.
