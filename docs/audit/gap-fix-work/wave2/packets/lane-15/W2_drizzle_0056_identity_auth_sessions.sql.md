# Work packet (wave 2): edit drizzle/0056_identity_auth_sessions.sql

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/auth-token.md, docs/audit/gap2/lane-1/email-verification-token-repository.md, docs/audit/gap2/lane-1/email-verification-token.md, docs/audit/gap2/lane-1/mobile-login-attempt.md, docs/audit/gap2/lane-1/user-session.md

## G2-1-002-072  [P2] GAP  facet F22  effort M
- Legacy: `AuthHandoffToken.java:10-28` JPA `auth_handoff_token` stores raw access/refresh token and used/expiry; `AuthController.java:319-331,514-519` writes/reads.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts` candidate is staged, not live; `src/app/auth/handoff/page.tsx:3-8` retired; `drizzle/0056_identity_auth_sessions.sql:41-72` uses session digest.
- Fix: Do not port raw-token storage; document secure alternative or explicit removal in migration disposition.

## G2-1-015-029  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:248-255: five columns id, created_at, is_deleted, updated_at, token.
- vNext now: src/db/schema/identity-device-sessions.ts:20-45 and drizzle/0056_identity_auth_sessions.sql:41-72: different table, no literal auth_token replacement.
- Fix: Record field-by-field retirement; prove no native/external consumers and secure owner approval.

## G2-1-023-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1293-1306 email_verification_token has token, application_id, created_at, email, expires_at, verified, verified_at with PK+indexes.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52 and drizzle/0056_identity_auth_sessions.sql:1-40 create identity_auth_attempts instead.
- Fix: Produce seven-column disposition and independent verified-email model decision.

## G2-1-016-045  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1293-1306: seven columns token, application_id, created_at, email, expires_at, verified, verified_at; PK and four indexes.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52 and drizzle/0056_identity_auth_sessions.sql:1-40: distinct identity_auth_attempts schema; no email_verification_token table.
- Fix: Produce seven-field disposition with evidence of link-verification ownership and approved retirement.

## G2-1-019-064  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:1988-2010: 18 columns incl integer id, plaintext phone/OTP/emailOtp, nullable org/college, used bit and verification_attempts.
- vNext now: src/db/schema/identity-auth-attempts.ts:22-52: UUID user/college/member, hashed contact+OTP, resend/version/timestamps; drizzle/0056_identity_auth_sessions.sql:1-40.
- Fix: Record every legacy column disposition and known owner-approved privacy reductions.

## G2-1-022-049  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3322-3334 has 9 columns jti,user_id,user_type,device_name,user_agent,ip_address,created_at,last_used_at,expires_at.
- vNext now: src/db/schema/identity-device-sessions.ts:20-38 and drizzle/0056_identity_auth_sessions.sql:41-72 replace with UUID/digest and revocation columns.
- Fix: Record nine-column disposition including role, ID, lastUsedAt and direct JTI retirement.

## G2-1-015-031  [P3] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V24__add_auto_increment_to_all_tables.sql:64-66: conditional old ID auto-increment.
- vNext now: drizzle/0056_identity_auth_sessions.sql:41-72: UUID session table; no legacy row import.
- Fix: Document deliberate no-import choice after external consumer audit.

## G2-1-018-037  [P3] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V24__add_auto_increment_to_all_tables.sql:60-62: conditional auto-increment migration touches login_user if it exists.
- vNext now: drizzle/0056_identity_auth_sessions.sql:1-72: creates auth attempts and sessions, no old password table import.
- Fix: Document deliberate no-copy decision and migration safeguards.
