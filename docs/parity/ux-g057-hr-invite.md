# UX-G057 — Legacy HR invitation alias

Scope: `/hr-invite/[token]` (redirect-only compatibility page, loading, error). Owner: `chat-company-hr-ux-2026-11-07`. Branch: `main`.

## UX improvements

- Compatibility URL is now explicitly `force-dynamic`, `noindex,nofollow,noarchive` and `no-referrer` to prevent leaking a bearer invite token through indexing or navigation referrers.
- Public loading state now says "Opening recruiter invitation..." to distinguish the redirect from accepting the invitation.
- The alias continues to validate token syntax and redirect only to `/recruiter-invite/[token]` (first-party canonical form). Invalid/short/traversal/protocol tokens produce 404, not an open redirect.
- Shared public-safe error fallback stays available, with no duplicate verification form or API bypass.

## Test/acceptance coverage

- Existing `tests/unit/UX-hr-invite-token-01.test.ts`, `tests/unit/recruiter-invite-alias-model.test.ts`, `tests/unit/chat16-public-legacy-invite-handoff-16.test.ts`, and `tests/unit/chat16-legacy-auth-invite-alias-pages-16.test.ts` verify valid/invalid redirects and fallback.
- `tests/ux-g046-g057-invitation-contract.test.mjs` verifies privacy metadata, alias validation, no forms or data fetch in alias and canonical protected route.
- `tests/e2e/ux-g046-g057-public-invitations.spec.ts`: desktop canonical redirect browser proof, mobile invalid-link 404 proof, no horizontal overflow and canonical no-referrer/noindex.
- CI job: `.github/workflows/ux-public-invitations-acceptance.yml`. Evidence and exact SHA attached after green run.

## Regression/privacy review

`recruiterInviteHref`'s strict 8–512 char, safe-character schema and `notFound` behavior remain unchanged. `runAsSystem("public-page:hr-invite")` retained to avoid security scope drift. The canonical recruiter invite owns its own consent, role checks, work-email OTP, expiration/revocation and acceptance state machine; no alias code path mutates an invitation or performs a cross-host token exchange.

**Closure gate:** exact-SHA scoped lint/source/alias and browser desktop/mobile checks green, evidence artifact reviewed, and tracker updated.
