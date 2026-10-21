# Work packet (wave 2): edit src/modules/auth/config.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-15/l19-u025-public-tenant-controller.md

## G2-1-002-049  [P2] GAP  facet F12  effort S
- Legacy: `AuthController.java:325-331` handoff token random UUID sans hyphens with 2-minute TTL and `used=false`.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` refuses all handoffs; login session TTL five days (`src/modules/auth/config.ts:25-26`).
- Fix: Document user journey when reaching expired/reused handoff and deep links; no raw token recreation.

## G2-1-005-022  [P2] GAP  facet F12  effort S
- Legacy: `TestOtpService.java:17-29,49-75` accepts `APP_TEST_OTP_*` and old `E2E_TEST_OTP_*` aliases, can use arbitrary configured OTP string.
- vNext now: `src/modules/auth/config.ts:55-70` `AUTH_TEST_OTP` exactly six digits, `AUTH_TEST_PHONES/EMAILS`, app env development only.
- Fix: Migrate dev CI secrets and fixtures to new names/6-digit format; remove stale alias references.

## G2-19-025-025  [P2] GAP  facet F10  effort M
- Legacy: Legacy globalHost read from AppSettingsService DB/property fallback; AppSettingsService.java:45-60
- vNext now: vNext getPlatformHosts config; request-tenant.ts:6,46-49;auth/config.ts:18-60
- Fix: Align configured dev/apex/wildcard platform entrypoints
