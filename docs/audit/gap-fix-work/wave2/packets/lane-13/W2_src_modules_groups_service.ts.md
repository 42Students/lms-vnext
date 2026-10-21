# Work packet (wave 2): edit src/modules/groups/service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-group-controller.md, docs/audit/gap2/lane-3/admin-group-controller.md

## G2-20-023-009  [P2] GAP  facet F06  effort S
- Legacy: Join/leave no payload, acts as self `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:100-114`
- vNext now: New join mode SELF, member scope `src/modules/groups/service.ts:222-229`
- Fix: Wire no-body button actions

## G2-20-023-022  [P2] GAP  facet F18  effort S
- Legacy: Mine/open/join/leave copy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:56-114`
- vNext now: New GroupServiceError codes `src/modules/groups/service.ts:48-71`
- Fix: Restore labels/messages

## G2-20-023-025  [P2] GAP  facet F21  effort M
- Legacy: GroupJoinPolicy elective checks `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/groups/GroupMembershipService.java:49-50`
- vNext now: New elective pick cap `src/modules/groups/service.ts:112-123`
- Fix: Verify course eligibility

## G2-3-024-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`
- vNext now: `src/modules/groups/service.ts:222-352`, `src/modules/groups/college-group-detail-write-service.ts:83-133`
- Fix: Legacy member add supports numeric learner IDs/roll numbers, source MANUAL/CSV, note; VNext uses collegeMembership UUID identity and separate CSV dry-run. Build conversion and bulk add.

## G2-3-024-026  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:203-223`
- vNext now: `src/modules/groups/service.ts:604-715`, `src/modules/groups/college-group-detail-write-service.ts:99-133`
- Fix: Legacy membership states, lock bit and waitlist rules; VNext enforces queue-head promotion, CAS, capacity, membership status. Preserve legacy semantics and improved safety.

## G2-3-024-032  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`
- vNext now: `src/modules/groups/service.ts:126-144`
- Fix: Legacy bulk membership events recorded for manual/CSV additions, VNext write service records per-member events. Final CSV commit must emit events and avoid duplicate notifications.

## G2-3-024-040  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:141-146`
- vNext now: `src/modules/groups/service.ts:73-75`, `src/modules/groups/college-group-management-service.ts:118-181`
- Fix: Legacy reconcile counter via explicit operation; VNext membership writes guarded by row locks/version. Add repair path or show counter drift diagnostic.
