# UX-G003 — Account security and signed-in devices

**Canonical group:** `UX-G003`, 3 surfaces (security page, loading, route error). Source: `src/app/(authenticated)/account/security/{page,error,loading}.tsx`.

## Implementation

- Keeps first-party `getCurrentDeviceSession()` and `listActiveSessions(session.userId)`; no privileged identity or tenant lookup was loosened.
- Device directory explicitly distinguishes an unexpected empty list (while the visitor has a valid session) from a database/load failure. Neither is falsely presented as a confirmed sign-out.
- Both states have a real **Refresh device list** native GET form, avoiding a same-route Next.js client-navigation cache hit that may not re-request data. Focus-visible button at least 44px tall on mobile.
- The normal state explains the safety difference between revoking another session and signing out the current device. Existing DeviceList confirmation dialogs, own-account auth and revoke API are preserved.
- Loading retains its named bounded state, errors retain in-shell telemetry and retry.

## Acceptance gate

- Green exact-SHA GitHub Actions workflow `ux-devices-login-acceptance.yml` (ESLint, TypeScript, Vitest, Playwright).
- Real, first-party, disposable seeded OTP session for a super-admin with role/tenant guards intact: desktop and phone page, one active current device, focusable sign-out, no horizontal overflow, second-device session revocation leaves current session valid and revokes other session, unauthenticated request rejected.
- This is a scoped UX acceptance. Do not claim new security controls, full release readiness, or device support beyond observed browser runs.


## Exact-SHA acceptance receipt — **PASS, 2026-11-07**

- **Source commit:** `56cf4e35769f15787709fa7ae9925570e8810787` on `main`.
- **CI:** [UX-G003 G067 device/login acceptance run 42392268954](https://github.com/42Students/lms-vnext/actions/runs/42392268954), completed **success**.
- Scoped ESLint **PASS**; full project TypeScript **PASS**; focused Vitest **8/8 PASS**; Chromium browser **5/5 PASS**.
- **Evidence artifact:** [`ux-g003-g067-evidence`](https://github.com/42Students/lms-vnext/actions/runs/42392268954/artifacts/13582351787), 211,855 bytes, SHA-256 `f1bb0d47b43398aca7fd99530c3330aec5e8cdbde4720df0c6bfb1122e9c858e`.
- **G003 browser views:** `test-results/ux-g003-devices-mobile-390.png`, `test-results/ux-g003-devices-desktop-1280.png`; actual isolated QA OTP creates first-party session cookie, verifies device listing and current session, signs out another device while preserving current session, and denies anonymous device access.
- **G067 browser views:** `test-results/ux-g067-login-phone-320.png`, `test-results/ux-g067-login-desktop-1280.png`; verifies branded secure OTP entry, safe internal return path, mobile keyboard focus and noindex metadata.
- **Boundary:** Test OTP is enabled only for development-disposable test database and synthetic allowlisted accounts; no production credential, tenant authorization, API security, or session-revocation rules changed. This is scoped UX acceptance only; global security/release checks remain independent.

