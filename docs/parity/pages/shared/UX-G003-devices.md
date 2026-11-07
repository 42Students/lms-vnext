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

## Evidence
Pending workflow result.
