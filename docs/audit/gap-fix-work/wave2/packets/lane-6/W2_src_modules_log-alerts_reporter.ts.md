# Work packet (wave 2): edit src/modules/log-alerts/reporter.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/log-alert-signature-account.md, docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md, docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-1-017-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:82-95: frontend reporter provides type/page/browser/viewport/build and principal account marker.
- vNext now: src/modules/log-alerts/reporter.ts:17-28: reporter input has event/path/component/actor UUID but no viewport/browser/build in this contract.
- Fix: Map which incident metadata belongs in safe log, redact and preserve useful device triage data.

## G2-1-017-025  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:1-9: number of distinct affected accounts counts unique numeric account ID per signature only.
- vNext now: src/modules/log-alerts/reporter.ts:69-74: hashes college plus user ID; one human across colleges counts multiple hashed keys.
- Fix: Define blast-radius metric as tenant-scoped identities vs unique humans and label accordingly.

## G2-1-017-041  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: Cloud Logging message ingestion, only frontend reports carry account marker.
- vNext now: src/modules/log-alerts/reporter.ts:95-110: Telegram gate, readiness gate; docs/operations/vnext-telegram-alerting.md:9-17 adds Cloud poll opt-in and CronJob.
- Fix: Document required DB10 readiness, hash key, logging IAM and tick deployment; test operational enablement.

## G2-15-018-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:68-70 — regressedAt indicates fixed recurrence.
- vNext now: src/modules/log-alerts/reporter.ts:13-14 and src/modules/log-alerts/scheduler.ts:112-129 — reopenRegressedSignature and delayed regression notification.
- Fix: Verify status transition/FIXED regression reconciliation with old poller.

## G2-2-034-041  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:19-25 frontend ERROR logged into LogAlerting poller
- vNext now: src/modules/log-alerts/reporter.ts:94-112 processes structured errors and Telegram
- Fix: Validate deployment alert pipeline covers client.error from cloud ingestion and in-process reporter.

## G2-2-034-058  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:19-25 old stdout Cloud Logging + LogAlertingService poller
- vNext now: src/modules/log-alerts/reporter.ts:94-115 first-party DB10 signature/Telegram
- Fix: Document equivalent Cloud Logging ingestion, Telegram configuration and fallback.
