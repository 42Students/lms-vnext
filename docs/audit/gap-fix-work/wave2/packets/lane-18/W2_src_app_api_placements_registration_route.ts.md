# Work packet (wave 2): edit src/app/api/placements/registration/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-12-005-042  [P2] GAP  facet F10  effort S
- Legacy: Legacy register payload `{choice,consent}` to LearnerPlacementService `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerPlacementController.java:45-50`
- vNext now: VNext POST registration `{choice,acceptedConsent}` `src/app/api/placements/registration/route.ts:18-25`
- Fix: Translate request field names and consent version semantics

## G2-16-023-028  [P2] GAP  facet F10  effort M
- Legacy: LearnerPlacementController.java:24-50 GET overview/journey/process, POST register.
- vNext now: journey/me/route.ts:8-19 and registration/route.ts:11-28 split endpoints.
- Fix: Maintain endpoint method semantics and document response adapter.
