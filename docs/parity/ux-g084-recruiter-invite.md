# UX-G084 — Public canonical recruiter invitation

Scope: `/recruiter-invite/[token]` page, loading and error, canonical `RecruiterInviteLanding` verification form. Owner `chat-ux-recruiter-public-batch-2026-11-07`.

## UX improvement

- Canonical bearer-invitation route retains `force-dynamic`, `noindex,nofollow,noarchive`, `no-referrer` and has explicit user-facing browser title.
- After successful send/resend, OTP input now receives focus after React mounts it; a delivery counter allows resend to focus the live input as well. This removes a keyboard/mobile dead end.
- Existing adaptive form and error states remain: loading, invalid/expired, preview provider error + retry, ready employer invitation, send code, wrong or expired code, sent state, declined, joined, and existing-account pending consent.
- Critical acceptance invariant: no client-side invite grant is inferred from an HTTP 200 alone. `accepted:true`, matching outcome/status and attested verified email are required for visible joined/pending state. Pending consent requires explicit signed-in authorization.

## Required acceptance

- `tests/unit/UX-recruiter-invite-token-01.test.ts`: existing actions, decline/unsubscribe, code validation, bounded errors and retry.
- `tests/ux-g047-g083-g084-contract.test.mjs`: noindex/no-referrer and code focus, busy guard, strict server outcome.
- `tests/e2e/ux-g047-g083-g084-recruiter-journeys.spec.ts`: narrow-phone invalid link and safe login, desktop real browser ready-OTP/send code/focus, server-attested pending consent rather than automatic access.

## Regression and security review

Canonical server preview, token hashing, OTP HMAC, same-origin handlers, expiration/revocation, company/email binding, signed-in consent, role grants and tenant isolation are unchanged. No new authentication bypass or cross-domain exchange. The existing HR legacy alias points to this canonical page and must continue to resolve; no invitation data is logged. Exact-SHA CI and screenshots required before DONE.


## Executed closure evidence — 2026-11-07

- **Exact accepted SHA:** `5db9b53ce1c7fcd9cea96412812c25a51c378e21`; canonical recruiter route and OTP component blobs unchanged on latest `main`.
- **[Successful scoped CI](https://github.com/42Students/lms-vnext/actions/runs/42392314518)**: ESLint, source privacy and server acknowledgement contracts, existing `UX-recruiter-invite-token-01` and share/privacy/role regression suites passed; browser **4/4** passed with no failures.
- **[Screenshots and traces](https://github.com/42Students/lms-vnext/actions/runs/42392314518/artifacts/13581663762)**: `recruiter-invalid-mobile.png` at 320×720, `recruiter-ready-desktop.png` and `recruiter-pending-consent-desktop.png` at 1280×800 visually reviewed. All usable, readable, responsive, no clipping.
- Browser mocked code send and server attestation, verified OTP field receives keyboard focus, and asserted an existing recruiter moves into **pending consent** rather than automatic college access. Invalid token shows safe sign-in. Live mail delivery and real identity provider sign-off were not performed in this scoped UX group.
- Authentication/consent boundaries, OTP HMAC validation, token expiry, server-granted role and tenant isolation unchanged.

**UX-G084: DONE after scoped acceptance.**
