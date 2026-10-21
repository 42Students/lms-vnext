# Work packet (wave 2): edit src/db/schema/identity-device-sessions.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-token.md, docs/audit/gap2/lane-1/refresh-token-blocklist.md, docs/audit/gap2/lane-1/user-session.md

## G2-1-015-029  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:248-255: five columns id, created_at, is_deleted, updated_at, token.
- vNext now: src/db/schema/identity-device-sessions.ts:20-45 and drizzle/0056_identity_auth_sessions.sql:41-72: different table, no literal auth_token replacement.
- Fix: Record field-by-field retirement; prove no native/external consumers and secure owner approval.

## G2-1-020-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:2884-2893: table has exactly 5 columns, no created/updated soft delete.
- vNext now: src/db/schema/identity-device-sessions.ts:20-38: id,userId,digest,device metadata,created,last seen,expiry,revoker and reason.
- Fix: Document 5-field old table retirement vs active-session redesign; do not migrate obsolete JTI records.

## G2-1-020-050  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:2884-2893: five columns jti varchar36 PK; user_id int; user_type varchar20; blocked_at timestamp default now nullable; expires_at timestamp required, indexed.
- vNext now: src/db/schema/identity-device-sessions.ts:20-45, M:41-72: identity_device_sessions different UUID/digest-backed table; no blacklist migration.
- Fix: Produce explicit five-column disposition; do not copy stale JWT blacklist rows.

## G2-1-022-049  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:3322-3334 has 9 columns jti,user_id,user_type,device_name,user_agent,ip_address,created_at,last_used_at,expires_at.
- vNext now: src/db/schema/identity-device-sessions.ts:20-38 and drizzle/0056_identity_auth_sessions.sql:41-72 replace with UUID/digest and revocation columns.
- Fix: Record nine-column disposition including role, ID, lastUsedAt and direct JTI retirement.

## G2-1-015-006  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/test/resources/db/mysql-schema-snapshot.sql:250-252: created_at/updated_at DATETIME(6) nullable.
- vNext now: src/db/schema/identity-device-sessions.ts:31-34: timezone-aware created, last-seen, expires and revoked; no updated_at.
- Fix: Decide separate disposition of updated_at; do not equate it to last_seen_at.
