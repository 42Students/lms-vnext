# Work packet: edit src/modules/auth/login-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-1/mobile-auth-email-fallback-send-request.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-1/public-mobile-auth-controller.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md

## G2-1-036-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:50-52,145-231: find eligible accounts by phone, return choices when multiple.
- vNext now: src/modules/auth/login-service.ts:292-306: resolve canonical user by phone/email, lists user's memberships after verification.
- Fix: Crosswalk multiple legacy IDs to one identity with membership choices.

## G2-1-036-011  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:252-295: email-first login returns selectable choice key for duplicate accounts.
- vNext now: src/modules/auth/login-service.ts:292-321: one canonical user tied to email, with memberships list after verify.
- Fix: Support same-email multi-college legacy users explicitly.

## G2-1-032-078  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:600-645: legacy accountChoices and stable choiceKey refer numeric role-specific users.
- vNext now: src/modules/auth/login-service.ts:244-289: canonical users/membership table; no same account choice payload.
- Fix: Create explicit mapping of legacy account choice to canonical membership selection.

## G2-1-012-021  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:585-590`: code expires 5 min from email-send time.
- vNext now: `src/modules/auth/login-service.ts:449-453`: returns ATTEMPT_LIFETIME_SECONDS instead.
- Fix: Ensure email code expiry independently honors 300s even near attempt expiration.

## G2-1-019-041  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:479-497: recruiter email only on college domain and work email; fake attempt response for ineligible recruiter.
- vNext now: src/modules/auth/login-service.ts:244-289,303-309: recruiter grant scoped, but public unknown contact returns NOT_REGISTERED.
- Fix: Review recruiter enumeration/privacy parity and restrict college-host recruiter method as necessary.

## G2-1-006-021  [P1] GAP  facet F07  effort M
- Legacy: `PublicMobileAuthController.java:483-488` recruiter global host `RECRUITER_COLLEGE_ADDRESS` and disposable email `COMPANY_EMAIL_REQUIRED`.
- vNext now: `login-service.ts:244-289` generic person membership/tenant guard; no direct recruiter global-address error in login start.
- Fix: Add explicit recruiter-specific host and work-email guidance without account enumeration.

## G2-1-006-032  [P1] GAP  facet F10  effort L
- Legacy: `PublicMobileAuthController.java:817-822` pending recruiter invite can auto-accept on verified email sign-in.
- vNext now: `login-service.ts:244-289,483-588` authenticates canonical user; recruiter invite grants handled by separate workflow.
- Fix: Verify/recreate approved invite acceptance transition on first recruiter college sign-in without unintended grants.

## G2-1-006-035  [P1] GAP  facet F11  effort L
- Legacy: `PublicMobileAuthController.java:479-498` recruiter restricted to college domain and active grant/pending invite.
- vNext now: `login-service.ts:244-289` membership active state, no distinct pending invite check in shared login path.
- Fix: Trace recruiter invited-but-not-accepted path and enforce college-specific invitation/grant policy.

## G2-1-006-042  [P1] GAP  facet F13  effort M
- Legacy: `PublicMobileAuthController.java:495-498` unauthorized recruiter email gets dummy attemptId, no code sent (anti-enumeration).
- vNext now: `login-service.ts:302-307` nonregistered user -> NOT_REGISTERED, ordinary error mapping.
- Fix: Decide anti-enumeration contract for recruiter emails, restore indistinguishable response if threat model requires.

## G2-1-006-061  [P1] GAP  facet F23  effort L
- Legacy: `PublicMobileAuthController.java:817-822` verified recruiter email can accept pending college invite during sign-in.
- vNext now: `login-service.ts:244-289,483-588` general canonical user check, no equivalent invite acceptance step mapped.
- Fix: Verify intent and build explicit secure acceptance transition or separate invitation action.

## G2-1-006-063  [P1] GAP  facet F23  effort L
- Legacy: `PublicMobileAuthController.java:479-498` recruiter email must corporate on college host and dummy responses for denied identity.
- vNext now: `login-service.ts:302-307` canonical contact-based lookup with no recruiter host UX.
- Fix: Enforce recruiter tenant/grant/corporate policy and anti-enumeration via verified identity and membership.

## G2-1-013-021  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:490-497`: suspended/not-granted/unrecognized recruiter returns fake unused UUID success to resist enumeration.
- vNext now: `src/modules/auth/login-service.ts:303-309`: unknown user throws NOT_REGISTERED before createAttempt.
- Fix: Use uniform unauthorized-recruiter response with nonfunctional challenge and no timing leak.

## G2-1-013-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:486-488`: corporate domain restriction applies before account lookup.
- vNext now: `src/modules/auth/login-service.ts:303-309`: lookup canonical user by email, no corporate-domain guard in start path.
- Fix: Apply recruiter-only domain policy pre/post lookup without revealing account status.

## G2-1-013-035  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: fake success must not send email to unauthorized user.
- vNext now: `src/modules/auth/login-service.ts:303-370`: returns not registered or throws before email send.
- Fix: Keep no-send behavior but equalize public response to defend enumeration.

## G2-1-013-043  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:483-488`: tenant inference and corporate-domain restriction checked on every start.
- vNext now: `src/modules/auth/login-service.ts:309-313`: session/host proof, normalized email fingerprint.
- Fix: Test global, wrong college, no active grant, pending invite and personal domain cases.

## G2-1-013-049  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: fake success on unauthorized recruiter protects roster privacy.
- vNext now: `src/modules/auth/login-service.ts:307-309`: visible NOT_REGISTERED/NO_ACCOUNT_FOR_DOMAIN errors.
- Fix: Keep anti-enumeration behavior and security reviewed user-facing message.

## G2-1-008-043  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:195-199`: `OTP lockout cleared`.
- vNext now: NONE in src; `src/modules/auth/login-service.ts:354-355`: no reset action.
- Fix: On authorized unlock display exact feedback and actor audit.

## G2-1-008-061  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:246-252`: faculty-first lookup; unscoped if no collegeId.
- vNext now: `src/modules/auth/login-service.ts:244-289`: resolved host scope and selected membership.
- Fix: Test same phone across colleges/roles and ensure correct tenant chooser.

## G2-13-011-032  [P1] GAP  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-22` ZeptoMail interface shared by dispatcher; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155` job/course/pre-login email event sends
- vNext now: `src/modules/messaging/providers.ts:26-60` generic outbound mail but event registry mapping not shown; `src/modules/auth/login-service.ts:363-370` OTP only
- Fix: Inventory and wire all legacy non-OTP transactional event sends to vNext adapters

## G2-1-023-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-55: false when no verified record, not a thrown error.
- vNext now: src/modules/auth/login-service.ts:466-509: wrong/expired OTP throws LoginError.
- Fix: Separate passive email ownership status query from active login failure.
