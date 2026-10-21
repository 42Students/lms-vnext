# Work packet: edit src/lib/report-client-error.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:111-145 global window error/unhandledrejection/console.error capture
- vNext now: src/lib/report-client-error.ts:3-17 called from root boundaries only
- Fix: Restore coverage for unhandled rejections, console errors and resource-load failures with bounded safe capture.

## G2-2-034-003  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:90-103 captures API, auth, video, upload failures
- vNext now: src/lib/report-client-error.ts:3-17 only Error exception with name/component/path
- Fix: Provide redacted categorical API/auth/video/upload event hooks and call sites.

## G2-2-034-025  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:115-125 captures resource errors in capture phase
- vNext now: src/lib/report-client-error.ts:3-17 no resource listener
- Fix: Re-add resource/script/img/css failure capture with sanitized route only.

## G2-2-034-026  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:127-134 unhandledrejection listener, skips intentional route abort
- vNext now: src/lib/report-client-error.ts:3-17 root-only rendering errors
- Fix: Add rejection reporting with route-abort suppression.

## G2-2-034-027  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:136-145 wraps console.error without suppressing output
- vNext now: src/lib/report-client-error.ts:3-17 no console.error wrapper
- Fix: Decide safe opt-in capture to preserve observable JS diagnostics without PII.

## G2-2-034-037  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:111-145 captures API/auth failures mid-action
- vNext now: src/lib/report-client-error.ts:3-17 error boundary dependent; no mid-action hook
- Fix: Instrument shared apiFetch errors with loop guard and privacy sanitizer.

## G2-2-034-059  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:90-103 hooks API/http video/file upload sources
- vNext now: src/lib/report-client-error.ts:3-17 only error boundaries
- Fix: Wire browser instrumentation for API failures, auth mid-action, video/upload errors.
