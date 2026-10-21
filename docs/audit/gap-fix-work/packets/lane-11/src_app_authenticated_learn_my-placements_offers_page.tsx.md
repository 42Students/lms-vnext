# Work packet: edit src/app/(authenticated)/learn/my-placements/offers/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md

## G2-13-005-034  [P2] GAP  facet F08  effort S
- Legacy: Legacy failed journey warning We could not load your offers with Retry (`docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:21-23`)
- vNext now: No same local warning in server-rendered page (`src/app/(authenticated)/learn/my-placements/offers/page.tsx:74-79`)
- Fix: Provide equivalent inline warning/error boundary Retry.
