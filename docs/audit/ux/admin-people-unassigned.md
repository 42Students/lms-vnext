# /admin/people/unassigned · UX source review

- **Weakness / baseline:** The global identity list must not reveal scoped member contacts or imply missing memberships are errors.
- **Source work / disposition:** Kept the selected-scope guard, anonymous contact policy, filter controls, and no-matching-users EmptyState.
- **States reviewed:** Disallowed scope, invalid filters, empty identities and paginated global records.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-people-unassigned-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
