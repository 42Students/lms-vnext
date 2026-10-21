# Work packet: edit src/app/api/placements/offers/[offerId]/actions/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-17-023-026  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerOfferController.java:40-41 HTTP 200 JobOffer entity directly
- vNext now: src/app/api/placements/offers/[offerId]/actions/route.ts:30-38 HTTP 200 {offer} envelope
- Fix: Document client response adapter for legacy consumers.
