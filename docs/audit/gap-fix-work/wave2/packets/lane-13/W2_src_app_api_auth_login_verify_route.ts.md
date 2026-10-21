# Work packet (wave 2): edit src/app/api/auth/login/verify/route.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/email-verification-token.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/user-controller.md

## G2-1-002-038  [P2] GAP  facet F10  effort M
- Legacy: `AuthController.java:514-520`, `AuthHandoffToken.java:15-28` consumes handoff once via DB conditional claim and sets cookies.
- vNext now: `src/app/auth/handoff/page.tsx:3-8` has no token-consume write; vNext first-party session created on code verification (`src/app/api/auth/login/verify/route.ts:46-62`).
- Fix: Document intentional retirement and exercise deep-link/cross-domain fallback with signed-in origin and target.

## G2-1-002-054  [P2] GAP  facet F13  effort M
- Legacy: `AuthController.java:643-649,815-826` missing refresh cookie/body gives 401 `Refresh token required`.
- vNext now: `src/auth/session.ts:17-45` missing/expired opaque cookie throws SESSION_MISSING/SESSION_EXPIRED; `src/app/api/auth/login/verify/route.ts:87-109` issues full session.
- Fix: Redirect to sign-in on missing/expired opaque session; remove silent infinite token-refresh loading.

## G2-1-016-002  [P2] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:26,35,44,55: token/email/application lookup methods, no navigation mapping.
- vNext now: src/app/api/auth/login/verify/route.ts:19-26: verification uses attemptId plus numerical code; no token link route.
- Fix: If old application verification was reachable, build equivalent email-link flow or formally retire with owner decision.

## G2-1-019-025  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:610-614,660-664: trims attemptId and code; empty reports literal 'attemptId required'/'otp required'.
- vNext now: src/app/api/auth/login/verify/route.ts:19-26: Zod strict UUID and 4-8 digit numeric OTP; generic guarded validation.
- Fix: Align exact user-facing validation wording where requested by clone spec.

## G2-1-019-054  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:547,613-614: literal errors 'attemptId required'/'otp required'.
- vNext now: src/app/api/auth/login/verify/route.ts:19-26: strict Zod errors, wording is not specified in route.
- Fix: Align exact required-field hints or document approved wording variance.

## G2-1-005-007  [P2] GAP  facet F04  effort M
- Legacy: `PublicE2eAuthController.java:119-126` response wrapped `Response<AuthResponse>` with synthetic `id:0,userType:FACULTY,facultyType:ADMIN` and token pair.
- vNext now: `src/app/api/auth/login/verify/route.ts:87-91` returns `{ok,next,selectedMembership}`, not synthetic admin user/token.
- Fix: Update tests expecting tokens/users to inspect legitimate session+DB-backed admin role without synthetic user.

## G2-1-005-018  [P2] GAP  facet F10  effort M
- Legacy: `PublicE2eAuthController.java:65-85` cookies named `lms_authenticated`,`lms_refresh_token`, same-site config via AppSettings.
- vNext now: `src/app/api/auth/login/verify/route.ts:80-108` `lms_session` opaque plus membership/admin scope cookie with `SameSite=lax`.
- Fix: Remove E2E tests hardcoding legacy cookies and use new session fixture.

## G2-1-006-004  [P2] GAP  facet F02  effort M
- Legacy: `PublicMobileAuthController.java:48-53` selects among multiple matching accounts before sending OTP.
- vNext now: `login-service.ts:302-307,373-382` resolves canonical person; `login/verify/route.ts:69-79` chooses membership after verification.
- Fix: Make account/membership chooser occur after ownership verification as intentional security change; preserve college labels.

## G2-1-006-017  [P2] GAP  facet F06  effort M
- Legacy: `PublicMobileAuthController.java:610-614,660-664` verify requires `attemptId` and `otp`.
- vNext now: `login/verify/route.ts:19-26` strict UUID `attemptId`, numeric 4–8 character `code`, optional `secondCode`.
- Fix: Migrate `otp` to `code` and conditional secondCode; fix validation hints.

## G2-1-006-027  [P2] GAP  facet F09  effort M
- Legacy: `PublicMobileAuthController.java:145-790` backend has no dialog; frontend account chooser confirms selected row before OTP.
- vNext now: `login/verify/route.ts:69-79` membership selection after verification; shell account picker owns dialog.
- Fix: Compare picker modal/disabled/offline states on login and shell in companion page audit.

## G2-1-006-033  [P2] GAP  facet F10  effort M
- Legacy: `PublicMobileAuthController.java:750-783` token response exposes defaultHost and domain-enforcement flags.
- vNext now: `login/verify/route.ts:87-91` only next path, `login/start` host tenant resolution server-side.
- Fix: Move cross-host navigation to safe server-resolved destination and avoid exposing internal policy.

## G2-1-006-053  [P2] GAP  facet F19  effort M
- Legacy: `PublicMobileAuthController.java:353-375` retrieves learner/faculty/recruiter accounts by phone/email without limit.
- vNext now: `login-service.ts:302-307` resolves one canonical user; `login/verify/route.ts:69-79` later membership list.
- Fix: Benchmark canonical membership lists for many colleges and sort deterministically.

## G2-1-008-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:275-281`: GET /verifyOTP with phone and OTP issues JWT pair.
- vNext now: `src/app/api/auth/login/verify/route.ts:19-60`: POST /api/auth/login/verify consumes attemptId/code.
- Fix: Document 2-step attempt-ID migration and remove query-string OTP exposure.

## G2-1-008-049  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:359-385`: faculty sign-in increments tokenVersion, stores device session/JWT.
- vNext now: `src/app/api/auth/login/verify/route.ts:52-59`,`src/modules/auth/session-service.ts:40-62`: transactional challenge consume/session creation.
- Fix: Clarify existing-device revocation semantics and migration.

## G2-1-008-050  [P2] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:396-423`: learner hierarchy enrichment, tokenVersion increment and login session.
- vNext now: `src/app/api/auth/login/verify/route.ts:69-78`: active memberships auto-select or redirect chooser.
- Fix: Audit multi-role/multi-college login routing and tenant scope.

## G2-1-008-060  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:238-240`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:254-267`: numeric 4-digit random OTP, test phones override.
- vNext now: `src/app/api/auth/login/verify/route.ts:21-25`,`src/modules/auth/login-service.ts:324-329`: 4–8 digit acceptance and configured test codes.
- Fix: Define generated length, input maxlength and allowed test-phone rules.

## G2-1-008-079  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:284-285`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:302-312`: phone/OTP trim and UA/X-Client mobile-policy detection.
- vNext now: `src/modules/auth/login-service.ts:207-212`,`src/app/api/auth/login/verify/route.ts:19-25`: E.164 normalized phone, typed OTP.
- Fix: Check mobile-app superadmin restriction, optional test phone and cookie host semantics.

## G2-6-031-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy OTP six-digit Input maxlength6 and numeric pattern (SuperAdminLogin.js:175-190).
- vNext now: vNext digits-only input max6, server regex allows 4–8 (login-form.tsx:467-485; login/verify/route.ts:19-25).
- Fix: Align actual OTP server length with UI six-digit display; avoid rejecting valid configured codes.

## G2-6-031-030  [P2] GAP  facet F10  effort M
- Legacy: Legacy getOTP and getVerifyOTP are GET query APIs, payload {phoneNumber,otp,superAdmin:true,collegeId?} (otp.js:5-15; SuperAdminLogin.js:254-260,305-310).
- vNext now: vNext POST /api/auth/login/start with channel/contact, POST /api/auth/login/verify with attemptId,code,secondCode? (login/start/route.ts:14-39; login/verify/route.ts:19-59).
- Fix: Document method/path/payload/response crosswalk and phase out insecure GET OTP query logging.
