# Work packet: edit src/app/api/auth/login/email/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/mobile-auth-email-fallback-send-request.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md

## G2-1-012-009  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:546-548`: empty ID returns 400 error `attemptId required`.
- vNext now: `src/app/api/auth/login/email/route.ts:13-22`: failed guard returns generic validation response.
- Fix: Expose field-specific required error.

## G2-1-006-022  [P2] GAP  facet F07  effort S
- Legacy: `PublicMobileAuthController.java:546-571` email fallback 401 INVALID_ATTEMPT/OTP_EXPIRED and 429 TOO_SOON with retryAfterSeconds.
- vNext now: `login/email/route.ts:13-35`, `login-service.ts:405-453` analogous errors; fixed 30 sec cooldown constant.
- Fix: Include computed retryAfterSeconds rather than generic cooldown and accessible countdown.

## G2-1-006-025  [P2] GAP  facet F08  effort M
- Legacy: `PublicMobileAuthController.java:565-570` resend copy 'A code was just sent. Wait a few seconds before asking for another.'
- vNext now: `login-service.ts:436` TOO_SOON and `login/email/route.ts:32` machine error.
- Fix: Expose same cooldown text with real seconds remaining.
