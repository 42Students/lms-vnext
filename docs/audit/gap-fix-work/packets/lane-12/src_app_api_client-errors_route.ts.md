# Work packet: edit src/app/api/client-errors/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/client-error-report-controller.md

## G2-2-034-030  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:27-30 auth for all roles, anon 401
- vNext now: src/app/api/client-errors/route.ts:68-74 reports accepted anonymously with no identity
- Fix: Confirm intended anonymous root error telemetry versus authenticated-only anti-abuse policy.

## G2-2-034-064  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:27-29 required authentication
- vNext now: src/app/api/client-errors/route.ts:68-74 anonymous allowed for root failures
- Fix: Decide deliberate observability extension vs old abuse/auth invariant.

## G2-2-034-018  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:52-60 401 anon,400 blank,429 rate; no body
- vNext now: src/app/api/client-errors/route.ts:36-66 403 invalid origin,400 invalid,413 too-large,429 with JSON message
- Fix: Map API status to nonblocking telemetry behavior; don't surface to user as an error toast.

## G2-2-034-020  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:79 HTTP200 empty success
- vNext now: src/app/api/client-errors/route.ts:85 HTTP202 {received:true}
- Fix: Update fetch sender to consider 202 success without awaiting anyway.
