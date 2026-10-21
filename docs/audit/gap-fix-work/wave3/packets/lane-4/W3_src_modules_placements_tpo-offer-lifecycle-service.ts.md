# Work packet (wave 3): edit src/modules/placements/tpo-offer-lifecycle-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md

## G2-16-014-004  [P1] MISSING  facet F02  effort L
- Legacy: JobOfferRepository.java:25-31 due-expiry and dispute query outputs.
- vNext now: tpo-offer-lifecycle-service.ts:136-140 interactive expiry check only.
- Fix: Implement actual due batch readers and transitions.

## G2-16-014-019  [P1] MISSING  facet F10  effort L
- Legacy: JobOfferRepository.java:29-31 external acceptance dispute queue.
- vNext now: tpo-offer-lifecycle-service.ts:117-140 manual acceptance logic.
- Fix: Schedule post-dispute cascade release.

## G2-16-014-040  [P1] MISSING  facet F23  effort L
- Legacy: JobOfferRepository.java:25-31 both scheduled selectors needed.
- vNext now: tpo-offer-lifecycle-service.ts:36-260 has only manual actions, expiry CSV is read-only.
- Fix: Implement expiry/maturation jobs.
