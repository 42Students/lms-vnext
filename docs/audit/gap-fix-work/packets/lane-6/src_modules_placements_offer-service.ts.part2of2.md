# Work packet: edit src/modules/placements/offer-service.ts (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md, docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md

## G2-18-022-017  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:78-83 letter URL http(s), max2048 or 'The letter must be a web link (https://...)'
- vNext now: src/modules/placements/offer-service.ts:267-310 offer schema validates attachment or URL via different typed field
- Fix: Use old URL error wording and prevent unsafe URI schemes

## G2-18-022-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:105-116 errors if offer not SELECTED, drive canceled, learner closed
- vNext now: src/modules/placements/offer-service.ts:329-390 requires active season and shortlisted SUBMITTED, returns NOT_READY code
- Fix: Return detailed blocking cause in preview, retain safe permission masking

## G2-18-022-019  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:130-137 maps IllegalArgumentException to 404, IllegalStateException to 409
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:97-111 and src/modules/placements/offer-service.ts:329-390 typed errors for stale/not-ready
- Fix: Preserve not-found vs invalid transition conflict response and UI recovery

## G2-16-014-014  [P3] GAP  facet F07  effort S
- Legacy: JobOfferRepository.java:16 Optional.empty if none.
- vNext now: offer-service.ts:139-142 throws offer not found for required ID.
- Fix: Provide optional latest-by-application.
