# UX-G123 — Universities public journey

**Owner:** ux-universities-chat-2026-11-07  
**Scope:** `src/app/universities/{page,error,loading}.tsx`  
**Status:** DONE — group-specific acceptance verified on commit `835e21ff8b1b4b82b15e1edae82a872e9d7fae6e` (7 November 2026).

## Improvements
- Added an early, real `/request-demo` CTA without changing the shared marketing shell.
- Added accessible, touch-sized section shortcuts for campus capabilities and the student journey.
- Removed overhanging connector arrows that could overlap adjacent journey steps.
- Added concise, human-operated journey context and retained the seven existing truthful capability descriptions, canonical metadata, and safe marketing claims.
- Improved responsive loading affordance with contextual skeleton and slow-loading retry.
- Redirected route-level public error recovery to `/`, not the authenticated dashboard.

## Executed acceptance
- [3/3 source contracts + scoped ESLint](https://github.com/42Students/lms-vnext/actions/runs/42386799736) — pass.
- [2/2 Playwright Chromium tests](https://github.com/42Students/lms-vnext/actions/runs/42386799736) — pass at **1280×800 desktop** and **390×844 mobile**. Both test keyboard focus, anchored navigation, real demo destination, absence of viewport overflow and browser page errors.
- [Two screenshots, retained artifact](https://github.com/42Students/lms-vnext/actions/runs/42386799736/artifacts/13579304583) — `ux-g123-evidence/desktop.png` and `ux-g123-evidence/mobile.png`.
- `npm run typecheck` — **pass** in this run (completed before subsequent guard step).
- `npm run ux:guard` — **fails globally for unrelated, concurrently owned files**: `src/app/campaign-unsubscribe/[token]/page.tsx:19` and `src/app/college-join/[token]/loading.tsx:6` (`unverified-touch-class`). **No UX-G123 path was flagged.** This external guard failure is explicitly not represented as green or resolved here.

## Regression and privacy review
- The route uses the existing marketing components, request-demo destination and canonical metadata. No shared marketing UI or cross-role data workflow was modified.
- Browser acceptance exercises the real `/request-demo` route from both viewport sizes; no invented links or account state.
- No authorization, authentication, RLS, tenant, persistence, API, token, provider, or sensitive data code was changed. The public error escape goes to the public homepage.
- Group closeout evidence is mirrored in `docs/parity/shared-public-ops.md` and the sole canonical tracker `docs/tracker.json#uxReview`.
