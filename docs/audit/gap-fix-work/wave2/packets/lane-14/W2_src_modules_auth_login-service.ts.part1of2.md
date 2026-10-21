# Work packet (wave 2): edit src/modules/auth/login-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/email-verification-token.md, docs/audit/gap2/lane-1/mobile-auth-email-fallback-send-request.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md

## G2-1-036-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:853-864: 4–6-digit OTP validation.
- vNext now: src/modules/auth/login-service.ts:328 and F:467-483: generated 6-digit code, server schema constraints may differ.
- Fix: Match displayed OTP acceptance length or explicitly document six-digit restriction.

## G2-1-016-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:17,54-58: documented default token expiry 24 hours; no DB constraint bounding TTL.
- vNext now: src/db/schema/identity-auth-attempts.ts:118-120: five-minute ceiling CHECK, src/modules/auth/login-service.ts:32: 300 seconds.
- Fix: Avoid falsely describing OTP as 24-hour email link; decide whether independent link verification feature is required.

## G2-1-012-017  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:592`: sendEmailOtp runs after save of attempt.
- vNext now: `src/modules/auth/login-service.ts:429-447`: setEmailCode then provider send and fail on rejection.
- Fix: Review failed delivery/used-code state and retriability transaction.

## G2-1-012-022  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:563-570`: rejects resend while TOO_SOON with dynamic retryAfterSeconds.
- vNext now: `src/modules/auth/login-service.ts:435-437`: TOO_SOON thrown with constant EMAIL_RESEND_GAP_SECONDS.
- Fix: Return precise remaining wait rather than always full 30s.

## G2-1-012-026  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:592`: sendEmailOtp uses resolved account and code.
- vNext now: `src/modules/auth/login-service.ts:439-447`: email.sendOtpEmail to masked user with displayName, phone.
- Fix: Compare legacy template, sender, locale and provider retries; keep OTP redacted.

## G2-1-012-030  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:568-570`: TOO_SOON message `A code was just sent. Wait a few seconds before asking for another.`
- vNext now: `src/modules/auth/login-service.ts:435-437`: generic login TOO_SOON error.
- Fix: Map this exact sentence with retry seconds to user.

## G2-1-012-031  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:580-582`: `No registered email is available for this account`.
- vNext now: `src/modules/auth/login-service.ts:419`: EMAIL_NOT_AVAILABLE without legacy prose.
- Fix: Use same helpful account-email unavailability wording.

## G2-1-012-035  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:592`: direct email OTP helper.
- vNext now: `src/modules/auth/login-service.ts:439-447`: injected email provider with delivery accepted boolean.
- Fix: Validate provider/template and email opt-in policy while exempting necessary auth codes.

## G2-1-012-036  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MobileAuthEmailFallbackSendRequest.java:10`: ID typed free String in Java, stored MobileLoginAttempt.attempt_id.
- vNext now: `src/modules/auth/login-service.ts:391-393`: canonical login repository UUID attempt ID.
- Fix: Map old string IDs to UUIDs during app rollout; do not reaccept malformed token IDs.

## G2-1-012-039  [P2] GAP  facet F23  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:594-599`: exposes `mode` EMAIL_OTP_SENT.
- vNext now: `src/modules/auth/login-service.ts:449-453`: newer typed response omits mode.
- Fix: Document intentional response-shape change and adapt legacy clients.

## G2-1-019-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:145-180: POST /api/v1/public/mobile-auth/start for phone; returns single account OTP or choices.
- vNext now: src/modules/auth/login-service.ts:292-383: POST /api/auth/login/start resolves one canonical user and optional memberships, not old per-role choices.
- Fix: Confirm account chooser parity where same phone identifies legacy distinct faculty/learner accounts.

## G2-1-019-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:345-350: EMAIL_OTP_SENT result includes choice and maskedEmail, expiresInSeconds=300.
- vNext now: src/modules/auth/login-service.ts:373-383: attemptId, channel, maskedContact, maskedEmail, requiresSecondFactor, maskedPhone.
- Fix: Map choice info or explain canonical membership selection after login.

## G2-1-005-010  [P2] GAP  facet F06  effort S
- Legacy: `PublicE2eAuthController.java:95-103` accepts `phone` string, strips non-digits; empty → `PHONE_REQUIRED`.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17` strict `{channel,contact}`; `login-service.ts:207-212` normalizes E.164.
- Fix: Update test-fixture input shape and normalize phone consistently.

## G2-1-006-002  [P2] GAP  facet F01  effort M
- Legacy: `PublicMobileAuthController.java:252-299` separate email-login start/send, `:457-538` recruiter email start.
- vNext now: `login/start/route.ts:14-43` one `channel=EMAIL` flow for all; `login-service.ts:302-335` canonical user lookup.
- Fix: Map old recruiter/email entrypoints and profile selection for multiple memberships.

## G2-1-006-004  [P2] GAP  facet F02  effort M
- Legacy: `PublicMobileAuthController.java:48-53` selects among multiple matching accounts before sending OTP.
- vNext now: `login-service.ts:302-307,373-382` resolves canonical person; `login/verify/route.ts:69-79` chooses membership after verification.
- Fix: Make account/membership chooser occur after ownership verification as intentional security change; preserve college labels.

## G2-1-006-005  [P2] GAP  facet F02  effort M
- Legacy: `PublicMobileAuthController.java:188-192,275-279` returns CHOOSE_ACCOUNT state with account choices.
- vNext now: `login-service.ts:373-382` returns attemptId/channel/masked contact, no CHOOSE_ACCOUNT until authenticated membership list.
- Fix: Update state flow and account picker empty/loading/disabled UI on all hosts.

## G2-1-006-009  [P2] GAP  facet F04  effort M
- Legacy: `PublicMobileAuthController.java:181-192,225-230` `mode:OTP_SENT\|CHOOSE_ACCOUNT`, choice object, attemptId, expiresInSeconds.
- vNext now: `login-service.ts:373-382` returns `attemptId,channel,expiresInSeconds,emailFallbackAvailable,maskedEmail,maskedPhone,requiresSecondFactor`.
- Fix: Create precise old/new response mapping, remove code depending on `choice`/`mode`.

## G2-1-006-013  [P2] GAP  facet F05  effort M
- Legacy: `PublicMobileAuthController.java:353-375` email account choices ordered Recruiter, Learner, Faculty, no ORDER BY for each.
- vNext now: `login-service.ts:302-307` single user account, post-login memberships repository order not guaranteed by legacy role sort.
- Fix: Specify deterministic membership ordering independent of identity type.

## G2-1-006-015  [P2] GAP  facet F06  effort M
- Legacy: `MobileAuthStartRequest.java` phone body; `PublicMobileAuthController.java:148-150` normalizePhone or `Phone required`.
- vNext now: `login/start/route.ts:14-17` requires strict `channel,contact`, `login-service.ts:207-212` normalizes +91 and E164.
- Fix: Migrate payload and ensure Indian phone normalization parity.

## G2-1-006-045  [P2] GAP  facet F15  effort M
- Legacy: `PublicMobileAuthController.java:1112-1124` SMS via SmsService, test numbers suppress; `:868-902` ZeptoMail template sends email OTP.
- vNext now: `login-service.ts:358-370,440-446` configurable OTP provider ports send SMS/email, development test allowlists.
- Fix: Map legacy Zepto template merge variables and Exotel provider to configured vNext provider with same expiry copy.

## G2-1-006-051  [P2] GAP  facet F18  effort S
- Legacy: `PublicMobileAuthController.java:405-408` suspended copy 'This account is suspended. Contact your college administrator.'
- vNext now: `login-service.ts:263-275` returns ACCOUNT_SUSPENDED machine code.
- Fix: Match literal recovery text in login UI.

## G2-1-006-052  [P2] GAP  facet F18  effort S
- Legacy: `PublicMobileAuthController.java:265,270` domain no account and recruiter college address exact multi-sentence advice.
- vNext now: `login-service.ts:244-289` generalized tenant notfound, no recruiter hint.
- Fix: Map role-specific address and no-account copy with privacy guard.

## G2-1-006-053  [P2] GAP  facet F19  effort M
- Legacy: `PublicMobileAuthController.java:353-375` retrieves learner/faculty/recruiter accounts by phone/email without limit.
- vNext now: `login-service.ts:302-307` resolves one canonical user; `login/verify/route.ts:69-79` later membership list.
- Fix: Benchmark canonical membership lists for many colleges and sort deterministically.

## G2-1-006-060  [P2] GAP  facet F22  effort M
- Legacy: `PublicMobileAuthController.java:1231-1295` choiceIds/numeric IDs, suspendedAt per-person learner/faculty.
- vNext now: `login-service.ts:97-122` canonical UUID user/memberships and status enum.
- Fix: Document old numeric account→membership UUID mapping, no migration requested currently.

## G2-1-013-009  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:10-11`: @NotBlank with no declared max.
- vNext now: `src/modules/auth/login-service.ts:205`: maximum 254; `src/app/api/auth/login/start/route.ts:16`: contact max254.
- Fix: Show field-level length error; avoid email truncation.

## G2-1-013-012  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:476-477`: regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`; invalid 400 INVALID_EMAIL.
- vNext now: `src/modules/auth/login-service.ts:205-216`: zod email validation raises INVALID_CONTACT.
- Fix: Keep accurate invalid-address feedback with error-code conversion.

## G2-1-013-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:501-513`: active recruiter gets attempt tied to college and recruiter user id.
- vNext now: `src/modules/auth/login-service.ts:309-341`: canonical user attempt college assigned by tenant.
- Fix: Ensure recruiter grant belongs to college, not just any membership or platform user.

## G2-1-013-029  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:501-520`: attempt and email code each expire in 5 minutes.
- vNext now: `src/modules/auth/login-service.ts:373-377`: returns ATTEMPT_LIFETIME_SECONDS; email MAC challenge.
- Fix: Verify email code duration and exact 300-second UI countdown.

## G2-1-013-034  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:522-527`: sendEmailOtp(recruiter,attempt,emailOtp), handles delivery failure.
- vNext now: `src/modules/auth/login-service.ts:363-370`: generic email provider with displayName and optional phone.
- Fix: Check recruiter-specific mail template, branding and DLT/email sender.

## G2-1-013-046  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:501-513`: MobileLoginAttempt stores userType RECRUITER, recruiter id, collegeId and email OTP.
- vNext now: `src/modules/auth/login-service.ts:338-345`: canonical user ID/college and digest challenge.
- Fix: Crosswalk recruiter principal/grant IDs to canonical account, avoid userType collision.

## G2-1-008-030  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:204-211`: GET phoneNumber untyped with trim and required message.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17`,`src/modules/auth/login-service.ts:207-212`: strict channel/contact and E.164 normalization.
- Fix: Define phone normalization and field error/validation parity.

## G2-1-008-047  [P2] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:202-272`: login sends SMS and writes preuser/faculty/learner OTP verification state.
- vNext now: `src/app/api/auth/login/start/route.ts:19-39`,`src/modules/auth/login-service.ts:338-370`: creates attempt and sends SMS/email.
- Fix: Map OTP storage, delivery failure and resend state across flows.

## G2-1-008-059  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:124-141`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:213-218`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:292-299`: OTP 5 attempts per configured 900 seconds.
- vNext now: `src/modules/auth/login-service.ts:32-39`,`src/modules/auth/login-service.ts:338-355`: 5/contact+IP,8/contact,20/IP in 10min, attempt 300sec.
- Fix: Document 15m/10m and attempt expiry change; keep UI retry countdown aligned.

## G2-1-008-060  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:238-240`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:254-267`: numeric 4-digit random OTP, test phones override.
- vNext now: `src/app/api/auth/login/verify/route.ts:21-25`,`src/modules/auth/login-service.ts:324-329`: 4–8 digit acceptance and configured test codes.
- Fix: Define generated length, input maxlength and allowed test-phone rules.

## G2-1-008-068  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:238-240`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:254-268`: SMS template varies LMS/learner context.
- vNext now: `src/modules/auth/login-service.ts:358-370`: SmsProvider and EmailProvider per attempt.
- Fix: Compare sender/DLT/template and failure feedback through provider trace.

## G2-1-008-079  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:284-285`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:302-312`: phone/OTP trim and UA/X-Client mobile-policy detection.
- vNext now: `src/modules/auth/login-service.ts:207-212`,`src/app/api/auth/login/verify/route.ts:19-25`: E.164 normalized phone, typed OTP.
- Fix: Check mobile-app superadmin restriction, optional test phone and cookie host semantics.

## G2-1-008-082  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:238-240`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:254-268`: SmsService plus NotificationTemplateContextResolver.
- vNext now: `src/modules/auth/login-service.ts:358-370`: injected SMS/email providers.
- Fix: Map exact LMS learner-specific OTP template, phone normalization and DLT.

## G2-20-018-025  [P2] GAP  facet F12  effort S
- Legacy: Legacy max resend3 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:41-42`
- vNext now: New max email resend5 with 30sec gap `src/modules/auth/login-service.ts:40-42,429-436`
- Fix: Update help and enforcement for retry defaults

## G2-3-012-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:211-218`
- vNext now: `src/modules/auth/login-service.ts:207-213`, `src/modules/notifications/exotel-sms.ts:68-69`
- Fix: Legacy Exotel adapter itself strips separators and accepts 10-digit Indian, 91-prefixed and E.164 numbers; vNext adapter accepts only E.164 while login normalizes. Ensure all callers normalize before provider.

## G2-15-027-066  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:421-445 SmsService.sendOtp LMS and VerificationService.saveInstructorAccountVerification
- vNext now: src/modules/auth/login-service.ts:358-370 pluggable SMS/email provider and challenge repository
- Fix: Check Exotel provider routing, DLT template, send failure mapping and sender identity.
