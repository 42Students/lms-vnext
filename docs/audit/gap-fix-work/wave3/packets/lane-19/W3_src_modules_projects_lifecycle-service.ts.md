# Work packet (wave 3): edit src/modules/projects/lifecycle-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md

## G2-16-014-009  [P1] MISSING  facet F05  effort L
- Legacy: JobOfferRepository.java:29-31 accepted EXTERNAL_IMPORT, disputable until before now.
- vNext now: placements.ts:1552-1555 fields retained; lifecycle-service.ts:117-140 lacks maturity check.
- Fix: Create external-dispute maturation query and approved cascade.
