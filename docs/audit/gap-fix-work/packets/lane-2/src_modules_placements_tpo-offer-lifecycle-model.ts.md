# Work packet: edit src/modules/placements/tpo-offer-lifecycle-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md, docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md

## G2-13-015-030  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:199-252` EXTERNAL_IMPORT accepted with 48h dispute and scheduled finalization
- vNext now: `src/db/schema/placements.ts:1552-1555` stores channel/disputableUntil; `src/modules/placements/tpo-offer-lifecycle-model.ts:9-36` RECORD_ACCEPTED action
- Fix: Verify/complete external-import acceptance dispute creation/closure and scheduled cascade handler

## G2-18-022-004  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:24-28 statuses SELECTED,PENDING_VERIFICATION,RELEASED,ACCEPTED,DECLINED,EXPIRED,WITHDRAWN,REVOKED
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:20 expectedStatus ISSUED/ACCEPTED; src/modules/placements/offer-service.ts:267-617 issues ISSUED directly
- Fix: Restore visible selection/verification states or explicit state mapping badges

## G2-18-022-015  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:76-85 bulkVerify max200
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:16 offerIds max200 for lifecycle action, but bulk verify state absent
- Fix: Create verify action max200 with per-record errors

## G2-18-022-016  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:85 'Verify at most 200 selections at a time'
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:16 z.array max200 generic schema error
- Fix: Use exact max200 validation message
