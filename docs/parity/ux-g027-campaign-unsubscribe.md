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

## Evidence and closure state

- **Source checks:** 13/13 narrowly scoped read-only assertions passed against current `main` in this chat, verifying committed files and critical opt-out invariants. This is not proof of successful application runtime.
- **CI / browser:** workflow [UX-G027 campaign unsubscribe acceptance](https://github.com/42Students/lms-vnext/actions/runs/42386142509) triggered for source commit `5d0c467285611a4c4b239f8497a239f670486051`; its outcome, desktop/mobile artifacts, TypeScript/lint and existing unit regression proofs must be attached after execution.
- **Visual QA:** confirm desktop (1280×800), mobile (375×812), overflow, heading order, 44px CTA, loading and failed POST, screenshots inspected; browser spec is committed but results are **not yet certified**.
- **Cross-surface regression:** shared `Card`, `Heading`, `PageHeader`, `GracefulErrorBoundary` and `ButtonLink` APIs unchanged. Shared confirmation component has one registered use, in token page. Reconfirm with CI.
- **Security:** never infer token validity from the GET screen; never claim server suppression on a failed transport; do not replace same-origin checks, rate limits or token semantics. The API and recipient writer are not modified.

**Do not mark UX-G027 DONE without green exact-SHA browser and unit evidence plus visual proof review.** Keep it DOING until then.
