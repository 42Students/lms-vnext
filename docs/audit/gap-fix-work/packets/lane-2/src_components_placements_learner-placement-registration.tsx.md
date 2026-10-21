# Work packet: edit src/components/placements/learner-placement-registration.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md, docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-12-005-021  [P1] GAP  facet F06  effort S
- Legacy: Saved Placements choice selected and consent checked when reading overview `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:52-55,180-195`
- vNext now: Initial consent false even when already registered Placements `src/components/placements/learner-placement-registration.tsx:24-27`
- Fix: Preselect stored consent or clearly require fresh consent on update with disclosure

## G2-15-023-017  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid choice 400/no content, closed window 409/no content. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:47-50`
- vNext now: vNext named errors DB08_* with visible messages. `src/components/placements/learner-placement-registration.tsx:18-23`, `src/modules/placements/batch-registration-service.ts:32-41`
- Fix: Map server code/status/message to UX.

## G2-15-023-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy POST 200 updated PlacementRegistration. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:42-53`
- vNext now: vNext shows success string and router.refresh. `src/components/placements/learner-placement-registration.tsx:43-46`
- Fix: Retain response/confirmation copy where parity required.

## G2-12-005-035  [P3] GAP  facet F08  effort S
- Legacy: Registration success uses AntD toast `Registration saved` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:72-86,193-195`
- vNext now: Inline role=status `Registration saved` `src/components/placements/learner-placement-registration.tsx:45-49,74-75`
- Fix: Match transient placement/toast semantics

## G2-16-023-023  [P3] GAP  facet F07  effort S
- Legacy: LearnerPlacementService.java:63 exact consent error long sentence.
- vNext now: learner-placement-registration.tsx:22,33-34 says `Agree to the sharing statement before registering.`
- Fix: Use legacy consent sentence or document owner-approved shorter version.
