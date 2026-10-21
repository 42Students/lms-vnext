# Work packet (wave 2): edit src/modules/log-alerts/admin-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md, docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md

## G2-1-017-034  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:1-9: term 'distinct accounts' / 'blast radius'; unknown reported null.
- vNext now: src/modules/log-alerts/admin-service.ts:81: API calls it affectedAccounts with numeric zero for absence.
- Fix: Align operator label with measured scope and distinguish unknown from zero.

## G2-15-018-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LogAlertSignatureRepository.java:11-15 — repository findByEnvironmentAndSignatureHash and environment ordered by last-seen.
- vNext now: src/modules/log-alerts/admin-service.ts:41-63 — admin list by environment, lastSeen DESC+id; API separate tracker namespace.
- Fix: Document endpoint/ID mapping and preserve environment-scoped triage.

## G2-15-018-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LogAlertSignatureRepository.java:12-15 — repository lists full env results without limit.
- vNext now: src/modules/log-alerts/admin-service.ts:61-63 — list bounded by parsed limit.
- Fix: Provide pagination to reach older signatures.
