# Work packet (wave 2): edit drizzle/0133_lanes_round_1.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md

## G2-1-017-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:10-17: log_alert_signature_account fields signature_id BIGINT FK cascade, account_id BIGINT, first_seen_at TIMESTAMP; composite PK.
- vNext now: drizzle/0133_lanes_round_1.sql:180-187 and src/db/schema/db10-log-alerts.draft.ts:80-98: plural table with signature UUID FK cascade, account HMAC VARCHAR64 checked, first_seen_at timestamptz, composite PK.
- Fix: Explicitly document 3-field migration/crosswalk; never import raw account IDs into HMAC columns without trusted mapping.
