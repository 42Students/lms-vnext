# Work packet (wave 2): edit src/modules/placements/tpo-drive-offer-register-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md

## G2-16-014-003  [P2] GAP  facet F02  effort M
- Legacy: JobOfferRepository.java:18-23 by job and learner cross join.
- vNext now: tpo-drive-offer-register-service.ts:18-25 job-scoped register.
- Fix: Expose both job and learner scoped read projections.

## G2-16-014-017  [P2] GAP  facet F10  effort M
- Legacy: JobOfferRepository.java:14-23 read by application, latest, job and learner.
- vNext now: offer-service.ts:71-145; tpo-drive-offer-register-service.ts:19-25 support subset.
- Fix: Add full typed scoped read methods.

## G2-16-014-041  [P2] GAP  facet F23  effort M
- Legacy: JobOfferRepository.java:18-23 two aggregate scopes.
- vNext now: tpo-drive-offer-register-service.ts:23-25 job and offer-service.ts:480-493 learner facts.
- Fix: Reconcile scopes, eligible statuses and CTC held rules.
