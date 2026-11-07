# UX-G046 — Company join invitation

Scope: `/company-join/[token]` (token page, loading, error) and the existing shared public recruiter join/retry surface. Owner: `chat-company-hr-ux-2026-11-07`. Branch: `main`.

## UX improvements

- Bearer invitation URL now explicitly `force-dynamic`, `noindex,nofollow,noarchive` and `no-referrer`; static/social previews cannot index the sensitive link.
- Opening state describes the actual task ("Opening company invitation" / "Checking invitation access…") rather than implying that the link has been consumed.
- The existing mobile-first shared form, verification flow, success state, blocked readiness and invalid-link recovery remain single-source (no duplicate form). Auth fallback stays public-safe.
- Invalid/expired company links remain noninteractive: sign-in offered, no OTP submission; server readiness errors never create a usable form or false success.

## Test/acceptance coverage

- `tests/unit/ux-g046-company-join-journey.test.tsx`: mocked ready, invalid, readiness unavailable and failed preview states; checks company scope and absence of sensitive backend detail.
- `tests/ux-g046-g057-invitation-contract.test.mjs`: no-index/no-referrer metadata, scoped readiness, no mutation in GET, 6-digit code and guarded POST implementation unchanged.
- Existing `tests/unit/UX-company-join-01.test.ts`: company work-email validation, OTP, CTA and common preview-retry contracts.
- `tests/e2e/ux-g046-g057-public-invitations.spec.ts`: 1280×800 and 320×720 invalid-link screenshots, keyboard-visible sign-in, 44px action and no horizontal overflow, no submit mutation on GET, explicit token privacy meta.
- CI job: `.github/workflows/ux-public-invitations-acceptance.yml`. Evidence and exact SHA attached after green run.

## Regression/privacy review

`src/components/placements/public-recruiter-join-form.tsx`, `src/components/placements/public-join-preview-retry.tsx`, the preview service, token validation, tenant context, send-code/join APIs, RLS and role permissions remain unchanged. The form also serves College Join; no shared component was changed after College Join's independent closure. A GET does not join, change an email, or send an OTP. Secrets and bearer token are not displayed in UI/error details.

**Closure gate:** exact-SHA scoped lint/source/SSR and browser desktop/mobile checks green, evidence artifact reviewed, and tracker updated.
