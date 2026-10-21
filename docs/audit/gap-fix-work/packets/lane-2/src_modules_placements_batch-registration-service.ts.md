# Work packet: edit src/modules/placements/batch-registration-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md, docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-15-023-017  [P2] GAP  facet F07  effort M
- Legacy: Legacy invalid choice 400/no content, closed window 409/no content. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:47-50`
- vNext now: vNext named errors DB08_* with visible messages. `src/components/placements/learner-placement-registration.tsx:18-23`, `src/modules/placements/batch-registration-service.ts:32-41`
- Fix: Map server code/status/message to UX.

## G2-15-023-018  [P2] GAP  facet F07  effort M
- Legacy: Legacy unknown choice exception explicit `Unknown registration choice`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:31-32`
- vNext now: vNext Zod invalid_enum error. `src/modules/placements/batch-registration-service.ts:27-30`
- Fix: Return safe exact field message.

## G2-16-023-021  [P3] GAP  facet F07  effort S
- Legacy: LearnerPlacementService.java:57 exact choice validation `Choose Placements, Higher studies or Not interested`.
- vNext now: batch-registration-service.ts:27-30 Zod enum error, UI errors:18-23 not exact.
- Fix: Restore exact invalid-choice friendly copy.
