# UX-G083 — Signed-in recruiter pending invitations

Scope: `/recruiter-invitations`, authenticated pending-invite approval entry for recruiters who have no active college grant yet. Owner `chat-ux-recruiter-public-batch-2026-11-07`.

## UX improvements

- New `loading.tsx`: shell-preserving bounded directory skeleton and slow-request retry via `GracefulPageLoading`.
- New `error.tsx`: shell-preserving `GracefulErrorBoundary`, scoped return to `/dashboard`, no duplicate landmarks or private exception messages.
- Page now catches `SessionAuthenticationError` from concurrent layout/page rendering and safely redirects to first-party login with returnTo; missing, expired, revoked, invalid and step-up-required sessions no longer render a private-route 500.
- Page now declares sensitive authenticated list `force-dynamic`, `noindex,nofollow,noarchive`, `no-referrer`. Empty/error retry actions have >=44px tap target.
- After the last invitation decision, pending panel now announces a clean completed state and provides dashboard escape instead of disappearing abruptly. Acceptance and decline actions take full-row mobile targets.
- Synchronous `busyRef` guards against near-simultaneous duplicate accept/decline POSTs; existing server performs actual identity/relationship/grant verification and controls access.

## Required acceptance

- Source contract: `tests/ux-g047-g083-g084-contract.test.mjs`.
- Server page regression (including five session recovery codes): `tests/unit/ux-g083-recruiter-invitations-server.test.tsx` tests active identity/empty state, authorized pending data, suspended denial, auth denial propagation, and DB-error generic retry.
- Browser `tests/e2e/ux-g047-g083-g084-recruiter-journeys.spec.ts`: unauthenticated access at mobile 375px must reach fresh first-party login with safe returnTo, reveal no pending invitation or accept/decline control, and avoid a 500 display or horizontal overflow.
- CI workflow `.github/workflows/ux-recruiter-public-groups-acceptance.yml`.

## Regression/security review

`getCurrentRequestContext()` is mandatory. Server uses actual user platformStatus and `listSignedInRecruiterPendingInvites(context)`, never user IDs from URLs. AuthorizationError is still rethrown rather than hidden by recovery copy. The POST route and its consent and scope checks are unchanged. No new anonymous access to ungranted college data. Exact-SHA tests and visual evidence needed for DONE.
