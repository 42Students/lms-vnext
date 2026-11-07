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
