# Work packet (wave 2): edit src/modules/placements/company-drive-facts-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md

## G2-3-015-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:173-179`, `190-214`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:26-74`
- Fix: Legacy company list displays number of drives and most recent posting date via GROUP BY; vNext company facts project job status/offers and no identical last-posted aggregation in cited service. Expose lastPosted and count with privacy scope.

## G2-3-015-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:190-214`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:50-68`
- Fix: Legacy company metrics are batched GROUP BY for company IDs and posted/created MAX; vNext per company relationship joined facts, no identified group latest-posted query. Build batch aggregate to avoid N+1.

## G2-3-015-041  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:190-214`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:50-68`
- Fix: Legacy company usage uses batched GROUP BY; vNext company facts performs joined jobs/applications/offers for one company. Add aggregate query for many companies to prevent fanout.

## G2-3-015-051  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:173-179`, `190-214`
- vNext now: `src/modules/placements/company-drive-facts-service.ts:26-74`
- Fix: Legacy name-fallback for old company drives and batched last-posted stats may be dropped due no migration; implement historic-compat projection or explicitly record exclusion.
