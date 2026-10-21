# Work packet: edit src/app/api/auth/login/start/route.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-1-006-001  [P1] GAP  facet F01  effort L
- Legacy: `PublicMobileAuthController.java:145-196` POST `/start` phone, `:198-234` `/send` chosen phone account, `:655-718` `/verify`.
- vNext now: `src/app/api/auth/login/start/route.ts:14-43` POST one channel/contact and `verify/route.ts:19-114` POST attempt/code; no `/send` chooser-stage duplicate.
- Fix: Migrate legacy two-step account picker and explicit choice into post-login membership chooser; preserve distinctions for shared phones.

## G2-1-006-048  [P1] GAP  facet F16  effort L
- Legacy: `PublicMobileAuthController.java:48-53,145-790` explicitly serves mobile-global-domain account selection.
- vNext now: `login/start/route.ts:19-43` browser-oriented session cookie after verify `verify/route.ts:80-108`.
- Fix: Define native mobile contract for cookie transport, cross-host choice and browser callback.

## G2-1-008-090  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:484-495`: admin lockout clear and unsafe public password register.
- vNext now: `src/app/api/auth/login/start/route.ts:14-43`,`src/app/api/auth/login/verify/route.ts:19-114`: neither old action has a matching public route.
- Fix: Restore only protected support unlock if required; never restore public password registration.

## G2-15-027-038  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:421-477 faculty GET login sends SMS and GET OTP verify returns Faculty
- vNext now: src/app/api/auth/login/start/route.ts:19-43 POST start + src/app/api/auth/login/verify/route.ts:37-109 POST verify issues cookie
- Fix: Keep secure vNext POST/cookie design, bridge old client or redirect to new login.

## G2-1-006-026  [P2] GAP  facet F08  effort M
- Legacy: `PublicMobileAuthController.java:269-270` recruiter address copy example klu.42lms.com.
- vNext now: `login/start/route.ts:28-41` no recruiter-specific address message.
- Fix: Show host-specific recruiter instruction without hardcoded wrong college domain.

## G2-1-008-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:210-215`: `Mobile number is required`; `Too many OTP requests. Please try again later.`
- vNext now: `src/modules/auth/login-service.ts:46-75`,`src/app/api/auth/login/start/route.ts:40-41`: INVALID_CONTACT / TOO_MANY_REQUESTS codes.
- Fix: Map server codes to exact legacy user-facing messages.

## G2-1-008-041  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:489-495`: register runtime errors 400, other errors 500 with support text.
- vNext now: `src/app/api/auth/login/start/route.ts:40-41`,`src/app/api/auth/login/verify/route.ts:110-111`: normalized loginErrorResponse.
- Fix: Create status and error-message translation reference; avoid leaking DB messages.

## G2-1-008-042  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:241-242`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:258-269`: OTP send success says `OTP triggered`.
- vNext now: `src/app/api/auth/login/start/route.ts:35-39`: returns attempt metadata, no same status copy.
- Fix: Display legacy success confirmation with masked destination where appropriate.

## G2-15-027-033  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:445-445 OTP triggered response
- vNext now: src/app/api/auth/login/start/route.ts:28-39 returns attempt metadata not same message
- Fix: Render sending OTP success copy and channel information intentionally.
