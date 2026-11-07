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


## Exact-SHA acceptance receipt — **PASS, 2026-11-07**

- **Source commit:** `56cf4e35769f15787709fa7ae9925570e8810787` on `main`.
- **CI:** [UX-G003 G067 device/login acceptance run 42392268954](https://github.com/42Students/lms-vnext/actions/runs/42392268954), completed **success**.
- Scoped ESLint **PASS**; full project TypeScript **PASS**; focused Vitest **8/8 PASS**; Chromium browser **5/5 PASS**.
- **Evidence artifact:** [`ux-g003-g067-evidence`](https://github.com/42Students/lms-vnext/actions/runs/42392268954/artifacts/13582351787), 211,855 bytes, SHA-256 `f1bb0d47b43398aca7fd99530c3330aec5e8cdbde4720df0c6bfb1122e9c858e`.
- **G003 browser views:** `test-results/ux-g003-devices-mobile-390.png`, `test-results/ux-g003-devices-desktop-1280.png`; actual isolated QA OTP creates first-party session cookie, verifies device listing and current session, signs out another device while preserving current session, and denies anonymous device access.
- **G067 browser views:** `test-results/ux-g067-login-phone-320.png`, `test-results/ux-g067-login-desktop-1280.png`; verifies branded secure OTP entry, safe internal return path, mobile keyboard focus and noindex metadata.
- **Boundary:** Test OTP is enabled only for development-disposable test database and synthetic allowlisted accounts; no production credential, tenant authorization, API security, or session-revocation rules changed. This is scoped UX acceptance only; global security/release checks remain independent.

