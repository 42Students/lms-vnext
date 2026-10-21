# Work packet (wave 2): edit src/app/api/college/faculty/[membershipId]/reassign-schedules/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-005  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:197-211 POST /bulk-reassign-faculty query old/new IDs.
- vNext now: src/app/api/college/faculty/[membershipId]/reassign-schedules/route.ts:15-21 POST replacementMembershipId,confirmed.
- Fix: Migrate to membership IDs, explicit confirmation and per-session report.
