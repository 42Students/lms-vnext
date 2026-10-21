# Work packet (wave 2): edit src/modules/placements/tpo-general-request-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-12/placement-cell.md

## G2-14-023-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:14,29-38 — one learner placement request endpoint for seven kinds.
- vNext now: src/app/api/placements/requests/route.ts:5-26 plus src/modules/placements/tpo-general-request-service.ts:91-145 — split job request and general request workflows.
- Fix: Expose unified learner request entry and history across request types.

## G2-14-023-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:19-22 — one TPO Requests card for all request kinds.
- vNext now: src/modules/placements/tpo-general-request-service.ts:80-90 — inAppNotification links /tpo/requests; general queue separate.
- Fix: Merge TPO queues or visibly group full type spectrum.

## G2-14-023-023  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:38-72 — transaction creates student_request, sends TPO audit bell.
- vNext now: src/modules/placements/tpo-general-request-service.ts:91-175 — writes general request+events+activity and inAppNotification.
- Fix: Preserve bell headline/recipient/target path parity.

## G2-14-023-025  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:48-64 — one open request per learner/type/drive, row locked to dedupe.
- vNext now: src/db/schema/placement-learner-general-requests.ts:27-29 and src/modules/placements/tpo-general-request-service.ts:147-166 — partial unique and replay policy.
- Fix: Compare duplicate scope/null job handling and race semantics.

## G2-14-023-035  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:65-70 — audit bell headline New <type> request to TPO.
- vNext now: src/modules/placements/tpo-general-request-service.ts:80-90 — in-app New student request title and A student needs your decision body.
- Fix: Align recipient notification copy and click-through.

## G2-14-023-040  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:53,68-69 — exact duplicate and bell sentence.
- vNext now: src/modules/placements/tpo-general-request-service.ts:80-90,156-160 — generic bell copy and replay no duplicate sentence.
- Fix: Align informational text and duplicate toast.

## G2-14-023-044  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:48-53 — concurrent create serialized; duplicate refused.
- vNext now: src/modules/placements/tpo-general-request-service.ts:147-166 — ON CONFLICT and exact-payload replay, different UX.
- Fix: Test double-submit, response loss and changed reason.

## G2-14-023-046  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRequestService.java:28-30,65-70,148-151 — audit bell and NotificationOutboxService.
- vNext now: src/modules/placements/tpo-general-request-service.ts:80-90,170-175 — direct in-app fanout and activity event.
- Fix: Compare deliverability, retries, dedupe and recipients.

## G2-12-005-074  [P2] GAP  facet F19  effort S
- Legacy: One unpaginated request list, potentially large `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:215-231`
- vNext now: New general request server read and separate specialized workspace `src/modules/placements/tpo-general-request-service.ts:182-185`
- Fix: Add pagination/cap with preserved newest-first order
