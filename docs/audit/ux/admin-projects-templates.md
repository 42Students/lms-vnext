# UX review — `/admin/projects/templates`

- **Lane / slice:** chat-9, route 88 of 111 (last third).
- **Observed / addressed:** Replaced insufficient-contrast link text with the signed-off deep-teal token, enlarged interactive hit areas to 44px and constrained content width; existing names and data logic are retained.
- **Responsive and accessibility:** Existing loading/retry, form draft handling and focused state remain governed by the shared UI. Route-owned link contrast, 44px controls and narrow viewport containment improved.
- **Legacy wording:** Preserved titles, labels, button messages, selected scope and URL semantics; nothing was deleted or reauthorized on the client.
- **Regression:** `tests/unit/ux-admin-chat9-batch-02.test.ts` case `UX-admin-projects-templates-01`.
- **Verification:** Unit/typecheck/lint/device evidence pending orchestrator. Page-list checkbox remains open until tests pass.

## Follow-up implementation

The global template directory now uses shared Input/Select/Button with narrow viewport-safe filter layout and shared Pagination. Regression assertions in the named UX batch test now cover the shared contract. Execution remains pending orchestrator.

## UX loading follow-through

- **Specific remaining weakness fixed:** Route 88 previously used an unbounded pulsing placeholder (or a static LoadingState) with no actionable slow-connection state.
- **Change:** Its `loading.tsx` now uses shared `GracefulPageLoading` with the existing route's loading label; the shared skeleton reserves content space and reveals the retry action after the slow-load threshold. The template detail route retains its existing title and Projects navigation.
- **Regression:** `tests/unit/ux-admin-chat9-loading-a.test.ts`, case `UX-admin-projects-templates-02`.
- **Acceptance still pending:** Run full TS, lint, Vitest, UX guard and 320px / screen-reader verification before ticking the page.
