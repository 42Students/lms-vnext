# Work packet (wave 2): edit src/app/api/client-errors/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md, docs/audit/gap2/lane-20/500.md

## G2-2-034-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:50-51 POST /api/v1/client-errors/report
- vNext now: src/app/api/client-errors/route.ts:36-38 POST /api/client-errors
- Fix: Migrate endpoint URL/route in reporting transport.

## G2-2-034-011  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:90-94 account ID and userType logged
- vNext now: src/app/api/client-errors/route.ts:68-84 userId and collegeId logged when authenticated, no userType
- Fix: Include server-derived safe role category for role-specific failure triage.

## G2-2-034-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:98-107 rate 20/account/min
- vNext now: src/app/api/client-errors/route.ts:61-66 rate 20/IP/min and 10/IP+session/min
- Fix: Document effective cross-pod limits, proxies and shared IP restrictions.

## G2-2-034-034  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:40-42 20 reports per account each rolling 60s
- vNext now: src/app/api/client-errors/route.ts:61-65 20 per IP,10 per session/IP per min
- Fix: Select per-account AND per-IP fairness; behind NAT/college IP do not suppress all students.

## G2-20-002-044  [P2] GAP  facet F21  effort M
- Legacy: 500.js itself has no vendor/queue/job; global AppErrorBoundary separately reports React errors; `docs/legacy-source/frontend/src/pages/500.js:1-26`, `docs/legacy-source/frontend/src/pages/_app.js:24-42`
- vNext now: New shared boundary POSTs observability event; API logError client.error; `src/components/public/graceful-error-boundary.tsx:32-50`, `src/app/api/client-errors/route.ts:75-85`
- Fix: Map old `reportReactBoundaryError` to new client report fields and alert routing; verify equivalent operational diagnostics without duplicate events.

## G2-2-034-048  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:84 line prefix '[Frontend] '
- vNext now: src/app/api/client-errors/route.ts:80-84 event 'client.error', safe message
- Fix: Map Logs table search/display alias so frontend errors remain recognizable.
