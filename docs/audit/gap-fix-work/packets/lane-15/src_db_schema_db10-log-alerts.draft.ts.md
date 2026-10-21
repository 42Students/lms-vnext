# Work packet: edit src/db/schema/db10-log-alerts.draft.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md, docs/audit/gap2/lane-14/u018-log-alert-state.md

## G2-15-018-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:14-17 — JPA entity backs log-alert-signature known errors.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:30-32 — db10LogAlertSignatures maps plural log_alert_signatures; in DRAFT ONLY module.
- Fix: Register DB10 migrations/export prior to declaring feature live.

## G2-15-018-006  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:19-27 — Long AUTO_INCREMENT PK, env and hash strings.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:33-35 — UUID PK and explicit 32/64 string lengths.
- Fix: Migrate numeric signature IDs to UUID, preserve external issue links.

## G2-15-018-044  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — table singular log_alert_signature, BIGINT id, unique env+hash.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:30-78 — plural table, UUID id, same uniqueness, extra guard checks.
- Fix: Register transformed migration and provide ID crosswalk.

## G2-15-018-049  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — operational table created by executed migration.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:1-9 — schema file labelled DRAFT ONLY, no runtime producer claimed by draft.
- Fix: Verify registered migration+schema barrel before deployment.

## G2-14-018-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy log_alert_state bigint auto id, unique state_key, two timestamp fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:19-30`
- vNext now: New log_alert_states UUID, varchar64, timestamps with zone plus page/digest/burst fields `src/db/schema/db10-log-alerts.draft.ts:101-117`
- Fix: Preserve key/cursor/view timestamps in migration; IDs can be regenerated

## G2-15-018-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:44-46 — fixStatus required OPEN, no DB enum check in V164.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:70-76 — only OPEN/FIXED/EXPECTED, FIXED requires fixedAt.
- Fix: Migrate unknown status and backfill fixed timestamp.
