# Work packet (wave 2): edit src/modules/placements/tpo-global-requests-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

## G2-13-022-001  [P2] GAP  facet F01  effort M
- Legacy: GET /api/v1/tpo/requests/pending and POST /{requestId}/decide (TpoRequestController.java:16-45).
- vNext now: POST /api/placements/tpo/requests/{id}/decision only; inbox through server getTpoGlobalRequestsInbox (requests/[requestId]/decision/route.ts:8-15; tpo-global-requests-service.ts:12-35).
- Fix: Create explicit route adapter preserving pending/decode URLs for old clients.

## G2-13-022-002  [P2] GAP  facet F02  effort M
- Legacy: Controller returns raw List<StudentRequest> or StudentRequest, no envelope (TpoRequestController.java:30-45).
- vNext now: Decision returns {request:...} wrapper; inbox result query/paged (requests/[requestId]/decision/route.ts:14; tpo-global-requests-service.ts:21-35).
- Fix: Map status/body shapes in client SDK and tests.
