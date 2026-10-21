# Work packet: edit src/db/schema/db10-outbound-messages.draft.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-17/email-suppression-entity.md

## G2-18-014-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-23 — email suppression state shared across college contexts by emailNorm primary key.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:126-145 — distinct global hashed suppressions and tenant-local suppressions.
- Fix: Ensure all college EMAIL sending paths use the global suppression gate.

## G2-18-014-005  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:21-23 — raw normalized email address as primary key.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:140-142 — UUID PK and keyed HMAC recipient_hash.
- Fix: Use irreversible canonical global HMAC with stable key and migration crosswalk.

## G2-18-014-039  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — email_suppression raw email VARCHAR150 PK, reason nullable VARCHAR255, DATETIME created.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:137-161 — outbound_global_email_suppressions UUID ID, HMAC hash, reason enum, clearedAt.
- Fix: Write migration/verification map for raw addresses with privacy-safe rekey.

## G2-18-014-041  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — production DDL in V161.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:1-8 — DB10 definition labelled MIGRATION DRAFT ONLY; runtime gate enforced.
- Fix: Register production schema and pass disposable PostgreSQL migration replay.

## G2-17-015-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-23 — Global email suppression table, one normalized email key without tenant.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:127-151 — Separate EMAIL-only HMAC global table in unregistered draft.
- Fix: Register and verify global HMAC suppression migration and dispatch checks.

## G2-17-015-044  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — MySQL email_suppression(email_norm PK, reason, created_at).
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:127-158 — Unregistered draft outbound_global_email_suppressions(hash,reason,clearedAt, timestamps).
- Fix: Register migration, backfill legacy addresses to keyed HMAC, validate no duplicate.
