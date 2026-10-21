# Work packet (wave 3): edit src/app/api/placements/tpo/offers/expiry/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md

## G2-16-014-018  [P1] MISSING  facet F10  effort L
- Legacy: JobOfferRepository.java:25-26 expiry queue.
- vNext now: src/app/api/placements/tpo/offers/expiry/route.ts:9-36 exports watchlist CSV only.
- Fix: Build idempotent expiry transition job, not only CSV.
