# Work packet (wave 2): edit src/modules/placements/tpo-offer-lifecycle-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md

## G2-18-022-014  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:79-80 withdraw/reversal reason preset lists
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:21 reason trim min10 max1200, no fixed reason choices
- Fix: Restore reason picker preset options with free-text detail

## G2-18-022-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:24-28 'Withdrawn by company'/'Reversed' status words
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:8-10 action WITHDRAW and src/modules/placements/offer-service.ts:617-1018 status WITHDRAWN
- Fix: Use exact old status badge copy and separate company vs staff actor

## G2-18-022-045  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:82-104 bulk verify loops LinkedHashSet dedupe max200
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:16-19 duplicate offer IDs forbidden; src/modules/placements/tpo-offer-lifecycle-service.ts:63-100 sorted all-or-nothing
- Fix: Preserve dedupe or explicitly show duplicate row error before bulk action
