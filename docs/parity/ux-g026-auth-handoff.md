# UX-G026 — Retired authentication handoff

Branch: `main` · 2026-11-07 · Owner: `chat-auth-handoff-ux-2026-11-07`

## Surface scope

- `/auth/handoff` redirects an old account-switching request into a fresh first-party OTP sign-in.
- `src/app/auth/handoff/page.tsx`: sensitive query/return path, dynamic privacy metadata and safe redirect.
- `src/app/auth/handoff/loading.tsx`: branded transition state.
- `src/app/auth/handoff/error.tsx`: contextual recovery, retry and reference telemetry.

## UX improvements

- Mark the credential-bearing alias `force-dynamic`, `noindex,nofollow,noarchive` and `no-referrer` so tokens in the URL are not exposed through indexing or external navigation.
- Clearer loading label: "Opening secure sign-in..." rather than ambiguous "Returning to sign in".
- Error boundary now has one public main landmark, one contextual heading, responsive public-brand skin, and a single compact `GracefulErrorBoundary insideShell` so a 500-style full-page `main` is not incorrectly nested inside another `main`. Existing telemetry, stale chunk handling, retry, reference and safe home destination are preserved.
- No duplication or reopening of the retired token redemption flow. The login page continues to explain that a fresh OTP is required.

## Functional invariants and negative cases

- The alias never logs, validates, redeems, stores, exchanges, forwards or otherwise reads an old bearer token.
- Only `safeReturnTo` first-party paths can survive. Redirecting to auth/API/login root, protocol-relative, cross-host or malformed targets remains rejected. Only `tab`, `view`, `page`, `month`, `deliveryId`, `courseId`, `sectionId` query keys of bounded values survive; arbitrary token, session, code, fragment and provider data are dropped.
- The existing `/login?auth=handoff-retired` sign-in explanation and safe `returnTo` entry remain unchanged.
- No changes to token/OTP generation, persistence, cookies, role selection, tenant authorization, RLS, or identity APIs.

## Acceptance evidence

- `tests/unit/ux-g026-auth-handoff-security.test.ts` checks malicious origins, retained allowlisted keys, token stripping, arrays and denied auth/API paths.
- `tests/ux-g026-auth-handoff-contract.test.mjs` verifies page privacy metadata, source policy and single landmark/error fallback.
- Existing `tests/unit/chat16-public-legacy-invite-handoff-16.test.ts`, `tests/unit/chat16-legacy-auth-invite-alias-pages-16.test.ts` are unchanged and must pass.
- `tests/e2e/ux-g026-auth-handoff.spec.ts` checks desktop external-target denial and mobile safe return whitelist with screenshots and no overflow.
- Dedicated workflow `.github/workflows/ux-auth-handoff-acceptance.yml`. The exact SHA, job result, screenshots and visual inspection are to be added only after execution.

**Status:** DOING until exact-SHA browser and adversarial suite evidence passes.


## Executed closure evidence — 2026-11-07

- **Exact source SHA:** `59a720e4403d692f18faeb390c912b8ef68fb6a1`.
- **[Acceptance run 42391254741](https://github.com/42Students/lms-vnext/actions/runs/42391254741): success.** Scoped lint/Node contracts green, existing and new adversarial handoff Vitest tests green; Playwright Chromium **2/2 passed without retries**.
- **[Browser screenshots and traces](https://github.com/42Students/lms-vnext/actions/runs/42391254741/artifacts/13581826436):** `handoff-desktop-rejected.png` at 1280×800 and `handoff-mobile-safe-return.png` at 375×812 personally inspected; the warning, fresh sign-in actions, OTP form, footer and branding are clear and responsive, without clipping or horizontal overflow.
- Security review: external and protocol-relative targets removed, old bearer token discarded, whitelisted first-party return URL retained without private code/token/fragment; no session cookie reissued by alias. Existing signed-in role, OTP, and tenant enforcement are unmodified.
- Regression review: shared `GracefulErrorBoundary`, `PublicPageLoading`, `PageHeader`, `Card`, login page and auth modules unchanged. Route-specific error composition uses `insideShell` and a single outer public landmark; retry and telemetry remain.
- No live identity provider exchange or production OTP delivery was performed as part of this scoped UX verification; those remain independent release tests.

**UX-G026: DONE after scoped acceptance.**
