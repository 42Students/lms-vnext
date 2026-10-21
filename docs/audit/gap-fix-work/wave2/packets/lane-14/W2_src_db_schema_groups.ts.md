# Work packet (wave 2): edit src/db/schema/groups.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-group-controller.md, docs/audit/gap2/lane-3/admin-group-controller.md

## G2-20-023-005  [P2] GAP  facet F04  effort M
- Legacy: Numeric group and college IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/groups/GroupView.java:13-16`
- vNext now: UUID group/membership IDs `src/db/schema/groups.ts:6-15,42-46`
- Fix: Map deep links

## G2-20-023-019  [P2] GAP  facet F15  effort M
- Legacy: Legacy membership service event publisher `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/groups/GroupMembershipService.java:63-72`
- vNext now: New group member events `src/db/schema/groups.ts:68-88`
- Fix: Check notifications on promotion

## G2-20-023-026  [P2] GAP  facet F22  effort M
- Legacy: Legacy numeric ID/memberType audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/groups/GroupMembershipService.java:95-110`
- vNext now: UUID member and event model `src/db/schema/groups.ts:42-88`
- Fix: Crosswalk database keys

## G2-3-024-046  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:233-265`
- vNext now: `src/db/schema/groups.ts:90-105`
- Fix: Legacy group rule criteria and autoRefresh vs VNext versioned JSON schema/lastRun snapshot; preserve safe read/write behavior and unsupported-criteria error.
