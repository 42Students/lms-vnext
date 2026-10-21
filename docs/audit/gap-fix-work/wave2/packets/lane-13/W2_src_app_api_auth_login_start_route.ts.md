# Work packet (wave 2): edit src/app/api/auth/login/start/route.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/public-e2e-auth-controller.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-20/index.md

## G2-1-005-010  [P2] GAP  facet F06  effort S
- Legacy: `PublicE2eAuthController.java:95-103` accepts `phone` string, strips non-digits; empty → `PHONE_REQUIRED`.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17` strict `{channel,contact}`; `login-service.ts:207-212` normalizes E.164.
- Fix: Update test-fixture input shape and normalize phone consistently.

## G2-1-006-002  [P2] GAP  facet F01  effort M
- Legacy: `PublicMobileAuthController.java:252-299` separate email-login start/send, `:457-538` recruiter email start.
- vNext now: `login/start/route.ts:14-43` one `channel=EMAIL` flow for all; `login-service.ts:302-335` canonical user lookup.
- Fix: Map old recruiter/email entrypoints and profile selection for multiple memberships.

## G2-1-006-006  [P2] GAP  facet F03  effort M
- Legacy: `PublicMobileAuthController.java:168-186` single account auto-sends OTP; `:198-234` multiple accounts require Continue choice.
- vNext now: `login/start/route.ts:29-39` starts OTP immediately; `verify/route.ts:69-79` may auto select membership for singleton.
- Fix: Move chooser actions after OTP and preserve explicit Continue on multiple.

## G2-1-006-008  [P2] GAP  facet F03  effort M
- Legacy: `PublicMobileAuthController.java:457-538` dedicated recruiter email button on college address.
- vNext now: `login/start/route.ts:14-17` channel selector supports EMAIL but no recruiter-specific route.
- Fix: Preserve recruiter sign-in affordance and contextual company email help.

## G2-1-006-015  [P2] GAP  facet F06  effort M
- Legacy: `MobileAuthStartRequest.java` phone body; `PublicMobileAuthController.java:148-150` normalizePhone or `Phone required`.
- vNext now: `login/start/route.ts:14-17` requires strict `channel,contact`, `login-service.ts:207-212` normalizes +91 and E164.
- Fix: Migrate payload and ensure Indian phone normalization parity.

## G2-1-006-016  [P2] GAP  facet F06  effort M
- Legacy: `PublicMobileAuthController.java:237-243,252-295` email sign-in request `email,choiceId,key`, invalid `INVALID_EMAIL`.
- vNext now: `login/start/route.ts:14-17` `contact` min3 max254 plus `channel:EMAIL`, service `:215-217` email schema.
- Fix: Replace old selector keys and expose invalid email inline.

## G2-1-013-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:7-11`: recruiter email request DTO posted /recruiter/email-login/start.
- vNext now: `src/app/api/auth/login/start/route.ts:14-31`: generic /api/auth/login/start with channel EMAIL/contact.
- Fix: Map recruiter route to generic POST while retaining recruiter-specific authorization.

## G2-1-013-007  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:9-11`: required email string, no other fields.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17`: channel enum and contact string required.
- Fix: Translate `{email}` into `{channel:'EMAIL',contact:email}`.

## G2-1-013-009  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:10-11`: @NotBlank with no declared max.
- vNext now: `src/modules/auth/login-service.ts:205`: maximum 254; `src/app/api/auth/login/start/route.ts:16`: contact max254.
- Fix: Show field-level length error; avoid email truncation.

## G2-1-013-011  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/RecruiterEmailLoginStartRequest.java:9-11`: body only email @NotBlank.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17`: strictObject requires channel and contact, rejects extra email field.
- Fix: Publish request body mapping and client compatibility.

## G2-1-008-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:59`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:202-204`: /api/v1/users and /users aliases; GET /login initiates OTP.
- vNext now: `src/app/api/auth/login/start/route.ts:14-29`: strict JSON POST /api/auth/login/start.
- Fix: Migrate callers to POST; reject legacy query OTP data securely.

## G2-1-008-030  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:204-211`: GET phoneNumber untyped with trim and required message.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17`,`src/modules/auth/login-service.ts:207-212`: strict channel/contact and E.164 normalization.
- Fix: Define phone normalization and field error/validation parity.

## G2-1-008-047  [P2] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:202-272`: login sends SMS and writes preuser/faculty/learner OTP verification state.
- vNext now: `src/app/api/auth/login/start/route.ts:19-39`,`src/modules/auth/login-service.ts:338-370`: creates attempt and sends SMS/email.
- Fix: Map OTP storage, delivery failure and resend state across flows.

## G2-20-006-040  [P2] GAP  facet F10  effort L
- Legacy: Legacy OTP uses mobileAuthStart/send/verify and email fallback; `docs/legacy-source/frontend/src/loginPages/Login.js:15-16,934-936`
- vNext now: New POST /api/auth/login/start, verify, email endpoint; `src/components/auth/login-form.tsx:225-228,255-264,285-291`, `src/app/api/auth/login/start/route.ts:19-43`
- Fix: Compare auth service/controller semantics and deliverability per tenant; UI may retain changed wire contract.

## G2-20-006-067  [P2] GAP  facet F21  effort L
- Legacy: Client services `getTenantBootstrap`, SMS/email OTP service and memberships, role path resolution; `docs/legacy-source/frontend/src/loginPages/Login.js:13-24`
- vNext now: New server tenant-domain service, branding service, signin policy, auth routes and login runtime; `src/app/page.tsx:9-12`, `src/app/api/auth/login/start/route.ts:28-41`
- Fix: Trace all middleware/server/runtime adapters, map auth errors, ensure equivalent sends and role choice.

## G2-1-005-012  [P3] GAP  facet F06  effort S
- Legacy: `PublicE2eAuthController.java:96-98` non-string phone yields 400 `phone must be a string`.
- vNext now: `src/app/api/auth/login/start/route.ts:14-17` Zod string+strict channel, returns standardized invalid request.
- Fix: Map tests asserting exact validation text to typed new request errors.

## G2-1-013-041  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:535-536`: logSlowMobileAuth records elapsed recruiter login start.
- vNext now: `src/app/api/auth/login/start/route.ts:35-38`: auditLogin event with channel and second-factor, no elapsed.
- Fix: Capture request latency and throttled delivery without raw email in logs.
