# Work packet: edit src/modules/placements/tpo-drive-next-step-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-11-010-019  [P1] GAP  facet F03  effort M
- Legacy: After deadline with applicants, main button Share N applicants with company. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:278`
- vNext now: Next-step offers Share with company based on shortlist, not all applicants or post-deadline. `src/modules/placements/tpo-drive-next-step-model.ts:68`
- Fix: Match condition/count or document intended new share policy.

## G2-11-010-022  [P1] MISSING  facet F03  effort M
- Legacy: Recorded-outside without applicants main Add students who took part. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:281`
- vNext now: PUBLISHED nextStep has no recordedOutside rule. `src/modules/placements/tpo-drive-next-step-model.ts:45`
- Fix: Add recordedOutside primary CTA with correct section.

## G2-11-010-046  [P2] MISSING  facet F08  effort S
- Legacy: Decline toast Request declined. It is now cancelled. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:492`
- vNext now: No REQUEST decline in model. `src/modules/placements/tpo-drive-next-step-model.ts:24`
- Fix: Port exact decline success message.
