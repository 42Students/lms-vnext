# UX-G124 — Email ownership verification UX (2026-11-07)

**Source scope:** `src/app/verify-email/page.tsx` and `src/app/verify-email/layout.tsx`. The route was listed in the supplementary route census, not the older generated UI registry.

## UX improvement acceptance

- Distinct, screen-reader announced checking, ready, sending, success and invalid-link views; responsive account-verification layout.
- Clear 24-hour/one-time guidance without exposing the bearer token in the DOM.
- Valid link only: the user must deliberately click Confirm; a ref guard prevents duplicate POSTs while pending.
- Invalid/expired/unavailable link: actionable return-to-sign-in link; successful proof: fixed workspace link.
- Noindex/nofollow and no-referrer route metadata; no new redirects, persisted token storage, or raw provider errors.

## Security invariants

The page still reads `window.location.hash`, **removes the hash immediately with `window.history.replaceState` before exposing the ready state**, and sends the unrendered bearer only in JSON over `POST /api/auth/email-ownership/redeem` with `credentials: "same-origin"`, `cache: "no-store"`, and `redirect: "error"`. Backend identity/session/device/tenant validation remains unchanged. Negative tests reject malformed fragments without any POST, and reject server-declined proof without rendering raw error codes.

## Evidence gate

`tests/e2e/ux-public-auth-entry.spec.ts` includes desktop 1280×800 and mobile 390×844 valid/invalid fragment checks, safe success and failed-proof transitions, and no secret/URL leaks. `tests/db004-email-link-route-security.test.mjs` protects the existing fragment/origin code contract. The dedicated CI workflow also executes scoped ESLint and TypeScript. **Status until recorded successful execution: DOING, not DONE.** This is scoped UX acceptance, not credential, RLS, provider, security or production-release certification.
