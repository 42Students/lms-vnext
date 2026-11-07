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

## Executed scoped UX closure

**PASS — 7 November 2026.** [GitHub Actions run 42391360746](https://github.com/42Students/lms-vnext/actions/runs/42391360746) completed successfully at exact implementation/test SHA [`521bc310727592e91e5d54728b15d42edd83de1a`](https://github.com/42Students/lms-vnext/commit/521bc310727592e91e5d54728b15d42edd83de1a). Executed scoped `npx eslint`; `node --test tests/db004-email-link-route-security.test.mjs` (3/3 passed); `npx playwright test tests/e2e/ux-public-auth-entry.spec.ts --project=chromium --reporter=line` (9/9 passed; **5** proof-link success/invalid/declined cases across desktop/mobile plus server-declined negative case); and `npm run typecheck` (success with 6 GiB Node heap). No skipped/failed scoped cases.

The browser regression caught an actual React Strict Mode mount-effect replay bug: processing the fragment twice caused an already-stripped valid token to be considered invalid. Fixed by a `useRef` one-time processing guard while preserving immediate `history.replaceState` stripping. The browser now proves a valid token remains actionable until explicit confirmation, a mocked same-origin POST occurs **once**, a missing/invalid token never posts, non-success responds with safe recovery, the bearer never appears in visible DOM or Referer, and both 1280×800 and 390×844 have no horizontal overflow. No real account, provider or tenant record was used.

**Group UX status: DONE**, separate from DB004 backend security, GR acceptance, tenant isolation or global release certification.
