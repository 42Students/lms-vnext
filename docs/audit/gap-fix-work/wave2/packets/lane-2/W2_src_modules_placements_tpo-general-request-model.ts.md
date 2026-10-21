# Work packet (wave 2): edit src/modules/placements/tpo-general-request-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-12/placement-cell.md

## G2-14-023-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:39-42 — optional reason <=1000 chars.
- vNext now: src/modules/placements/tpo-general-request-model.ts:3-4 — general reason required min3 max2000.
- Fix: Document requiredness/length change per kind.

## G2-14-023-034  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:32-38 — payload arbitrary Object, no upload endpoint.
- vNext now: src/modules/placements/tpo-general-request-model.ts:6-15 — proofUrl HTTPS validation but no file upload.
- Fix: Check learner correction/offer proof link flow and accepted types.

## G2-14-023-039  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:14,29-30 — withdrawal, offer extension, absence dispute, correction, external offer, PAP names.
- vNext now: src/modules/placements/learner-support-request-model.ts:37-44 and src/modules/placements/tpo-general-request-model.ts:17-30 — Application withdrawal, Interview or round reschedule, OFF_CAMPUS_OFFER etc.
- Fix: Provide source label map and explicit PAP route.

## G2-14-023-050  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-30 — PAP and CORRECTION accepted directly.
- vNext now: src/modules/placements/tpo-general-request-model.ts:17-30 — PLACEMENT_AFTER_PLACEMENT and CORRECTION_WITH_PROOF need structured targets/proof.
- Fix: Preserve kind identity; document changes.

## G2-12-005-079  [P2] GAP  facet F20  effort S
- Legacy: Form payload CTC optional Number and company trimmed by form `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:138-153`
- vNext now: CTC required string with precision regex and max 150 company `src/modules/placements/tpo-general-request-model.ts:18-20`
- Fix: Validate money semantics and sanitize special characters consistently
