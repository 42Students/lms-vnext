# Work packet (wave 2): edit src/modules/electives/service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-4-024-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy offering shows course, class, group, capacity, seats left, faculty roster (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:43-58`)
- vNext now: New listElectiveOfferings returns group/course and active/waitlisted, but not faculty or backed class name (`src/modules/electives/service.ts:202-225`)
- Fix: Add class label and faculty names in offering row/expansion.

## G2-4-024-009  [P2] MISSING  facet F03  effort M
- Legacy: Offering badges seatsLeft, status, faculty role PRIMARY/CO_TEACHER (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:51-58,62-66`)
- vNext now: New offering projection has status, activeMembers, waitlistedCount, omits seatsLeft and faculty (`src/modules/electives/service.ts:208-225`)
- Fix: Compute seats left from capacity minus ACTIVE count and show role badges.

## G2-4-024-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy backer is actual class id/class name (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:49-52`)
- vNext now: New offering uses backedDeliveryId UUID, not backedClassId; delivery maps to section (`src/db/schema/electives.ts:34-39`; `src/modules/electives/service.ts:149-176`)
- Fix: Show corresponding section/class label from delivery and map migration class IDs.

## G2-4-024-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy slot count counts active offerings and active seat enrollments separately (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveViews.java:31-37`)
- vNext now: New offerings group projection has activeMembers and waitlistedCount (`src/modules/electives/service.ts:208-225`)
- Fix: Compute deduped unique learners and seat enrolments as distinct metrics.

## G2-4-024-070  [P2] GAP  facet F21  effort M
- Legacy: Legacy ElectiveService integrates group, classroom, teaching assignments and schedule (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:57-61,69-83`)
- vNext now: New electrive group/delivery checks include course offerings and membership kernel (`src/modules/electives/service.ts:91-200`)
- Fix: Check course/group/class/schedule closure after create/edit against original.
