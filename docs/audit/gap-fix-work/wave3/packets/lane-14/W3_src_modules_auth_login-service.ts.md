# Work packet (wave 3): edit src/modules/auth/login-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-1/user-controller.md

## G2-1-013-013  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-489`: rejects personal/disposable domain for recruiter.
- vNext now: `src/modules/auth/login-service.ts:296-309`: generic email lookup with no corporate-domain check here.
- Fix: Enforce recruiter-domain policy on recruiter grant sign-in path, not global student email.

## G2-1-013-030  [P1] MISSING  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-489`: personal/disposable blocklist via CompanyDomainService.
- vNext now: `src/modules/auth/login-service.ts:205-216`: generic valid-email syntax only.
- Fix: Port/retain reputable corporate domain allow/deny classification with exception process.

## G2-1-008-003  [P1] MISSING  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`: admin POST /admin/clear-otp-lockout clears by phone query.
- vNext now: NONE in src (search clearOtpLockout and clear-otp-lockout); `src/modules/auth/login-service.ts:338-355` enforces a new attempt budget.
- Fix: Create audited admin-only OTP lockout-reset service and UI.

## G2-1-008-051  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`: admin reset clears six rate-limit prefixes per phone.
- vNext now: NONE in new auth routes; `src/modules/auth/login-service.ts:338-355` enforces per-contact and address budgets.
- Fix: Implement scoped, logged reset across relevant counters without allowing cross-tenant abuse.

## G2-1-008-057  [P1] MISSING  facet F11  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:182-190`: superadmin/college admin clears global phone lockout.
- vNext now: NONE in new admin pages; `src/modules/auth/login-service.ts:338-355`: rate caps at contact and IP level.
- Fix: Scope unlock to authorized admins, reason, audit and anti-enumeration.
