# Work packet (wave 2): edit src/db/schema/identity-auth-attempts.ts

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/email-verification-token-repository.md, docs/audit/gap2/lane-1/email-verification-token.md, docs/audit/gap2/lane-1/login-user.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-20/learner-verification.md

## G2-1-023-007  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:44: findByApplicationId(String) links verification token to particular application.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52 lacks applicationId; college/membership IDs are not equivalent.
- Fix: Map application ownership and status proof if workflow must survive.

## G2-1-023-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-55: isEmailVerified returns boolean true if any verified record for same email.
- vNext now: src/db/schema/identity-auth-attempts.ts:50-51 verifiedAt/usedAt only on one-time login challenge; no durable verified-email boolean.
- Fix: Persist email ownership proof independently from session if needed.

## G2-1-023-010  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:36-38: token 36-char UUID unique PK, 43-44 raw email, 50-51 applicationId optional.
- vNext now: src/db/schema/identity-auth-attempts.ts:25-35: id/userId/collegeId/memberId/contact HMAC instead of raw email/application.
- Fix: Explicitly disposition raw email, application link and UUID bearer field.

## G2-1-023-027  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:15-19: 24h default expiry on verification link.
- vNext now: src/db/schema/identity-auth-attempts.ts:119-120 <=5min for OTP attempt.
- Fix: Do not collapse distinct link and login TTL; decide explicit feature support.

## G2-1-023-028  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-55: verified status persists even after expiry.
- vNext now: src/db/schema/identity-auth-attempts.ts:50-51 usedAt/verifiedAt tied to expiring OTP.
- Fix: Implement durable ownership state only if required by product.

## G2-1-023-036  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:22-27 four indexes token/email/applicationId/expiry.
- vNext now: src/db/schema/identity-auth-attempts.ts:69-85 user/expiry, contact/IP/time and expiry indexes, no application index.
- Fix: Define indexes for verified application proof if kept.

## G2-1-023-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1293-1306 email_verification_token has token, application_id, created_at, email, expires_at, verified, verified_at with PK+indexes.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52 and drizzle/0056_identity_auth_sessions.sql:1-40 create identity_auth_attempts instead.
- Fix: Produce seven-column disposition and independent verified-email model decision.

## G2-1-016-007  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:50-51 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1295: application_id nullable VARCHAR36 permits application association.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52: only user/college/membership, no application_id and no email-verification application flow.
- Fix: Trace application-specific consumers; if required add scoped applicationId association with immutable ownership.

## G2-1-016-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:57-58 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1298: expires_at nonnull LocalDateTime.
- vNext now: src/db/schema/identity-auth-attempts.ts:49: expiresAt nonnull timestamptz, limited to 5m by 118-120.
- Fix: Do not alias legacy 24-hour verification link to 5-minute login OTP; document distinct policy.

## G2-1-016-012  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:22-27 and docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1301-1305: PK token plus idx_token, idx_email, idx_application_id, idx_expires_at.
- vNext now: src/db/schema/identity-auth-attempts.ts:69-85: indexes user/expiry, fingerprint/time, expiry, IP/time; no application/email index.
- Fix: Map required application/email lookup queries separately; do not expose raw email in auth-attempt index.

## G2-1-016-015  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:44: findByApplicationId returns Optional but no UNIQUE constraint.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52: no application ID field.
- Fix: Add well-scoped application lookup only if source consumer verified; otherwise record retirement.

## G2-1-016-018  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:17,54-58: documented default token expiry 24 hours; no DB constraint bounding TTL.
- vNext now: src/db/schema/identity-auth-attempts.ts:118-120: five-minute ceiling CHECK, src/modules/auth/login-service.ts:32: 300 seconds.
- Fix: Avoid falsely describing OTP as 24-hour email link; decide whether independent link verification feature is required.

## G2-1-016-030  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:15-19: declared lifecycle 24h default, verified true after use and scheduled cleanup; implementation not located.
- vNext now: src/db/schema/identity-auth-attempts.ts:47-51,118-134: challenge <=5m, usedAt requires verifiedAt and null code HMAC.
- Fix: Separate long-link verification and short-lived login OTP business rules; owner to decide support.

## G2-1-016-045  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1293-1306: seven columns token, application_id, created_at, email, expires_at, verified, verified_at; PK and four indexes.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52 and drizzle/0056_identity_auth_sessions.sql:1-40: distinct identity_auth_attempts schema; no email_verification_token table.
- Fix: Produce seven-field disposition with evidence of link-verification ownership and approved retirement.

## G2-1-016-047  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/EmailVerificationToken.java:22-27: idx_token/email/application_id/expires_at; docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:53-67: active query/purge needs.
- vNext now: src/db/schema/identity-auth-attempts.ts:69-85: fingerprint/IP/user/expiry indexes; no email/application indexes.
- Fix: Reconcile index/query patterns if application-verification flow is retained.

## G2-1-018-035  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1975-1983: six cols id INT PK, created_at DATETIME nullable, is_deleted TINYINT default0, updated_at DATETIME nullable, password VARCHAR255 nullable, user_name VARCHAR255 nullable.
- vNext now: src/db/schema/users.ts:12-31: users has UUID identity and contact fields, no login_user table; src/db/schema/identity-auth-attempts.ts:22-52/T:20-38 add HMAC challenges and sessions.
- Fix: Record explicit six-field retirement/disposition, prove no active SQL consumers, obtain owner signoff.

## G2-1-019-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/MobileLoginAttempt.java:38-42, docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:2003-2004: user_type varchar16 and numeric user_id; LEARNER/FACULTY/RECRUITER.
- vNext now: src/db/schema/identity-auth-attempts.ts:26-33: UUID userId and targetRole varchar24, collegeId/membershipId with FKs.
- Fix: Map legacy role discriminator and separate source account IDs to canonical user+membership.

## G2-1-019-014  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/MobileLoginAttempt.java:44-48, docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1994,1998: nullable numeric collegeId and organizationId.
- vNext now: src/db/schema/identity-auth-attempts.ts:29-32: UUID collegeId/member, no organizationId stored.
- Fix: Define tenant organization derivation through college and preserve scoped authorization.

## G2-1-019-017  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:2006: verification_attempts INT NOT NULL default 0 absent from Java entity.
- vNext now: src/db/schema/identity-auth-attempts.ts:44-46: verificationAttempts default 0, resendAttempts 0 and version 1.
- Fix: Keep source migration/query contract in schema crosswalk even though JPA model omitted field.

## G2-1-019-064  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1988-2010: 18 columns incl integer id, plaintext phone/OTP/emailOtp, nullable org/college, used bit and verification_attempts.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52: UUID user/college/member, hashed contact+OTP, resend/version/timestamps; drizzle/0056_identity_auth_sessions.sql:1-40.
- Fix: Record every legacy column disposition and known owner-approved privacy reductions.

## G2-20-018-005  [P2] GAP  facet F03  effort S
- Legacy: Legacy verifyStatus boolean and incorrectAttempts int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:21-26`
- vNext now: New usedAt/verifiedAt and verificationAttempts budget `src/db/schema/identity-auth-attempts.ts:44-51`
- Fix: Project OTP remaining tries and verified state without leaking internal security fields

## G2-20-018-007  [P2] GAP  facet F04  effort S
- Legacy: Legacy learnerId int, phoneNumber string, rollNumber string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:15-18,33-34`
- vNext now: New userId UUID, membershipId UUID, contact fingerprint, no roll `src/db/schema/identity-auth-attempts.ts:25-38`
- Fix: Document identity crosswalk and alternate roll number loss

## G2-20-018-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy expired int, blockedTillTs string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerVerification.java:23-30`
- vNext now: New expiresAt/codeExpiresAt timestamptz `src/db/schema/identity-auth-attempts.ts:39-51`
- Fix: Define exact clock and expired state mapping

## G2-20-018-024  [P2] GAP  facet F12  effort S
- Legacy: Legacy verifyStatus false and isExpired0 initial `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:39-46`
- vNext now: New usedAt/verifiedAt NULL and expires<=5min `src/db/schema/identity-auth-attempts.ts:47-51,119-120`
- Fix: Map to explicit consumed/expired states

## G2-20-018-026  [P2] GAP  facet F13  effort S
- Legacy: Legacy expiry flag read from DB `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerAccountVerificationRepository.java:11-21`
- vNext now: New challenge expires at DB clock after five minutes `src/db/schema/identity-auth-attempts.ts:87-120`
- Fix: Allow restart on timeout and avoid false active state

## G2-20-018-034  [P2] GAP  facet F20  effort S
- Legacy: Legacy multiple rows by phone; newest wins `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerAccountVerificationRepository.java:11-21`
- vNext now: New challenges independent by UUID `src/db/schema/identity-auth-attempts.ts:22-52`
- Fix: Revoke prior unconsumed code after new challenge to bound guessing

## G2-1-023-029  [P3] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:65-67: expired verified rows excluded from purge.
- vNext now: src/db/schema/identity-auth-attempts.ts:77-85 temporal indexes for OTP attempts, no permanent verified token record.
- Fix: Document retention/expiry of verified ownership proof.

## G2-1-016-031  [P3] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/EmailVerificationTokenRepository.java:66-67: purge only expired AND unverified; verified rows retained by this method.
- vNext now: src/db/schema/identity-auth-attempts.ts:49-51: expired-at and used-at fields, no matching active verified-token row.
- Fix: Specify retention duration for successful verified-email evidence and minimize PII.
