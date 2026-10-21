# Work packet (wave 2): edit src/modules/auth/login-service.ts (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-1/recruiter-email-login-start-request.md, docs/audit/gap2/lane-20/learner-verification.md

## G2-15-027-067  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:79-92 optional TestOtp, AppSettingsService rate policy, RestTemplate
- vNext now: src/modules/auth/login-service.ts:298-381 OTP config, test contacts guarded by development
- Fix: Reconcile per-college auth settings and safe test-contact behavior with legacy.

## G2-1-013-008  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:471-477`: trims and lowercases before simple email regex.
- vNext now: `src/modules/auth/login-service.ts:205-216`,`src/modules/auth/login-service.ts:296-301`: trims/lowercases with zod email.
- Fix: Document edge cases accepted by legacy regex but rejected by stricter parser.

## G2-20-018-031  [P3] GAP  facet F18  effort S
- Legacy: Legacy field verify_status and OTP controls no directly authored UI text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:19-34`
- vNext now: New OTP_EXPIRED and INCORRECT_OTP typed codes `src/modules/auth/login-service.ts:46-77`
- Fix: Verify precise customer-facing copy in login state mapping
