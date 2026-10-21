# Work packet: edit src/modules/placements/tpo-general-request-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-12/placement-cell.md

## G2-14-023-005  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30 — kinds allowed WITHDRAWAL/OFFER_EXTENSION/REGISTRATION_CHANGE/ABSENCE_DISPUTE/CORRECTION/EXTERNAL_OFFER/PAP.
- vNext now: src/components/placements/learner-placement-requests.tsx:14-24 and src/modules/placements/tpo-general-request-model.ts:17-30 — split list: APPLICATION_WITHDRAWAL/ROUND_RESCHEDULE/OFFER_EXTENSION and six general kinds.
- Fix: Build one predictable request picker with seven legacy options and new variant mapping.

## G2-14-023-013  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30,43-45 — seven uppercase legacy names accepted exactly.
- vNext now: src/modules/placements/validation.ts:1282-1309 and src/modules/placements/tpo-general-request-model.ts:17-30 — different enum set split by schema.
- Fix: Accept/translate legacy request names and explain changed flows.

## G2-12-005-032  [P1] GAP  facet F07  effort S
- Legacy: Optional zero CTC min0 accepted in UI `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:256-257`
- vNext now: CTC required positive with regex up to 2 decimals `src/modules/placements/tpo-general-request-model.ts:18-20`
- Fix: Align CTC optionality/range with TPO verification rules

## G2-12-005-083  [P1] GAP  facet F22  effort S
- Legacy: Legacy StudentRequest type/jobId/applicationId/payload/reason model `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-48`
- vNext now: General Request discriminated kind with typed targets and proof links `src/modules/placements/tpo-general-request-model.ts:17-30`
- Fix: Document type mapping including legacy CORRECTION and PAP; preserve request history

## G2-14-023-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:41 — Keep the reason under 1000 characters.
- vNext now: src/modules/placements/tpo-general-request-model.ts:3 and src/db/schema/placement-learner-general-requests.ts:33 — reason 3..2000 with alternate errors.
- Fix: Maintain exact boundary wording or adjust UI.

## G2-12-005-030  [P2] GAP  facet F07  effort S
- Legacy: Missing company error `Which company?` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:253-255`
- vNext now: Zod company min1 generic complete-required-details error `src/modules/placements/tpo-general-request-model.ts:18-20`
- Fix: Display field-specific error with exact copy
