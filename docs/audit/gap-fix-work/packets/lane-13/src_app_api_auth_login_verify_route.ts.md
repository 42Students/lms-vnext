# Work packet: edit src/app/api/auth/login/verify/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-1/mobile-login-attempt.md

## G2-1-006-011  [P1] GAP  facet F04  effort L
- Legacy: `PublicMobileAuthController.java:765-790` response `Response<{auth,memberships,defaultHost,handoffToken,domain* flags}>`.
- vNext now: `login/verify/route.ts:87-109` only `{ok,next,selectedMembership}` plus HttpOnly opaque and membership cookies.
- Fix: Migrate all consumers of token-pair, domain flags, handoff and memberships to authenticated membership endpoint.

## G2-1-008-032  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:277-289`: phone and otp required for verification.
- vNext now: `src/app/api/auth/login/verify/route.ts:19-26`: UUID attemptId; 4–8 digits; optional secondCode.
- Fix: Guide legacy clients to attemptId and second-factor handling.

## G2-1-008-090  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:484-495`: admin lockout clear and unsafe public password register.
- vNext now: `src/app/api/auth/login/start/route.ts:14-43`,`src/app/api/auth/login/verify/route.ts:19-114`: neither old action has a matching public route.
- Fix: Restore only protected support unlock if required; never restore public password registration.

## G2-15-027-038  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:421-477 faculty GET login sends SMS and GET OTP verify returns Faculty
- vNext now: src/app/api/auth/login/start/route.ts:19-43 POST start + src/app/api/auth/login/verify/route.ts:37-109 POST verify issues cookie
- Fix: Keep secure vNext POST/cookie design, bridge old client or redirect to new login.

## G2-1-019-032  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:775-790: successful verify returns AuthResponse, memberships, defaultHost, domain policy flags.
- vNext now: src/app/api/auth/login/verify/route.ts:87-109: returns ok true, next /dashboard, selectedMembership boolean.
- Fix: Ensure membership/host choice transition conveys same outcome; no token exposure.

## G2-1-008-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:288-295`: `OTP is required`; `Too many verification attempts. Please try again later.`
- vNext now: `src/app/api/auth/login/verify/route.ts:19-26`,`src/modules/auth/login-service.ts:496-509`: strict OTP schema and exceed attempt code.
- Fix: Distinguish missing/invalid code and rate exhaustion in UI copy.

## G2-1-008-041  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:489-495`: register runtime errors 400, other errors 500 with support text.
- vNext now: `src/app/api/auth/login/start/route.ts:40-41`,`src/app/api/auth/login/verify/route.ts:110-111`: normalized loginErrorResponse.
- Fix: Create status and error-message translation reference; avoid leaking DB messages.
