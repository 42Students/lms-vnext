# UX-G067 — Dedicated /login page, loading and error recovery

**Canonical group:** `UX-G067`; 3 surfaces: `src/app/login/{page,error,loading}.tsx`. Shares the verified tenant-scoped OTP implementation with root without changing credential/tenant/role checks.

## Implementation

- `/login` remains the dedicated first-party OTP entry, reusing the root page. Its metadata inherits resolved tenant branding, but sets `robots: noindex, nofollow, noarchive` to avoid indexing credential-entry pages.
- The route error boundary keeps existing safe client error reporting, generic (non-leaking) copy and Retry, but now provides a distinct **Start a fresh secure sign-in** link to `/login`, not merely the marketing-root fallback. Actions are 44px-tall on phones and focusable.
- A named branded loading state announces **Preparing secure sign-in…** through `PublicPageLoading` and bounded retry.

## Acceptance gate

- Exact-SHA lint/TypeScript/Vitest + mobile 320 and desktop 1280 Chromium on `/login` and `/login?auth=revoked&returnTo=...`.
- Verify noindex metadata, skip-to-content, safely retained internal return destinations, keyboard focus, no horizontal overflow.
- Broader OTP provider integrations, production access and end-to-end release readiness remain separate.

## Evidence
Pending workflow result.
