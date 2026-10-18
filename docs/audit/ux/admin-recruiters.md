# UX review — `/admin/recruiters`

- **Lane / slice:** chat-9, route 100 of 111 (last third).
- **Observed / addressed:** Verified canonical redirect/delegated shared surface; no duplicated forms, role checks or route branches introduced.
- **Responsive and accessibility:** State behavior remains with the imported shared component or redirect. Existing scoped, denied, empty and error fallbacks are kept.
- **Legacy wording:** Titles, action copy, tab order and tenant boundaries unchanged. No feature removal.
- **Regression:** `tests/unit/ux-admin-chat9-batch-03.test.ts` case `UX-admin-recruiters-01`.
- **Verification:** Source test authored; typecheck, lint, Vitest and browser/device checks pending orchestrator. Checkbox remains open until tests pass.

## Round 9: Super Admin legacy heading parity

- Shared `SuperAdminHrAccounts` page heading restored to **Recruiter accounts**, exactly the label of the Placements tab and the prior legacy-copy test contract.
- Existing scoped list, account lifecycle controls, responsive DataTable, dialogs, and accessible controls were retained.
- Regression: `tests/unit/ux-admin-chat9-round9-legacy.test.ts`, `UX-admin-recruiters-label-01`, plus `chat9-super-admin-exact-page-copy` and `chat9-super-admin-placement-source-reconciliation`.
- Passing runtime/unit/browser evidence still required before ticking this route.
