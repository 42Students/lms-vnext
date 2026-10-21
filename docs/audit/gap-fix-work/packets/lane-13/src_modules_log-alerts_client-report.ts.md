# Work packet: edit src/modules/log-alerts/client-report.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ClientErrorReportRequest.java:13-27 type,message,stack,page,endpoint,statusCode,buildVersion,browser,viewport
- vNext now: src/modules/log-alerts/client-report.ts:3-14 accepts message,kind,name,component,event,path,requestId
- Fix: Map event kind/status/browser/build/viewport or explicitly retire sensitive fields after operator decision.

## G2-2-034-010  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:63-65 categorizes eight types and page500
- vNext now: src/modules/log-alerts/client-report.ts:5 only render or stale_chunk kind; :9 path255
- Fix: Restore safe enum for each legacy browser error category, preserving URL redaction.

## G2-2-034-033  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:35-37 8 accepted error types
- vNext now: src/modules/log-alerts/client-report.ts:3-14 strictly render/stale_chunk kind
- Fix: Define mapping for each eight failure types and sampling/retention.

## G2-2-034-040  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:102-104 file upload failure reports filename in message
- vNext now: src/modules/log-alerts/client-report.ts:4 max300 and `redaction.ts:3-26` masks sensitive content
- Fix: Never send raw filenames or presigned URLs, but emit safe FILE_UPLOAD_FAILURE category and code.
