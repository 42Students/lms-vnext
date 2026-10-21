# Work packet: edit src/modules/placements/tpo-round-apply-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md, docs/audit/gap2/lane-15/job-round-repository.md

## G2-12-022-031  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145 — applyRound one transaction, locks round and marks status completed if zero skips
- vNext now: src/modules/placements/tpo-round-apply-service.ts:55-73 — per-result transaction loop; no round status mutation here
- Fix: Decide atomicity and round completion workflow; preserve partial results without falsely completing round

## G2-12-022-053  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77 — lock round to serialize duplicate apply
- vNext now: src/modules/placements/tpo-round-apply-service.ts:55-73 — preview token and per-result locks; batch not transaction-atomic
- Fix: Evaluate concurrent two-officer bulk apply and refresh stale preview, preserve no duplicate alerts

## G2-12-022-062  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145 — one call can mark round completed and report unchanged terminal applicants
- vNext now: src/modules/placements/tpo-round-apply-service.ts:55-73 — per-row confirmation with generic skip and separate round completion
- Fix: Write product decision on intentional workflow change and full round completion semantics

## G2-15-014-017  [P1] GAP  facet F05  effort L
- Legacy: Pessimistic write lock specifically at apply results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- vNext now: New whole-round apply calls per-result service after preview, no shown round lock. (`src/modules/placements/tpo-round-apply-service.ts:55-68`)
- Fix: Use job/round transaction lock or equivalent stage CAS for exactly-once apply.

## G2-15-014-032  [P1] GAP  facet F10  effort L
- Legacy: PESSIMISTIC_WRITE SELECT one round by id. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- vNext now: New application-level whole apply loops through staged results without single round lock. (`src/modules/placements/tpo-round-apply-service.ts:55-68`)
- Fix: Guarantee apply-once at round scope and all-or-nothing/partial semantics.

## G2-15-014-033  [P1] GAP  facet F10  effort L
- Legacy: Bulk apply computes next non-TALK stage and completes round only when no pending result. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145`)
- vNext now: New next evaluative excludes CANCELLED/TALK, ready demands COMPLETED already. (`src/modules/placements/tpo-round-apply-service.ts:35-46`)
- Fix: Resolve lifecycle: old marks complete AFTER apply, new demands complete BEFORE apply.

## G2-15-014-059  [P1] GAP  facet F19  effort L
- Legacy: Round lock serializes bulk apply. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77`)
- vNext now: Preview and result loops execute multiple calls. (`src/modules/placements/tpo-round-apply-service.ts:55-68`)
- Fix: Make a single transaction or robust idempotent request token for whole-round apply.

## G2-15-014-061  [P1] GAP  facet F20  effort L
- Legacy: Two simultaneous apply calls serialize on locked round. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77`)
- vNext now: Two whole apply calls each preview same token before processing. (`src/modules/placements/tpo-round-apply-service.ts:55-68`)
- Fix: Acquire lock and consume all staged rows in one operation or detect concurrent apply.

## G2-15-014-065  [P1] GAP  facet F21  effort M
- Legacy: Result transition applies notification and status history inline. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145`)
- vNext now: Delegates to per-result result-service. (`src/modules/placements/tpo-round-apply-service.ts:61-68`)
- Fix: Audit partial apply, history consistency and actor notifications.

## G2-15-014-071  [P1] GAP  facet F23  effort L
- Legacy: Legacy pessimistic row lock for atomic round apply. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- vNext now: New preview token and per-result apply, not whole-round lock. (`src/modules/placements/tpo-round-apply-service.ts:55-72`)
- Fix: Do not call round batch parity complete until apply concurrency is proven.
