# Work packet (wave 2): edit src/lib/report-client-error.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:106-145 initializes globally from _app.js
- vNext now: src/lib/report-client-error.ts:3-17 invoked by root error boundary
- Fix: Audit app-level instrumentation mounts on every role/page, not only root boundary render.

## G2-2-034-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:57-103 distinct error-type reporter functions
- vNext now: src/lib/report-client-error.ts:4 generic error reporter with component string
- Fix: Provide explicit typed reporter wrappers to avoid losing event type labels.

## G2-2-034-013  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:21-40 sessionStorage dedupe 60s per type/message/endpoint
- vNext now: src/lib/report-client-error.ts:3-17 best-effort sender, no dedupe
- Fix: Add bounded client duplicate suppression keyed by sanitized category/reference.

## G2-2-034-052  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:21-40 sessionStorage browser-side dedupe 60s
- vNext now: src/lib/report-client-error.ts:3-17 no dedupe, submits every root error call
- Fix: Deduplicate repeated root-error bursts to reduce ingestion.

## G2-2-034-044  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:7-14 captures browser viewport dims
- vNext now: src/lib/report-client-error.ts:9-15 no viewport payload
- Fix: Decide safe viewport bucket (mobile/tablet/desktop) for responsive failure diagnosis.
