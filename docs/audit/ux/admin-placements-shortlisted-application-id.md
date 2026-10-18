# UX review — `/admin/placements/shortlisted/[applicationId]`

- **Lane:** chat-9; /admin last-third; route 76 of 111.
- **Review:** The route delegates to an existing authorized shared workspace/read surface or canonical redirect; no parallel UI is introduced.
- **States:** Existing scoped, empty/error, permission and loading behavior is preserved; this route must not invent content or add client-side authorization. Shared destination/component owns details, forms and recovery.
- **Contract:** Signed-off UX Playbook; exact legacy titles and actions preserved. Use shared DataTable only with explicit caller-owned `empty` copy.
- **Source verification:** `tests/unit/ux-admin-chat9-batch-01.test.ts`, `UX-admin-placements-shortlisted-application-id-01`.
- **Validation:** Source test authored; TypeScript, lint, Vitest and browser/device checks pending orchestrator run. Do not mark page accepted until those pass.

## UX loading follow-through

- **Specific remaining weakness fixed:** Route 76 previously used an unbounded pulsing placeholder (or a static LoadingState) with no actionable slow-connection state.
- **Change:** Its `loading.tsx` now uses shared `GracefulPageLoading` with the existing route's loading label; the shared skeleton reserves content space and reveals the retry action after the slow-load threshold. The template detail route retains its existing title and Projects navigation.
- **Regression:** `tests/unit/ux-admin-chat9-loading-a.test.ts`, case `UX-admin-placements-shortlisted-application-id-02`.
- **Acceptance still pending:** Run full TS, lint, Vitest, UX guard and 320px / screen-reader verification before ticking the page.

## Interaction follow-through

- The shared Super Admin placement detail already uses a div rather than a second main landmark; both Back and related-detail links now have 44px targets, underline, deep-teal contrast and visible keyboard focus. Regression `UX-admin-placements-shortlisted-application-id-03`.
- Full CI and device/AT acceptance remain pending; retain unchecked page state.
