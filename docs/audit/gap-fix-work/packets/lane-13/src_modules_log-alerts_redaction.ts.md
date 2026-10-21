# Work packet: edit src/modules/log-alerts/redaction.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-040  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:102-104 file upload failure reports filename in message
- vNext now: src/modules/log-alerts/client-report.ts:4 max300 and `redaction.ts:3-26` masks sensitive content
- Fix: Never send raw filenames or presigned URLs, but emit safe FILE_UPLOAD_FAILURE category and code.
