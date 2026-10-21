# Work packet (wave 2): edit src/db/schema/db01-auth-handoffs.staged.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/auth-controller.md, docs/audit/gap2/lane-1/auth-handoff-token.md

## G2-1-002-072  [P2] GAP  facet F22  effort M
- Legacy: `AuthHandoffToken.java:10-28` JPA `auth_handoff_token` stores raw access/refresh token and used/expiry; `AuthController.java:319-331,514-519` writes/reads.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts` candidate is staged, not live; `src/app/auth/handoff/page.tsx:3-8` retired; `drizzle/0056_identity_auth_sessions.sql:41-72` uses session digest.
- Fix: Do not port raw-token storage; document secure alternative or explicit removal in migration disposition.

## G2-1-014-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AuthHandoffToken.java:27-28`: used Boolean defaults false.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:48-49`: consumedAt nullable timestamp instead of boolean.
- Fix: Implement atomic consumedAt write when promoting staged schema.

## G2-1-014-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V60__auth_handoff_token.sql:5-8`: inherited id INT, createdAt, updatedAt, isDeleted.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:30-49`: UUID id, createdAt, no soft-delete, no updatedAt.
- Fix: Define cleanup deletion and old ID migration exclusion explicitly.

## G2-1-014-017  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AuthHandoffTokenRepository.java:32-33`: cleanup softDeletes used/expired rows.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:27-89`: staged schema lacks cleanup routine.
- Fix: Schedule hard-delete expired/consumed MACs after required audit retention.

## G2-1-014-029  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AuthHandoffTokenCleanupService.java:26-35`: daily 02:15 scheduled soft-delete expired/used rows.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:1-3`: staged schema not exported/migrated, no active cleanup job.
- Fix: Add cleanup only if new table becomes active; assess legacy secrets retention separately.

## G2-1-014-043  [P2] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V60__auth_handoff_token.sql:16-17`: token unique index and (expires_at,used) cleanup index.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:67-71`: codeMac unique, user/expiry and domain/expiry indexes.
- Fix: Add consumed/expiry maintenance index if activating handoff.

## G2-1-014-049  [P2] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V60__auth_handoff_token.sql:4-17`: MySQL auth_handoff_token raw text token pair plus expiry/used and soft-delete.
- vNext now: `src/db/schema/db01-auth-handoffs.staged.ts:27-89`: staged Postgres identity_auth_handoffs user/membership/domain/FK/MAC/consumedAt.
- Fix: Preserve explicit disposition: retired table versus proposed new schema, not falsely mark migrated.
