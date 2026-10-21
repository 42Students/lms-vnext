# Work packet (wave 2): edit src/db/schema/electives.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-4-024-012  [P2] GAP  facet F04  effort M
- Legacy: SlotView uses programName, semesterNumber, academicYear, credits, picks, createdAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:18-32`)
- vNext now: New slot schema holds IDs, academicPeriodId, version and timestamps (`src/db/schema/electives.ts:7-24`)
- Fix: Ensure program label, academic year and created IST display; don't replace semester with period name.

## G2-4-024-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy backer is actual class id/class name (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:49-52`)
- vNext now: New offering uses backedDeliveryId UUID, not backedClassId; delivery maps to section (`src/db/schema/electives.ts:34-39`; `src/modules/electives/service.ts:149-176`)
- Fix: Show corresponding section/class label from delivery and map migration class IDs.

## G2-4-024-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy LocalDateTime createdAt serialized naïvely (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:6,31`)
- vNext now: New timestamps timezone-aware (`src/db/schema/electives.ts:20-23`)
- Fix: Use IST display and documented migration interpretation.

## G2-4-024-052  [P2] GAP  facet F12  effort M
- Legacy: Legacy minPick<=maxPick; credits 0..30; maxPick unconstrained beyond positive (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:233-255`)
- vNext now: New maxPick<=100 and DB check min<=max (`src/modules/electives/college-slot-mutation-model.ts:5-9`; `src/db/schema/electives.ts:27-30`)
- Fix: Confirm 100 cap; avoid silent rejection for valid legacy values >100.

## G2-4-024-072  [P2] GAP  facet F22  effort M
- Legacy: Legacy integer slot/offering IDs, group and backed class (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:96-99,133-159`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:18-58`)
- vNext now: New UUID slot/offering/group/delivery tables (`src/db/schema/electives.ts:7-55`)
- Fix: Map source IDs and classroom-backed offering to deliveries and groups for migration.

## G2-9-007-071  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/electives/ElectiveSlot.java:66-79` — LocalDateTime and optimistic @Version Long
- vNext now: `src/db/schema/electives.ts:20-23` — Timestamptz, integer version, Asia/Kolkata roster rendering
- Fix: Validate IST and long-lived version overflow differences

## G2-9-007-074  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/electives/ElectiveSlot.java:22-79` — elective_slot Long/Integer keys, is_deleted Boolean, LocalDateTime, version Long
- vNext now: `src/db/schema/electives.ts:7-32` — elective_slots UUID keys, deleted_at timestamp, index/check constraints
- Fix: Document intentional schema mapping and migration parity
