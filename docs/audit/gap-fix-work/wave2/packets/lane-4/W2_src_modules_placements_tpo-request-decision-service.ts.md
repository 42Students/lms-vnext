# Work packet (wave 2): edit src/modules/placements/tpo-request-decision-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l13-u022-tpo-request-controller.md

## G2-13-022-038  [P2] GAP  facet F23  effort M
- Legacy: Only 2 endpoints, create/escalation/auto-settle work through services (TpoRequestController.java:30-57; TpoRequestService.java:198-243).
- vNext now: Routes split into server inbox and decision writer, stronger mutation guard (tpo-global-requests-service.ts:12-35; tpo-request-decision-service.ts:14-38).
- Fix: Document all former service side effects and new service ownership.
