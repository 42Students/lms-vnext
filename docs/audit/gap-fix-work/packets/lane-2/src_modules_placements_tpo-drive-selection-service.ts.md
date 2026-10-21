# Work packet: edit src/modules/placements/tpo-drive-selection-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-16-031-096  [P1] GAP  facet F22  effort L
- Legacy: TpoOfferController.java:54-124 uses old JobOffer SELECTED/PENDING_VERIFICATION/RELEASED/ACCEPTED/withdrawn model.
- vNext now: tpo-drive-selection-service.ts:53-93 stores selections separately; offers/page.tsx:46-55 ISSUED/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED versions.
- Fix: Map legacy unreleased selection statuses and released offer histories; never collapse SELECTED into ISSUED.
