# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-5-032-003  [P1] GAP  facet F01  effort L
- Legacy: TPO 10 scheduled entry methods live inside backend container. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- vNext now: vNext has individual business primitives but no one central tick with those frequencies. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Inventory all ten TPO calls and bind to production dispatcher.

## G2-5-032-005  [P1] GAP  facet F02  effort M
- Legacy: Legacy operational log polls, daily and weekly digest behind scheduler. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-96`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogDigestService.java:139-158`
- vNext now: vNext standalone model lacks corresponding digest delivery schedule. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Expose operator run status and last-success timestamps without a customer-facing page.

## G2-5-032-012  [P1] GAP  facet F05  effort M
- Legacy: Legacy digest top10 new errors, regressions, fixed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogDigestService.java:50-62`
- vNext now: vNext no equivalent digest enumeration wired. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Implement top10 digest selection and batching.

## G2-5-032-061  [P1] GAP  facet F21  effort M
- Legacy: Legacy deploy health/log alert polls external log API and sends alerts. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DeployHealthMonitor.java:44-87`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-96`
- vNext now: vNext runner no monitored provider integration. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Deploy provider adapters with rate-limit, failure and alert circuit breaker.

## G2-5-032-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy poll log alerting produces operator notifications, not UI toast. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-96`
- vNext now: vNext job wiring missing, hence no schedule-level alert receipt. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Expose operational outcome and last failure in console.
