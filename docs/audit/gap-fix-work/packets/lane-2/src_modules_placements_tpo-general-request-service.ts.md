# Work packet: edit src/modules/placements/tpo-general-request-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:51-53 — duplicate pending request message You already sent this request. The placement cell will answer it.
- vNext now: src/modules/placements/tpo-general-request-service.ts:147-159 — exact replay returns {replayed:true} if payload identical, otherwise TARGET_CHANGED.
- Fix: Keep clear duplicate feedback rather than silently replay.

## G2-14-023-021  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:53 — duplicate request rejection sentence.
- vNext now: src/modules/placements/tpo-general-request-service.ts:156-160 — duplicate identical returns replayed true.
- Fix: Expose request already sent message on replay.
