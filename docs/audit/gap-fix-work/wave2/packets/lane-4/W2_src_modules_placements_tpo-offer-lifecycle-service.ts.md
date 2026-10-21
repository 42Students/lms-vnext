# Work packet (wave 2): edit src/modules/placements/tpo-offer-lifecycle-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md

## G2-16-014-024  [P2] GAP  facet F13  effort S
- Legacy: JobOfferRepository.java:25-31 due scans validly return zero records.
- vNext now: tpo-offer-lifecycle-service.ts:63-103 requires selected offer ids.
- Fix: Use system sweep no-op result.

## G2-16-014-026  [P2] GAP  facet F15  effort M
- Legacy: JobOfferRepository.java:25-31 read-only selectors, no direct mail.
- vNext now: tpo-offer-lifecycle-service.ts:219-254 manual updates emit learner event.
- Fix: Notify learner once on system expiry and maturation where appropriate.

## G2-2-016-115  [P2] GAP  facet F10  effort L
- Legacy: PATCH offer-letter URL writes application offerLetterUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:829-854`
- vNext now: New operates separate placementOffers lifecycle and signed artifact policy `src/modules/placements/tpo-offer-lifecycle-service.ts:36-110,178-214`
- Fix: Expose explicit attach-url or signed file upload surface with permission and evidence

## G2-18-022-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:15-17 /api/v1/tpo/offers endpoints for per-drive TPO
- vNext now: src/modules/placements/offer-service.ts:267-617 issue/action and src/modules/placements/tpo-offer-lifecycle-service.ts:36-60 TPO action services per scoped job
- Fix: Map legacy per-offer paths to new scoped job/app IDs, preserve Offers tab deep links

## G2-18-022-045  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:82-104 bulk verify loops LinkedHashSet dedupe max200
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:16-19 duplicate offer IDs forbidden; src/modules/placements/tpo-offer-lifecycle-service.ts:63-100 sorted all-or-nothing
- Fix: Preserve dedupe or explicitly show duplicate row error before bulk action
