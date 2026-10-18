# UX review — `/admin/semesters`

- **Lane / slice:** chat-9, route 103 of 111 (last third).
- **Observed / addressed:** Improved route-owned small text contrast using the accessible deep-teal token, 44px touch target minimum, card padding and min-width containment; retained all existing data and action strings.
- **Responsive and accessibility:** Narrow phone width and 44px interaction improvements where directly owned. Existing scoped, denied, empty and error fallbacks are kept.
- **Legacy wording:** Titles, action copy, tab order and tenant boundaries unchanged. No feature removal.
- **Regression:** `tests/unit/ux-admin-chat9-batch-03.test.ts` case `UX-admin-semesters-01`.
- **Verification:** Source test authored; typecheck, lint, Vitest and browser/device checks pending orchestrator. Checkbox remains open until tests pass.

## UX loading follow-through

- **Specific remaining weakness fixed:** Route 103 previously used an unbounded pulsing placeholder (or a static LoadingState) with no actionable slow-connection state.
- **Change:** Its `loading.tsx` now uses shared `GracefulPageLoading` with the existing route's loading label; the shared skeleton reserves content space and reveals the retry action after the slow-load threshold. The template detail route retains its existing title and Projects navigation.
- **Regression:** `tests/unit/ux-admin-chat9-loading-a.test.ts`, case `UX-admin-semesters-02`.
- **Acceptance still pending:** Run full TS, lint, Vitest, UX guard and 320px / screen-reader verification before ticking the page.

## Interaction follow-through

- Responsive shared DataTable replaces the 48rem scrolling table; name is the primary phone label, status and other details are disclosed, and edit actions remain always visible. Shared Input/Select/Button and URL-preserving Pagination retain current filtering and empty copy. Regression `UX-admin-semesters-03`.
- Full CI and device/AT acceptance remain pending; retain unchecked page state.
