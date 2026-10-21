# Work packet (wave 2): edit src/app/api/academics/schedule-events/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-001  [P2] GAP  facet F01  effort L
- Legacy: ClassScheduleController.java:42-47 has /api/v1/scheduleClass service route.
- vNext now: src/app/api/academics/schedule-events/route.ts:12-56 supports GET/POST for section events.
- Fix: Map all legacy schedule endpoints to UUID-scoped route/query contracts.

## G2-2-032-002  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:149-156 POST /create.
- vNext now: schedule-events/route.ts:31-56 POST event with typed payload.
- Fix: Migrate request field names, response envelope and success semantics.

## G2-2-032-023  [P2] GAP  facet F04  effort M
- Legacy: ClassScheduleController.java:222-235 wrapped Response(status,message,data) array.
- vNext now: schedule-events/route.ts:12-26 responds `{events}` and writes `{event}`.
- Fix: Update fetch adapters to nested shape and stable HTTP codes.
