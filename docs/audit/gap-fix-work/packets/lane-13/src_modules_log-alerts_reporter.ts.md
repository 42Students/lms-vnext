# Work packet: edit src/modules/log-alerts/reporter.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md

## G2-1-017-047  [P1] GAP  facet F23  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:129: UNKNOWN count represented as nullable distinctAccountCount.
- vNext now: src/modules/log-alerts/admin-service.ts:81 and src/modules/log-alerts/reporter.ts:48: zero used in API/Telegram without evidence.
- Fix: Restore unknown/null semantic before declaring parity.

## G2-1-017-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:52-60: 401 unauthenticated, 400 blank, 429 rate limited.
- vNext now: src/modules/log-alerts/readiness.ts:1-4: persistence enabled only under DB10_VERIFIED; src/modules/log-alerts/reporter.ts:95-110: if Telegram absent returns false.
- Fix: Expose operational readiness/status so failures are not silently treated as accepted.
