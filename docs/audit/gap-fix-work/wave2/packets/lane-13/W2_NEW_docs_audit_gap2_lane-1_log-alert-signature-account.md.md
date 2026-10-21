# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/log-alert-signature-account.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md

## G2-1-017-031  [P2] GAP  facet F15  effort S
- Legacy: src/modules/log-alerts/reporter.ts:48: Telegram 'Affected accounts: 0' even when count unknown.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: unknown must be reported as null (legacy API); legacy alert message usage separate.
- Fix: Use 'Affected accounts: unknown' when hash key or actor evidence unavailable.

## G2-1-017-035  [P2] GAP  facet F18  effort S
- Legacy: src/modules/log-alerts/reporter.ts:48: message reads 'Affected accounts: ' with zero default.
- vNext now: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: unknown/null prescribed for absent evidence.
- Fix: Render actionable unknown disclaimer for missing hash key/account context.
