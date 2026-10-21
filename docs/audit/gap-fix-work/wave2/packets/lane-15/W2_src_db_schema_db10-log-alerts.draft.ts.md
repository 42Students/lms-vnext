# Work packet (wave 2): edit src/db/schema/db10-log-alerts.draft.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md, docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md, docs/audit/gap2/lane-14/u018-log-alert-state.md

## G2-1-017-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:10-17: log_alert_signature_account fields signature_id BIGINT FK cascade, account_id BIGINT, first_seen_at TIMESTAMP; composite PK.
- vNext now: drizzle/0133_lanes_round_1.sql:180-187 and src/db/schema/db10-log-alerts.draft.ts:80-98: plural table with signature UUID FK cascade, account HMAC VARCHAR64 checked, first_seen_at timestamptz, composite PK.
- Fix: Explicitly document 3-field migration/crosswalk; never import raw account IDs into HMAC columns without trusted mapping.

## G2-15-018-047  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:11-12, LT:7-12 — MySQL TIMESTAMP persistence.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:37-38,44,49 — PostgreSQL timestamptz.
- Fix: Map UTC timestamps to avoid shifting firstSeen/fixedAt.

## G2-14-018-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy ID Long auto, state_key unique, timestamps Instant nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:19-30`
- vNext now: New ID UUID, stateKey varchar64 unique, timestamp with timezone `src/db/schema/db10-log-alerts.draft.ts:101-116`
- Fix: Map old key/ID and timestamp precision in migration

## G2-14-018-012  [P2] GAP  facet F06  effort S
- Legacy: Legacy state key required unique but no length declared `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:23-24`
- vNext now: New stateKey varchar64, nonblank check `src/db/schema/db10-log-alerts.draft.ts:103-117`
- Fix: Audit keys >64 before migration

## G2-14-018-013  [P2] GAP  facet F06  effort S
- Legacy: Legacy null cursor allowed initial bootstrap `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:26-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:94-105`
- vNext now: New poll cursor nullable and first-run 10-minute lookback `src/db/schema/db10-log-alerts.draft.ts:103-105` `src/modules/log-alerts/scheduler.ts:180-195`
- Fix: Align first-poll lookback; avoid alerting historical errors

## G2-15-018-046  [P3] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:8-10 — env varchar32/hash char64/sample varchar500.
- vNext now: src/db/schema/db10-log-alerts.draft.ts:34-36 — env varchar32/hash varchar64/sample varchar500.
- Fix: Normalize CHAR64 padding semantics for migration.
