# Work packet: edit src/modules/auth/login-service.ts (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/mobile-auth-email-fallback-send-request.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-1/user-controller.md

## G2-1-012-013  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:577-582`: missing email gives 400 EMAIL_NOT_FOUND + human message.
- vNext now: `src/modules/auth/login-service.ts:419`: EMAIL_NOT_AVAILABLE code.
- Fix: Map legacy Email not found copy and avoid exposure of registered address.

## G2-1-012-014  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:594-599`: success returns mode EMAIL_OTP_SENT, attemptId, maskedEmail, expiresInSeconds300.
- vNext now: `src/modules/auth/login-service.ts:449-453`: attemptId, maskedEmail, expiresInSeconds, no mode.
- Fix: Include mode or migrate client success parser.

## G2-1-019-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:623-627: missing/expired email channel 401 EMAIL_OTP_EXPIRED.
- vNext now: src/modules/auth/login-service.ts:513-541: expired email MAC contributes to INCORRECT_OTP if no live matching channel.
- Fix: Expose separate email-channel expiration message when email fallback expired and attempt still active.

## G2-1-019-030  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:1126-1136: 'Too many OTP requests. Please try again later.' for phone; C:314-317 'Too many code requests.' for email.
- vNext now: src/modules/auth/login-service.ts:354-355: shared TOO_MANY_REQUESTS error, no channel-specific text.
- Fix: Preserve distinct localized phone/email rate-limit copy or record intentional unification.

## G2-1-005-013  [P2] GAP  facet F07  effort M
- Legacy: `PublicE2eAuthController.java:92-109` returns 404 `NOT_FOUND` disabled, 400 `phone must be a string` or `PHONE_REQUIRED`, 403 `PHONE_NOT_ALLOWED` or `NOT_SUPER_ADMIN`.
- vNext now: `src/app/e2e/superadmin-login/page.tsx:4-6` no corresponding JSON errors; standard auth emits `NOT_REGISTERED`, `ACCOUNT_DISABLED` etc `login-service.ts:46-83`.
- Fix: Update negative-path tests to route-retired redirect and normalized sign-in errors.

## G2-1-006-020  [P2] GAP  facet F07  effort M
- Legacy: `PublicMobileAuthController.java:405-408` 403 suspended account with 'Contact your college administrator'.
- vNext now: `login-service.ts:263-275` `ACCOUNT_SUSPENDED`, standardized auth response.
- Fix: Surface exact contact-admin recovery string on sign-in error.

## G2-1-006-022  [P2] GAP  facet F07  effort S
- Legacy: `PublicMobileAuthController.java:546-571` email fallback 401 INVALID_ATTEMPT/OTP_EXPIRED and 429 TOO_SOON with retryAfterSeconds.
- vNext now: `login/email/route.ts:13-35`, `login-service.ts:405-453` analogous errors; fixed 30 sec cooldown constant.
- Fix: Include computed retryAfterSeconds rather than generic cooldown and accessible countdown.

## G2-1-006-023  [P2] GAP  facet F07  effort M
- Legacy: `PublicMobileAuthController.java:613-640` email OTP errors: EMAIL_OTP_EXPIRED, WRONG_TENANT, INCORRECT_OTP, OTP_ATTEMPTS_EXCEEDED.
- vNext now: `login-service.ts:386-401,489-537` uses OTP_EXPIRED/WRONG_TENANT, shared verification attempt budget.
- Fix: Map `EMAIL_OTP_EXPIRED` to expiry per channel and shared attempts clearly.

## G2-1-006-024  [P2] GAP  facet F08  effort M
- Legacy: `PublicMobileAuthController.java:179,223,343,525` delivery error message 'Could not send the login code. Please try again.'
- vNext now: `login-service.ts:358-370` throws `OTP_DELIVERY_FAILED`, mapped via loginErrorResponse.
- Fix: Use exact legacy retry-safe delivery failure text.

## G2-1-006-025  [P2] GAP  facet F08  effort M
- Legacy: `PublicMobileAuthController.java:565-570` resend copy 'A code was just sent. Wait a few seconds before asking for another.'
- vNext now: `login-service.ts:436` TOO_SOON and `login/email/route.ts:32` machine error.
- Fix: Expose same cooldown text with real seconds remaining.

## G2-1-013-018  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:529-534`: EMAIL_OTP_SENT + attemptId,maskedEmail,expiresInSeconds300.
- vNext now: `src/modules/auth/login-service.ts:373-383`: attemptId, channel, maskedContact, expiresInSeconds; mode missing.
- Fix: Convert success shape to legacy recruiter contract if old client retained.

## G2-1-008-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:210-215`: `Mobile number is required`; `Too many OTP requests. Please try again later.`
- vNext now: `src/modules/auth/login-service.ts:46-75`,`src/app/api/auth/login/start/route.ts:40-41`: INVALID_CONTACT / TOO_MANY_REQUESTS codes.
- Fix: Map server codes to exact legacy user-facing messages.

## G2-1-008-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:288-295`: `OTP is required`; `Too many verification attempts. Please try again later.`
- vNext now: `src/app/api/auth/login/verify/route.ts:19-26`,`src/modules/auth/login-service.ts:496-509`: strict OTP schema and exceed attempt code.
- Fix: Distinguish missing/invalid code and rate exhaustion in UI copy.

## G2-1-021-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:45-53: 'Invalid username or password.' for nonexistent or soft-deleted user.
- vNext now: src/modules/auth/login-service.ts:46-83: INVALID_CONTACT/NOT_REGISTERED and OTP code errors.
- Fix: Formalize retirement of password error strings; keep nonenumerating public auth policy.

## G2-20-018-014  [P2] GAP  facet F07  effort S
- Legacy: Legacy verifyOTP returns boolean mismatch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:86-105`
- vNext now: New typed INCORRECT_OTP 401, budget-exhausted 429 `src/modules/auth/login-service.ts:54-77,497-509`
- Fix: Map validation messages for wrong, expired and exhausted OTP

## G2-20-018-016  [P3] GAP  facet F08  effort S
- Legacy: Legacy save returns no success message `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:35-47`
- vNext now: New start returns attemptId and expiresInSeconds `src/modules/auth/login-service.ts:230-238,374-377`
- Fix: Show code-sent notice without claiming verified identity

## G2-20-018-017  [P3] GAP  facet F08  effort S
- Legacy: Legacy false verification is translated by controller `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:86-105`
- vNext now: New status codes mapped to inline login feedback `src/modules/auth/login-service.ts:65-77`
- Fix: Compare exact expiry and resend text in client
