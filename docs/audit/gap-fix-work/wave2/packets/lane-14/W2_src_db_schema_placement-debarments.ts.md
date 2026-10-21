# Work packet (wave 2): edit src/db/schema/placement-debarments.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy debarment createdBy Integer and id Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementDebarment.java:19-48`
- vNext now: VNext UUID createdByUserId, membershipId,collegeId required `src/db/schema/placement-debarments.ts:16-48`
- Fix: Backfill legacy numeric IDs and audit actor within tenant.
