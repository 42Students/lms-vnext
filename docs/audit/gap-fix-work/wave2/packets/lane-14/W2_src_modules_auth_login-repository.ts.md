# Work packet (wave 2): edit src/modules/auth/login-repository.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/email-verification-token-repository.md, docs/audit/gap2/lane-1/email-verification-token.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-20/learner-verification.md

## G2-1-023-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:26,35,44: lookups by raw UUID/email/applicationID; no controller invocation found by symbol search.
- vNext now: src/modules/auth/login-repository.ts:216-235 only loads login attempts by UUID; no application email-verification lookup.
- Fix: Add scoped proof link feature if still product-required; otherwise approve formal retirement.

## G2-1-023-006  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:35: findByEmail(String) case-sensitive equality semantics implied by repository method.
- vNext now: src/modules/auth/login-repository.ts:45-51 lower(email) canonical user lookup, not verification-link lookup.
- Fix: Decide email normalization for any reinstated verification-link API.

## G2-1-023-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:26,35,44: three independent Optional lookups without ORDER BY.
- vNext now: src/modules/auth/login-repository.ts:216-235 selects by id LIMIT1; vNext no application lookup.
- Fix: Define deterministic last-created ACTIVE link when same email/application has multiple tokens.

## G2-1-023-012  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-55: COUNT verified for email, no age/application scope.
- vNext now: src/modules/auth/login-repository.ts:216-235 attempt by id, no general email-is-verified search.
- Fix: Determine if legacy clients rely on permanent verified email state.

## G2-1-016-016  [P2] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-55: isEmailVerified counts any verified token for exact email, regardless age/application.
- vNext now: src/modules/auth/login-repository.ts:216-235: OTP attempt lookup only; no persistent isEmailVerified(email) contract.
- Fix: Determine whether application/email verification state is still needed; define actor/application-scoped proof.

## G2-1-016-024  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:26,35,44,55: repository supports token, email, application and verified email queries.
- vNext now: src/modules/auth/login-repository.ts:216-235: user-bound login attempt by UUID, no application query.
- Fix: Document producer/consumer evidence for verification link and, if active, build independent service.

## G2-1-019-021  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/MobileLoginAttemptRepository.java:23-25: email-first count active by (user_type,user_id).
- vNext now: src/modules/auth/login-repository.ts:166-194: count by canonical contact HMAC, plus address and total.
- Fix: Check whether one user with different email/phone can exceed old per-account send budget.

## G2-20-018-010  [P2] GAP  facet F05  effort S
- Legacy: Legacy latest unexpired OTP by updated_at DESC limit1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerAccountVerificationRepository.java:11-21`
- vNext now: New attempt lookup by UUID, no latest-phone query `src/modules/auth/login-repository.ts:216-235`
- Fix: Explicitly invalidate old attempt after restart/resend

## G2-20-018-021  [P2] MISSING  facet F10  effort S
- Legacy: Legacy alternate OTP by learner ID [S:171-188,Q:15-17]
- vNext now: New attemptId required, no learner ID verification endpoint `src/modules/auth/login-repository.ts:216-235`
- Fix: Replace alternate caller with nonce-based verification

## G2-1-023-009  [P3] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:65-67: expiry deletion compares `expiresAt < now` only when verified=false.
- vNext now: src/modules/auth/login-repository.ts:238-256: conditional resend/expiry; no corresponding verification-link record.
- Fix: Define retention and purge for both used/unused verification evidence.

## G2-1-023-014  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:75-77: `deleteByEmail` deletes every token row for address, no cap.
- vNext now: src/modules/auth/login-repository.ts:238-256 resends update one challenge by id, not every email row.
- Fix: Require scoped invalidation semantics and avoid deleting other applications' proofs.

## G2-1-016-014  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:35: findByEmail gives one Optional despite possible multiple rows per email.
- vNext now: src/modules/auth/login-repository.ts:45-51: case-insensitive user email lookup; attempt lookup by id at 216-235.
- Fix: Decide deterministic newest/pending token semantics if old link workflow resumes.

## G2-1-019-019  [P3] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/MobileLoginAttemptRepository.java:17-18: query attemptId requires is_deleted=0 OR NULL; LIMIT 1.
- vNext now: src/modules/auth/login-repository.ts:216-235: keyed id lookup; usedAt checked by service at 391-400.
- Fix: Confirm historical deleted rows excluded when reconciling; active vNext has no soft-deletes.
