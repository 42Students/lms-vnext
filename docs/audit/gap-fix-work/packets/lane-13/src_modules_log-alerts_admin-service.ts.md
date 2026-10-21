# Work packet: edit src/modules/log-alerts/admin-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md

## G2-1-017-004  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:129: distinctAccountCount is nullable numeric field in admin DTO.
- vNext now: src/modules/log-alerts/admin-service.ts:77-83: affectedAccounts value exposed, default 0; no distinct-account raw ID control.
- Fix: Show unknown/unavailable instead of misleading zero when no trusted account evidence.

## G2-1-017-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: when no account marker exists return null for distinctAccountCount, not 0.
- vNext now: src/modules/log-alerts/admin-service.ts:65-82: grouped counts and null-coalescing to 0.
- Fix: Persist known-vs-unavailable indicator, return null when no verified account identity was observed.

## G2-1-017-028  [P1] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: no account evidence => API nullable count.
- vNext now: src/modules/log-alerts/admin-service.ts:81: defaults missing count to 0; empty means misleading certainty.
- Fix: Return null/unknown and show 'Not available' for unobserved accounts.

## G2-1-017-047  [P1] GAP  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:129: UNKNOWN count represented as nullable distinctAccountCount.
- vNext now: src/modules/log-alerts/admin-service.ts:81 and src/modules/log-alerts/reporter.ts:48: zero used in API/Telegram without evidence.
- Fix: Restore unknown/null semantic before declaring parity.
