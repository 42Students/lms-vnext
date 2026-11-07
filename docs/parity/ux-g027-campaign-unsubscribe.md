# UX-G027 — Campaign unsubscribe link → confirmation

Date: 2026-11-07 · Branch: `main` · Owner: `chat-campaign-unsubscribe-ux-2026-11-07`

## Canonical scope

Tracker: `docs/tracker.json#uxReview.groups[UX-G027]`.
Registry surface IDs: `ROUTE-STATE-0998`, `ROUTE-STATE-0999`, `PAGE-0502`, `ROUTE-STATE-1000`, `ROUTE-STATE-1001`, `PAGE-0503`.

- `/campaign-unsubscribe/[token]`: default decision, no mutation on GET, in-flight submit, duplicate-click guard, generic transport/503 failure with focusable alert and retry, route loading/error.
- `/campaign-unsubscribe/confirmed`: placement-cell and global completion copy, accessible announcement and home navigation, route loading/error.
- Shared CTA: `src/components/placements/campaign-unsubscribe-confirm.tsx`.

## Improvement pass on main

- Matched the public link decision screen to the branded responsive public-auth shell and confirmation max-width; added a heading/section association, clearer no-change explanation and accessible form description.
- Kept the explicit POST as the only suppression mutation; no recipient/token validation or lookups on GET. Button stays single-flight and disabled during pending/success transition.
- Announced pending/transition states to assistive technology, retained focusable inline network/503 alert, made the mobile action span the content width with a 44px minimum target.
- Clarified confirmation completion, made the home link mobile-width and at least 44px tall, preserved the different placement-cell and global explanations.
- Added `robots: noindex, nofollow` metadata to both public routes; kept the existing generic fallback error screens and made loading copy describe actual UI rather than implying a token lookup.

## Regression and privacy boundaries

- The POST route `src/app/api/public/campaign-unsubscribe/route.ts` is unchanged: same-origin guard, bounded body, purpose-specific token validation, generic response on invalid/expired tokens, verified suppression only, and no disclosure of recipient existence.
- The public token GET does not validate validity or claim a preference was saved. A failing POST stays on the decision page; only an observed same-origin `/campaign-unsubscribe/confirmed` redirect can advance it.
- Existing `tests/unit/UX-campaign-unsubscribe-token-01.test.ts`, `tests/unit/UX-campaign-unsubscribe-confirmed-01.test.ts`, `tests/unit/chat16-public-unsubscribe-page-27.test.ts`, `tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts`, and `tests/unit/chat2-unsubscribe-graceful.test.ts` remain in the scoped regression job.
- New `tests/ux-g027-unsubscribe-contract.test.mjs` checks critical source/accessibility invariants.
- New `tests/e2e/ux-g027-campaign-unsubscribe.spec.ts` captures desktop token, mobile token, mobile failure and mobile confirmed screenshots, including narrow-screen overflow, no POST on GET, retry and global/placement scope.
- Dedicated job: `.github/workflows/ux-campaign-unsubscribe-acceptance.yml`.

## Evidence and closure state — CLOSED

- **Source commit under test:** `82c56f0bc82f4b6e4d2c0dbd57e4320ef96ad04e`. All authored UX and test changes are ancestor commits on `main`.
- **Exact-SHA executed acceptance:** [GitHub Actions run 42386591655](https://github.com/42Students/lms-vnext/actions/runs/42386591655), **success**, 2026-11-07. Scoped `npx eslint` passed. `node --test tests/ux-g027-unsubscribe-contract.test.mjs` passed. Existing five Vitest unsubscribe / scope suites passed. `npx playwright test tests/e2e/ux-g027-campaign-unsubscribe.spec.ts --project=chromium --reporter=line` passed **3/3 with no retry/flaky tests**.
- **Desktop and mobile visual proof:** [artifact 13579458169](https://github.com/42Students/lms-vnext/actions/runs/42386591655/artifacts/13579458169) includes `desktop-token.png` at 1280×800, `mobile-token.png` at 375×812, `mobile-retry.png` at 375×812, and `mobile-confirmed.png` at 375×878. All four screenshots were downloaded and visually inspected: clear headings and actions, consistent public chrome, legible error and confirmation, no clipping or overlapping controls; mobile viewport overflow assertion passed.
- **Loading/error states:** route loading and ErrorBoundary remain present and source-covered; the decision GET and confirmation browser routes were exercised. Separate error-boundary fault-injection was not required because that boundary is shared and unchanged.
- **Cross-role/shared regression:** `Card`, `Heading`, `PageHeader`, `GracefulErrorBoundary`, `InlineNotice`, and `ButtonLink` implementations were not modified. The sole registered caller of `CampaignUnsubscribeConfirm` was verified, and five existing unsubscribe contracts passed. Public route contains no account-specific data or role permissions.
- **Privacy/security invariants:** GET does not inspect or change recipient suppression. POST still enforces same-origin, bounded body parsing and purpose-specific verification; generic invalid-token acknowledgments do not disclose recipient membership. Network/503 errors never advance to success; only a verified same-origin successful redirect does. The server endpoint was untouched.

**UX-G027 is eligible for DONE** with this exact-source executed evidence and visual proof. Other global/security or release gates are independent of this scoped UX group.
