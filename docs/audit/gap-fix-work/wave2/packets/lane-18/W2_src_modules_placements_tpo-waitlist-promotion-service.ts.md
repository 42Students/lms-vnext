# Work packet (wave 2): edit src/modules/placements/tpo-waitlist-promotion-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/tpo-workspace-controller.md

## G2-20-021-005  [P2] GAP  facet F04  effort M
- Legacy: Integer job and Long round IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:43-59`
- vNext now: UUID IDs `src/modules/placements/tpo-waitlist-promotion-service.ts:14-46`
- Fix: Map deep links

## G2-20-021-029  [P2] GAP  facet F22  effort L
- Legacy: Legacy JobRound/JobOffer numeric `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:3-8`
- vNext now: New placement round/offer UUID `src/modules/placements/tpo-waitlist-promotion-service.ts:4-12`
- Fix: DDL/status crosswalk

## G2-20-021-025  [P3] GAP  facet F18  effort S
- Legacy: Legacy offer-next and auto-apply labels `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:165-179,230-238`
- vNext now: New reason text per waitlist row `src/modules/placements/tpo-waitlist-promotion-service.ts:69-88`
- Fix: Map exact copy
