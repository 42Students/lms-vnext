# Work packet: edit src/modules/placements/tpo-offer-lifecycle-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md, docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/admin-job-service.md

## G2-18-022-034  [P0] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:210-227 external acceptance reserves 48h dispute before cascade
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:117-135 RECORD_ACCEPTED immediately cascades at 196-205
- Fix: Add EXTERNAL_IMPORT pending dispute state + delayed acceptance cascade and student dispute prevention

## G2-18-022-050  [P0] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:230-237 scheduled finalization external acceptance every30m
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:117-135 immediately cascades, no dispute scheduler in this path
- Fix: Restore 48h external acceptance dispute/finalization scheduled job and idempotency

## G2-16-014-021  [P1] GAP  facet F11  effort L
- Legacy: JobOfferRepository.java:25-31 system-wide scheduled due scan.
- vNext now: tpo-offer-lifecycle-service.ts:41-60 requires active TPO.
- Fix: Give system scheduler isolated job identity and tenant-scoped transactions.

## G2-18-022-021  [P1] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:179-184 partial release Modal 'N released, M not released'
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:79-111 all-or-nothing lifecycle transaction
- Fix: Implement bulk verification partial failures and detailed reasons

## G2-18-022-027  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:82-104 bulk-verify releases all eligible, returns released and failed
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:63-111 transaction fails if any item invalid
- Fix: Make bulk verification per-offer isolated with results, not all-or-nothing

## G2-18-022-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:106-128 external acceptance/withdraw/joining/reverse offer
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:36-259 EXTEND,RECORD_ACCEPTED/DECLINED/JOINED,WITHDRAW
- Fix: Map external acceptance 48h disputed, joining status variants and reversal distinctly

## G2-18-022-040  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:223-226 external acceptance sends student 48h dispute notice
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:245-254 generic application status changed notice immediately
- Fix: Send explicit dispute-window alert to learner and schedule finalization safely

## G2-18-022-048  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:88-104 per-offer failure isolation for bulk release
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:63-111 batch transaction all-or-nothing
- Fix: Run verification in isolated transactions per offer and return all failures

## G2-16-014-013  [P2] GAP  facet F07  effort S
- Legacy: JobOfferRepository.java:25-31 empty due set returns empty List.
- vNext now: tpo-offer-lifecycle-service.ts:79-104 requires valid batch input.
- Fix: Background scan no-op should not throw user form error.

## G2-2-016-020  [P2] GAP  facet F07  effort M
- Legacy: Offer letter rejects absent URL, >2048 chars and non-http(s) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1629-1640`)
- vNext now: VNext offer lifecycle uses internal offer artifacts with signed URLs (`src/modules/placements/tpo-offer-lifecycle-service.ts:1-200`)
- Fix: Preserve exact bad-link messages while favoring signed delivery

## G2-8-012-020  [P2] GAP  facet F07  effort M
- Legacy: Offer letter rejects absent URL, >2048 chars and non-http(s) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1629-1640`)
- vNext now: VNext offer lifecycle uses internal offer artifacts with signed URLs (`src/modules/placements/tpo-offer-lifecycle-service.ts:1-200`)
- Fix: Preserve exact bad-link messages while favoring signed delivery

## G2-18-022-019  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:130-137 maps IllegalArgumentException to 404, IllegalStateException to 409
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:97-111 and src/modules/placements/offer-service.ts:329-390 typed errors for stale/not-ready
- Fix: Preserve not-found vs invalid transition conflict response and UI recovery

## G2-18-022-020  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:120-134 act() success message from action label
- vNext now: src/modules/placements/tpo-offer-lifecycle-service.ts:255-258 returns updated count/items
- Fix: Display per-action legacy labels, refresh row after successful mutation
