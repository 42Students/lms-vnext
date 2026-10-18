# UX rollout — /campaign-unsubscribe/[token]

- **UX ID:** UX-campaign-unsubscribe-token-01. Link GET validates signed recipient/global tokens only and never mutates email suppression. The POST confirmation route remains the sole state change.
- **Before:** custom public confirmation card/button and an unstyled inline network failure; narrow links and uncentered desktop state.
- **Improvements:** mobile-first min-h-dvh bounded layout, shared `PageHeader` + `Card`, semantically explicit invalid-link alert with original exact wording, shared `Button` with disabled/loading for single POST, focusable `InlineNotice` on failed request, and accessible route-level bounded skeleton and public-safe ErrorBoundary.
- **States:** invalid/expired (no change), two distinct campaign scopes, pending POST, verified redirect-only confirmation, transport/error retry while preserving token. No speculative success and no mutation on GET.
- **Tests:** `tests/unit/UX-campaign-unsubscribe-token-01.test.ts` authored. No live token, API or browser validation run; do not tick route pending CI.
