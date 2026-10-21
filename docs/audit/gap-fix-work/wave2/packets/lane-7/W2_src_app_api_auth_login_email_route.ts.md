# Work packet (wave 2): edit src/app/api/auth/login/email/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/mobile-auth-email-fallback-send-request.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md

## G2-1-012-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MobileAuthEmailFallbackSendRequest.java:7-11`: MobileAuthEmailFallbackSendRequest submitted to /email-fallback/send.
- vNext now: `src/app/api/auth/login/email/route.ts:13-28`: POST /api/auth/login/email takes attemptId UUID.
- Fix: Document renamed email fallback route and JSON contract.

## G2-1-012-004  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MobileAuthEmailFallbackSendRequest.java:10`: attemptId String no syntax bound.
- vNext now: `src/app/api/auth/login/email/route.ts:13`: z.string().uuid() required.
- Fix: Reject legacy non-UUID IDs with migration-specific recovery.

## G2-1-012-005  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MobileAuthEmailFallbackSendRequest.java:9-10`: @NotBlank disallows empty/whitespace value.
- vNext now: `src/app/api/auth/login/email/route.ts:13`: UUID rejects invalid/blank, not same field-level reason.
- Fix: Map missing/empty id to `attemptId required` rather than opaque INVALID_REQUEST.

## G2-1-012-008  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:544-548`: trim attemptId before lookup.
- vNext now: `src/app/api/auth/login/email/route.ts:13`: UUID schema without trim, whitespace UUID rejected.
- Fix: Trim or explicitly reject leading/trailing whitespace with clear error.

## G2-1-006-003  [P2] GAP  facet F01  effort M
- Legacy: `PublicMobileAuthController.java:540-653` send/verify email fallback endpoints.
- vNext now: `src/app/api/auth/login/email/route.ts:13-35` POST resend by attemptId, `verify/route.ts:19-114` common verify.
- Fix: Map method/action, email code semantics and responses to one verify route.

## G2-1-006-010  [P2] GAP  facet F04  effort S
- Legacy: `PublicMobileAuthController.java:345-350` `mode:EMAIL_OTP_SENT`, choice, maskedEmail and TTL.
- vNext now: `login/email/route.ts:24-30` returns maskedEmail/attemptId; start includes channel and second-factor flag.
- Fix: Update client success mode discriminant and restore safe masked destination label.

## G2-1-006-043  [P2] GAP  facet F13  effort S
- Legacy: `PublicMobileAuthController.java:563-570` TOO_SOON with backoff seconds.
- vNext now: `login/email/route.ts:15-35` errors via standardized auth wrapper.
- Fix: Preserve retryAfterSeconds for disabled resend state.

## G2-1-012-032  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:601`: logs elapsed auth route performance.
- vNext now: `src/app/api/auth/login/email/route.ts:29`: auditLogin sent event but no elapsed timing in route.
- Fix: Capture duration in structured auth telemetry.
