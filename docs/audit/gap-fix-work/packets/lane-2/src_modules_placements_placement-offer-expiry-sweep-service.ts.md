# Work packet: edit src/modules/placements/placement-offer-expiry-sweep-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-17-010-004  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-46 — Offer-expiring-soon hourly fixed-delay.
- vNext now: src/modules/placements/placement-offer-expiry-sweep-service.ts:11-17 — Expiry processor only, explicitly notes cron missing.
- Fix: Add hourly pre-expiry reminders, separate from expiry transitions.

## G2-17-010-034  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:72-73 — Calls offers.expireOverdue.
- vNext now: src/modules/placements/placement-offer-expiry-sweep-service.ts:18-103 — Batch sweep marks ISSUED offers EXPIRED and history/events.
- Fix: Complete scheduled entry, actor identity and catch-up logic.

## G2-17-010-051  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-73 — Fixed-delay jobs run once handler returns; locks limit overlap.
- vNext now: src/modules/placements/placement-offer-expiry-sweep-service.ts:33-56 — Expiry sweep process up to 100 rows/tick, no repeated drain/invoker.
- Fix: Run multiple bounded batches until drained with time budget.

## G2-5-032-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy overdue offers expire every15m lease12m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:72-73`
- vNext now: vNext offers sweep primitive documented as 15-minute job, no trigger shown. `src/modules/placements/placement-offer-expiry-sweep-service.ts:12-24`
- Fix: Invoke offer sweep every15 minutes via persisted lease.

## G2-5-032-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy expired jobs scan active jobs past deadline and set inactive/audit daily. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-72`
- vNext now: vNext offer expiry sweep exists, but job expiry is different entity not implemented here. `src/modules/placements/placement-offer-expiry-sweep-service.ts:12-104`
- Fix: Implement job application-deadline expiry separately from offer expiry.

## G2-5-032-033  [P1] GAP  facet F10  effort M
- Legacy: Legacy digest and overdue offers are scheduled repeatedly. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:69-73`
- vNext now: vNext offer expiry is transaction primitive with skipLocked, no external call. `src/modules/placements/placement-offer-expiry-sweep-service.ts:31-104`
- Fix: Schedule sweep in deploy infrastructure with at-least-once and idempotent audit.

## G2-5-032-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy per-job exception is logged; loop continues on individual failed jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-72`
- vNext now: vNext transactional sweep fails whole batch on unhandled row failure. `src/modules/placements/placement-offer-expiry-sweep-service.ts:31-58`
- Fix: Record partial outcomes or retry batch safely after rollback.
