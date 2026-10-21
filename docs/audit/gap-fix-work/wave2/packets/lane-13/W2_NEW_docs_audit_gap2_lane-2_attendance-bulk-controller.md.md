# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/attendance-bulk-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/attendance-bulk-controller.md

## G2-2-027-041  [P2] GAP  facet F10  effort M
- Legacy: AttendanceBulkController.java:82-88 POST bulk endpoint JSON body.
- vNext now: sessions/[scheduleEventId]/route.ts:13-33 PATCH JSON `deliveryId` and membership ID arrays.
- Fix: Change all caller URL/method/payload contracts or add compatibility adapter.
