# Work packet (wave 2): edit src/db/schema/db10-outbound-messages.draft.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-17/email-suppression-entity.md

## G2-18-014-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:1-9 — Spring Data JpaRepository entry point for global email suppression.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:137-149 — vNext global email suppression table is HMAC keyed; no JPA-style persistence repository.
- Fix: Document repository-to-service adapter for privileged suppression lookup.

## G2-18-014-006  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:25-30 — reason nullable string; createdAt LocalDateTime.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:142-149 — reason mandatory enum and createdAt timestamptz.
- Fix: Backfill null reasons and preserve source timestamp zone.

## G2-18-014-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — email_norm max150, reason max255.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:141-142 — recipientHash max64, reason max24.
- Fix: Map long legacy freeform reasons to bounded enum plus migration notes.

## G2-18-014-008  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:11-12 — inherited repository find by primary-key email; no sort/list constraint.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:145-160 — scoped active-row lookup via recipientHash, clearedAt is null.
- Fix: Provide authorized history/lookup by HMAC rather than raw email.

## G2-18-014-010  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:25-26 — reason may be null.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:142-143 — reason mandatory and limited to choices.
- Fix: Use explicit migration fallback reason for null legacy rows.

## G2-18-014-030  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13 — human-facing meanings 'Not hiring this season' / 'Stop all emails'.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:155-160 — explicit UNSUBSCRIBED/BOUNCE/COMPLAINT reason values.
- Fix: Map source reason descriptions and user-facing status labels.

## G2-18-014-035  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:348 — MySQL DATETIME local zone, no clearedAt.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:145-160 — Postgres timestamptz and optional clear date.
- Fix: Convert old local timestamps to UTC deterministically and audit clear events.

## G2-17-015-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-13 — Two example reasons `Not hiring this season` and `Stop all emails`.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:137-158 — Normalized reason enum allows UNSUBSCRIBED/BOUNCE/COMPLAINT.
- Fix: Map legacy free-text reasons to typed code plus optional note.

## G2-17-015-007  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:21-30 — emailNorm plaintext String PK, reason nullable, createdAt LocalDateTime.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:137-158 — recipientHash HMAC, reason enum, timestamp-with-zone and clearedAt.
- Fix: Preserve suppression history via stable keyed canonical-email migration.

## G2-17-015-008  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — email_norm VARCHAR(150), reason VARCHAR(255), created_at DATETIME.
- vNext now: src/db/schema/db10-outbound-messages.draft.ts:137-158 — recipientHash varchar64, no raw email, reason constrained.
- Fix: Validate long-address canonicalization, size and import mappings.
