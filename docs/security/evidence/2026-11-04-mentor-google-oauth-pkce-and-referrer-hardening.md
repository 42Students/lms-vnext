# 2026-11-04 — Mentor Google OAuth: PKCE, callback confidentiality and fail-closed state

**Scope:** `42Students/lms-vnext` on `main`. Independent OAuth security implementation with regression tests and dedicated CI. **Classification:** code/test authorship pending executable acceptance; **NOT a completed security certification**. Canonical progress and controls remain `docs/tracker.json`.

## Risk and changes

The Mentor Google Calendar authorization-code callback receives `code` and `state` in its URL. Without explicit response-level referrer and cache controls, the code-bearing callback URL could be copied into same-origin referrers, browser history integrations, telemetry or intermediate caches. State validation alone also does not cryptographically prove that the token-exchange client initiated the specific authorization-code challenge.

This batch implements the following boundaries:

1. **RFC 7636 S256 PKCE:** generate independent 32-byte cryptographically random `state` and `code_verifier` during `GET /api/mentor/calendar/google/connect`; derive SHA-256 base64url challenge; require `code_challenge_method=S256` in the Google consent URL.
2. **HttpOnly, path-scoped state binding:** store `state.userId.membershipId.verifier` inside the existing 600-second, `SameSite=Lax`, production-`Secure` cookie. The verifier is not placed in the authorization request URL.
3. **Fail-closed callback:** require unique `state` and `code` parameters; compare persisted actor-bound cookie prefix to returned state using timing-safe equality; reject missing, malformed, or legacy nonce-only cookies **before** Google token exchange.
4. **PKCE token exchange:** include `code_verifier` as a bounded, server-validated parameter only in the POST to `https://oauth2.googleapis.com/token`. Retain configured OAuth client credentials and existing live Mentor membership/role and college rechecks before persistence.
5. **Confidential redirects:** on successful connect, unavailable/error connect, successful callback and all callback failures, explicitly set `Cache-Control: private, no-store, max-age=0`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, and `Pragma: no-cache`. Callback redirects continue to remove the incoming code/state from the destination URL and clear the OAuth cookie.

**Short transition note:** in-flight pre-PKCE authorization attempts using the old three-part cookie will fail closed. They can be restarted through Connect. No live user credentials or production provider requests were used in this work.

## Code and test commits

- [5d7a5709](https://github.com/42Students/lms-vnext/commit/5d7a570919faed6f4a57eb6f1ee41cd5d68c30f0) — shared OAuth privacy redirect headers.
- [515bd7ad](https://github.com/42Students/lms-vnext/commit/515bd7adb875c296b7b2d3cbb0f203b3c06b233c) — connect redirect headers.
- [63119aa6](https://github.com/42Students/lms-vnext/commit/63119aa60e360aa9e570870e2deacb74cc40f89d) — callback redirect headers.
- [99e21938](https://github.com/42Students/lms-vnext/commit/99e21938e3a12b6f5fd7a2acd4d7853ad8c58c56) — initial OAuth route adversarial cases.
- [0f657951](https://github.com/42Students/lms-vnext/commit/0f657951b520bd24f01a04c0fceb5e4d13c33f6a) — dedicated security workflow.
- [e44cc158](https://github.com/42Students/lms-vnext/commit/e44cc1580dafefc403e3a2a1d9fec94ef08a5323) — provider PKCE challenge and token-exchange validation.
- [95d2b605](https://github.com/42Students/lms-vnext/commit/95d2b605a345daa515197e5389249045cbd0565c) — connect nonce/verifier generation and cookie binding.
- [95fe7f4d](https://github.com/42Students/lms-vnext/commit/95fe7f4d9cb07d2cf2c502bd79443c9fcbe10709) — callback verifier validation and exchange.
- [563f2b96](https://github.com/42Students/lms-vnext/commit/563f2b96b0944f05b50b4747f484611ac9fa346a) — downgrade, forgery and positive-path OAuth route tests.
- [346461f4](https://github.com/42Students/lms-vnext/commit/346461f4a8521c36d23259bf55d7a420f2945077) — RFC 7636 known-vector challenge proof and provider POST verifier assertion.
- [3bf71a96](https://github.com/42Students/lms-vnext/commit/3bf71a96ca40f4e423119cecdd76e78c52b048ce) — independently recompute the cookie verifier's S256 challenge in the route regression.

Focused tests are checked into `tests/unit/security-mentor-google-oauth-redirect.test.ts` and `tests/unit/mentor-google-calendar-provider.test.ts`; CI workflow `.github/workflows/security-mentor-google-oauth.yml` also runs `npm run typecheck`.

## Executed evidence and unclosed gates

The [dedicated GitHub Actions attempt 41837343047](https://github.com/42Students/lms-vnext/actions/runs/41837343047) concluded FAILURE, **but its only job reports zero steps and `runner_id=0`**. No test executed and no statement that the OAuth changes passed, failed, or are production-certified is justified. The already-available local known-vector comparison for `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` produced the RFC 7636 S256 challenge `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`; this is a narrow deterministic arithmetic check, not a complete repository test run.

**Required acceptance:**

```sh
npx vitest run tests/unit/security-mentor-google-oauth-redirect.test.ts \
  tests/unit/mentor-google-calendar-provider.test.ts
npm run typecheck
```

After a runner can execute jobs, require exact-SHA passing tests and real authorized staging Google consent/exchange/revoke with an expendable test account. Verify `code_challenge_method=S256` on consent, correct `code_verifier` at exchange, rejection of missing/wrong/expired state, and no callback URL leakage in browser/network logs, referrer, or caching. Reconfirm live membership and role revocation behavior during callback and the existing encrypted refresh-token storage; verify deployment `Secure` cookie, HTTPS ingress and provider redirect-URI constraints.

**Security control mapping (partial):** SEC-02-003 (cookie attributes), SEC-15-008 (malformed callbacks), SEC-15-009 (tenant-safe callbacks), SEC-23-010 (CSRF/adversarial testing). Their implementation evidence is advanced, but none is marked fully VERIFIED by this receipt, and no 493-control overall security coverage percentage is inferred.
