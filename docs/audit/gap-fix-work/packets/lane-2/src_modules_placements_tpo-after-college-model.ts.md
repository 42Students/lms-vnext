# Work packet: edit src/modules/placements/tpo-after-college-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-038  [P1] GAP  facet F12  effort M
- Legacy: ChoicesController.java:28 registration intent is not same as placement outcome.
- vNext now: src/modules/placements/tpo-after-college-model.ts:4-22 has broader result semantics.
- Fix: Keep separate schemas for registration choice vs after-college outcome; never infer placed from registering.

## G2-2-030-029  [P2] GAP  facet F08  effort M
- Legacy: useChoices.js:17-27 successful cached choices are held until resetChoicesCache.
- vNext now: src/modules/placements/tpo-after-college-model.ts:21-30 static options per import, while dynamic custom settings read separately.
- Fix: Refresh dependent option inputs when tenant/college or catalog version changes.
