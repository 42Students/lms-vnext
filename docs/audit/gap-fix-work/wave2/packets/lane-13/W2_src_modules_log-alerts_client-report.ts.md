# Work packet (wave 2): edit src/modules/log-alerts/client-report.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:84-94 message1000,endpoint300,browser200,viewport32,build64,stack3000
- vNext now: src/modules/log-alerts/client-report.ts:4-11 message300,component80,path255,event64, no stack
- Fix: Enforce new safe max with a documented loss of diagnostic context, not silent truncation mismatch.

## G2-2-034-015  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:63 unknown type defaults JS_ERROR
- vNext now: src/modules/log-alerts/client-report.ts:5 only two kind values, unexpected keys rejected
- Fix: Map supported legacy type enum to new safe category, reject unknown types with helpful client fallback.

## G2-2-034-035  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:3-4 60sec per-tab dedupe, :32-36 cap 200→100 entries
- vNext now: src/modules/log-alerts/client-report.ts:16-41 5k-entry per-pod 60sec windows
- Fix: Restore complementary browser dedupe to reduce network cost.

## G2-2-034-049  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:35-37 JS_ERROR/UNHANDLED_REJECTION/CONSOLE_ERROR/... enum
- vNext now: src/modules/log-alerts/client-report.ts:5 render/stale_chunk lower-case enums
- Fix: Preserve operator-readable category names or map labels in Logs UI.

## G2-2-034-051  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:98-107 per-process 50,000-account map clear-all
- vNext now: src/modules/log-alerts/client-report.ts:16-41 per-process 5,000 key map clear-all
- Fix: Use bounded shared token bucket for horizontally scaled Cloud Run if abuse matters.

## G2-2-034-060  [P2] GAP  facet F21  effort S
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:11 buildVersion included
- vNext now: src/modules/log-alerts/client-report.ts:3-14 no build version
- Fix: Attach vetted deploy version to correlate regressions without leaking browser internals.

## G2-2-034-062  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:40-42 MAX_REPORTS_PER_MINUTE constant20
- vNext now: src/modules/log-alerts/client-report.ts:16-41 Map counters, :31 default max10
- Fix: Document per-pod/map retention and reset policy differences.

## G2-2-034-050  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:63 unrecognized defaults JS_ERROR
- vNext now: src/modules/log-alerts/client-report.ts:12-14 rejects unknown strict enums
- Fix: Show report rejection only in dev diagnostics; use fallbacks for unknown type.
